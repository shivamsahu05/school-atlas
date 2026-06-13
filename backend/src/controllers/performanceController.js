const pool = require('../config/mysqlDb');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to ensure the overrides table exists
const ensureOverridesTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS teacher_performance_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT UNIQUE NOT NULL,
      participate_score DECIMAL(5,2) DEFAULT NULL,
      other_score DECIMAL(5,2) DEFAULT NULL,
      lang_score DECIMAL(5,2) DEFAULT NULL,
      overall_score DECIMAL(5,2) DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

/**
 * Helper: compute auto-calculated values for a given teacher (user_id)
 * Returns { syllabus, lo, observation }
 */
const getAutoScores = async (userId) => {
  // Syllabus Completion from micro-schedule
  const [syllabusRows] = await pool.execute(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN is_completed = 1 OR status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM syllabus
    WHERE teacher_id = ?
  `, [userId]);
  const total = Number(syllabusRows[0]?.total || 0);
  const completed = Number(syllabusRows[0]?.completed || 0);
  const syllabus = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

  // LO Achievement from Award LO module (teacher_performance_lo)
  // teacher_performance_lo uses teacher profile id (teachers.id), not user id
  let lo = 0;
  try {
    const [tProfileRows] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (tProfileRows && tProfileRows.length > 0) {
      const profileId = tProfileRows[0].id;
      const [loRows] = await pool.execute(
        'SELECT AVG(principal_score) AS avg_lo FROM teacher_performance_lo WHERE teacher_id = ?',
        [profileId]
      );
      lo = loRows[0]?.avg_lo != null ? parseFloat(Number(loRows[0].avg_lo).toFixed(1)) : 0;
    }
  } catch (e) {
    console.warn('LO score fetch failed:', e.message);
  }

  // Observation Score from class_observations
  const [obsRows] = await pool.execute(`
    SELECT AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS avg_obs
    FROM class_observations
    WHERE teacher_id = ?
  `, [userId]);
  const observation = parseFloat(Number(obsRows[0]?.avg_obs || 0).toFixed(1));

  return { syllabus, lo, observation };
};

/** GET /api/performance/all - Admin only */
const getAllPerformance = async (req, res) => {
  try {
    await ensureOverridesTable();

    // Fetch all active teachers
    const [teacherRows] = await pool.execute(`
      SELECT 
        u.id AS teacherId,
        u.name,
        COALESCE(sub.name, 'N/A') AS subject,
        o.participate_score AS o_participate,
        o.other_score AS o_other,
        o.lang_score AS o_lang,
        o.overall_score AS o_overall,
        o.remarks AS o_remarks
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects sub ON ts.subject_id = sub.id
      LEFT JOIN teacher_performance_overrides o ON u.id = o.teacher_id
      WHERE u.role = 'teacher' AND t.status = 'active' AND t.is_deleted = 0
      GROUP BY u.id
      ORDER BY u.name ASC
    `);

    const formatted = await Promise.all(teacherRows.map(async (r) => {
      // Auto-calculated values
      const auto = await getAutoScores(r.teacherId);

      const syllabus   = auto.syllabus;
      const lo         = auto.lo;
      const observation = auto.observation;

      // Admin-manual values (0 if not set)
      const participate = r.o_participate !== null && r.o_participate !== undefined ? Number(r.o_participate) : 0;
      const other       = r.o_other       !== null && r.o_other       !== undefined ? Number(r.o_other)       : 0;
      const lang        = r.o_lang        !== null && r.o_lang        !== undefined ? Number(r.o_lang)        : 0;
      const adminScoresSet = (r.o_participate !== null || r.o_other !== null || r.o_lang !== null);

      const remarks = r.o_remarks || '';

      // Overall: use admin manual override if set, else compute from formula
      let overall;
      if (r.o_overall !== null && r.o_overall !== undefined) {
        overall = Number(r.o_overall);
      } else {
        overall = parseFloat((
          (syllabus    * 0.15) +
          (lo          * 0.15) +
          (observation * 0.25) +
          (participate * 0.10) +
          (other       * 0.20) +
          (lang        * 0.15)
        ).toFixed(1));
      }

      return {
        id: r.teacherId,
        teacherId: r.teacherId,
        name: r.name,
        subject: r.subject,
        syllabus,
        lo,
        observation,
        participate,
        other,
        lang,
        overall,
        remarks,
        adminScoresSet,
        // Keep isOverridden for badge compat
        isOverridden: adminScoresSet || (r.o_overall !== null && r.o_overall !== undefined)
      };
    }));

    // Sort by overall descending
    formatted.sort((a, b) => b.overall - a.overall);

    return sendSuccess(res, formatted);
  } catch (err) {
    console.error('getAllPerformance Error:', err);
    return sendError(res, 'Failed to fetch performance scores.', 500);
  }
};

/** GET /api/performance/teacher/:id - Scoped */
const getTeacherPerformance = async (req, res) => {
  try {
    await ensureOverridesTable();
    const { id } = req.params;
    const teacherId = Number(id);

    // If teacher, they can only see their own
    if (req.user.role === 'teacher' && req.user.id !== teacherId) {
      return sendError(res, 'Access denied.', 403);
    }

    // Check teacher exists
    const [teacherCheck] = await pool.execute(`
      SELECT u.id, u.name, COALESCE(sub.name, 'N/A') AS subject
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects sub ON ts.subject_id = sub.id
      WHERE u.id = ? AND t.is_deleted = 0
      LIMIT 1
    `, [teacherId]);

    if (teacherCheck.length === 0) {
      return sendError(res, 'No performance data found for this teacher.', 404);
    }

    const tRow = teacherCheck[0];
    const auto = await getAutoScores(teacherId);

    // Read admin overrides
    const [overrideRows] = await pool.execute(
      'SELECT * FROM teacher_performance_overrides WHERE teacher_id = ?',
      [teacherId]
    );
    const o = overrideRows[0] || {};

    const participate = o.participate_score != null ? Number(o.participate_score) : 0;
    const other       = o.other_score       != null ? Number(o.other_score)       : 0;
    const lang        = o.lang_score        != null ? Number(o.lang_score)        : 0;
    const remarks     = o.remarks || '';
    const adminScoresSet = (o.participate_score != null || o.other_score != null || o.lang_score != null);

    let overall;
    if (o.overall_score != null) {
      overall = Number(o.overall_score);
    } else {
      overall = parseFloat((
        (auto.syllabus    * 0.15) +
        (auto.lo          * 0.15) +
        (auto.observation * 0.25) +
        (participate      * 0.10) +
        (other            * 0.20) +
        (lang             * 0.15)
      ).toFixed(1));
    }

    return sendSuccess(res, {
      id: tRow.id,
      teacherId: tRow.id,
      name: tRow.name,
      subject: tRow.subject,
      syllabus: auto.syllabus,
      lo: auto.lo,
      observation: auto.observation,
      participate,
      other,
      lang,
      overall,
      remarks,
      adminScoresSet,
      isOverridden: adminScoresSet || o.overall_score != null
    });
  } catch (err) {
    console.error('getTeacherPerformance Error:', err);
    return sendError(res, 'Failed to fetch performance score.', 500);
  }
};

/** POST /api/performance/override - Save/Update admin manual inputs (participate, other, lang only) */
const savePerformanceOverride = async (req, res) => {
  try {
    await ensureOverridesTable();
    const {
      teacher_id,
      participate_score,
      other_score,
      lang_score,
      overall_score,
      remarks
    } = req.body;

    if (!teacher_id) {
      return sendError(res, 'teacher_id is required', 400);
    }

    // Validate ranges 0-100
    for (const [field, val] of [['participate_score', participate_score], ['other_score', other_score], ['lang_score', lang_score]]) {
      if (val !== null && val !== undefined) {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0 || n > 100) {
          return sendError(res, `${field} must be between 0 and 100`, 400);
        }
      }
    }

    const sql = `
      INSERT INTO teacher_performance_overrides (
        teacher_id,
        participate_score,
        other_score,
        lang_score,
        overall_score,
        remarks
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        participate_score = VALUES(participate_score),
        other_score = VALUES(other_score),
        lang_score = VALUES(lang_score),
        overall_score = VALUES(overall_score),
        remarks = VALUES(remarks)
    `;

    await pool.execute(sql, [
      teacher_id,
      participate_score !== undefined ? participate_score : null,
      other_score       !== undefined ? other_score       : null,
      lang_score        !== undefined ? lang_score        : null,
      overall_score     !== undefined ? overall_score     : null,
      remarks           !== undefined ? remarks           : null
    ]);

    return sendSuccess(res, null, 'Performance saved successfully.');
  } catch (err) {
    console.error('savePerformanceOverride Error:', err);
    return sendError(res, 'Failed to save performance inputs.', 500);
  }
};

module.exports = { getAllPerformance, getTeacherPerformance, savePerformanceOverride };
