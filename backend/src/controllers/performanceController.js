const pool = require('../config/mysqlDb');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to ensure the overrides table exists
const ensureOverridesTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS teacher_performance_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT UNIQUE NOT NULL,
      syllabus_completion_pct DECIMAL(5,2) DEFAULT NULL,
      lo_avg_pct DECIMAL(5,2) DEFAULT NULL,
      observation_pct DECIMAL(5,2) DEFAULT NULL,
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

/** GET /api/performance/all - Admin only */
const getAllPerformance = async (req, res) => {
  try {
    await ensureOverridesTable();

    const query = `
      SELECT 
        u.id AS teacherId, 
        u.name,
        COALESCE(sub.name, 'N/A') AS subject,
        ps.syllabus_completion_pct,
        ps.lo_avg_pct,
        ps.observation_pct,
        ps.other_score,
        ps.overall_score,
        o.syllabus_completion_pct AS o_syllabus,
        o.lo_avg_pct AS o_lo,
        o.observation_pct AS o_observation,
        o.participate_score AS o_participate,
        o.other_score AS o_other,
        o.lang_score AS o_lang,
        o.overall_score AS o_overall,
        o.remarks AS o_remarks
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects sub ON ts.subject_id = sub.id
      LEFT JOIN performance_scores ps ON u.id = ps.teacher_id
      LEFT JOIN teacher_performance_overrides o ON u.id = o.teacher_id
      WHERE u.role = 'teacher' AND t.status = 'active' AND t.is_deleted = 0
      GROUP BY u.id
      ORDER BY u.name ASC
    `;

    const [rows] = await pool.execute(query);

    const formatted = rows.map(r => {
      let syllabus = Number(r.syllabus_completion_pct || 0);
      let lo = Number(r.lo_avg_pct || 0);
      let observation = Number(r.observation_pct || 0);
      let participate = 0; // Default calculated on the fly in dashboard or 0
      let other = Number(r.other_score || 0);
      let lang = 0; // Default
      let overall = Number(r.overall_score || 0);
      let remarks = '';
      let isOverridden = false;

      if (r.o_syllabus !== null) { syllabus = Number(r.o_syllabus); isOverridden = true; }
      if (r.o_lo !== null) { lo = Number(r.o_lo); isOverridden = true; }
      if (r.o_observation !== null) { observation = Number(r.o_observation); isOverridden = true; }
      if (r.o_participate !== null) { participate = Number(r.o_participate); isOverridden = true; }
      if (r.o_other !== null) { other = Number(r.o_other); isOverridden = true; }
      if (r.o_lang !== null) { lang = Number(r.o_lang); isOverridden = true; }
      if (r.o_overall !== null) { overall = Number(r.o_overall); isOverridden = true; }
      else if (isOverridden) {
        // Recalculate weighted score: Syllabus (15%) + LO (15%) + Obs (25%) + Participate (10%) + Other (20%) + Language (15%)
        const totalWeighted = 
          (syllabus * 0.15) + 
          (lo * 0.15) + 
          (observation * 0.25) + 
          (participate * 0.10) + 
          (other * 0.20) + 
          (lang * 0.15);
        overall = Number(totalWeighted.toFixed(1));
      }
      if (r.o_remarks !== null) remarks = r.o_remarks;

      return {
        id: r.teacherId, // align with UI expectations
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
        isOverridden
      };
    });

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

    const query = `
      SELECT 
        u.id AS teacherId, 
        u.name,
        COALESCE(sub.name, 'N/A') AS subject,
        ps.syllabus_completion_pct,
        ps.lo_avg_pct,
        ps.observation_pct,
        ps.other_score,
        ps.overall_score,
        o.syllabus_completion_pct AS o_syllabus,
        o.lo_avg_pct AS o_lo,
        o.observation_pct AS o_observation,
        o.participate_score AS o_participate,
        o.other_score AS o_other,
        o.lang_score AS o_lang,
        o.overall_score AS o_overall,
        o.remarks AS o_remarks
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects sub ON ts.subject_id = sub.id
      LEFT JOIN performance_scores ps ON u.id = ps.teacher_id
      LEFT JOIN teacher_performance_overrides o ON u.id = o.teacher_id
      WHERE u.id = ? AND t.is_deleted = 0
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [teacherId]);

    if (rows.length === 0) {
      return sendError(res, 'No performance data found for this teacher.', 404);
    }

    const r = rows[0];
    let syllabus = Number(r.syllabus_completion_pct || 0);
    let lo = Number(r.lo_avg_pct || 0);
    let observation = Number(r.observation_pct || 0);
    let participate = 0;
    let other = Number(r.other_score || 0);
    let lang = 0;
    let overall = Number(r.overall_score || 0);
    let remarks = '';
    let isOverridden = false;

    if (r.o_syllabus !== null) { syllabus = Number(r.o_syllabus); isOverridden = true; }
    if (r.o_lo !== null) { lo = Number(r.o_lo); isOverridden = true; }
    if (r.o_observation !== null) { observation = Number(r.o_observation); isOverridden = true; }
    if (r.o_participate !== null) { participate = Number(r.o_participate); isOverridden = true; }
    if (r.o_other !== null) { other = Number(r.o_other); isOverridden = true; }
    if (r.o_lang !== null) { lang = Number(r.o_lang); isOverridden = true; }
    if (r.o_overall !== null) { overall = Number(r.o_overall); isOverridden = true; }
    else if (isOverridden) {
      const totalWeighted = 
        (syllabus * 0.15) + 
        (lo * 0.15) + 
        (observation * 0.25) + 
        (participate * 0.10) + 
        (other * 0.20) + 
        (lang * 0.15);
      overall = Number(totalWeighted.toFixed(1));
    }
    if (r.o_remarks !== null) remarks = r.o_remarks;

    const formatted = {
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
      isOverridden
    };

    return sendSuccess(res, formatted);
  } catch (err) {
    console.error('getTeacherPerformance Error:', err);
    return sendError(res, 'Failed to fetch performance score.', 500);
  }
};

/** POST /api/performance/override - Save/Update manual inputs */
const savePerformanceOverride = async (req, res) => {
  try {
    await ensureOverridesTable();
    const {
      teacher_id,
      syllabus_completion_pct,
      lo_avg_pct,
      observation_pct,
      participate_score,
      other_score,
      lang_score,
      overall_score,
      remarks
    } = req.body;

    if (!teacher_id) {
      return sendError(res, 'teacher_id is required', 400);
    }

    const sql = `
      INSERT INTO teacher_performance_overrides (
        teacher_id,
        syllabus_completion_pct,
        lo_avg_pct,
        observation_pct,
        participate_score,
        other_score,
        lang_score,
        overall_score,
        remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        syllabus_completion_pct = VALUES(syllabus_completion_pct),
        lo_avg_pct = VALUES(lo_avg_pct),
        observation_pct = VALUES(observation_pct),
        participate_score = VALUES(participate_score),
        other_score = VALUES(other_score),
        lang_score = VALUES(lang_score),
        overall_score = VALUES(overall_score),
        remarks = VALUES(remarks)
    `;

    await pool.execute(sql, [
      teacher_id,
      syllabus_completion_pct !== undefined ? syllabus_completion_pct : null,
      lo_avg_pct !== undefined ? lo_avg_pct : null,
      observation_pct !== undefined ? observation_pct : null,
      participate_score !== undefined ? participate_score : null,
      other_score !== undefined ? other_score : null,
      lang_score !== undefined ? lang_score : null,
      overall_score !== undefined ? overall_score : null,
      remarks !== undefined ? remarks : null
    ]);

    return sendSuccess(res, null, 'Performance manual inputs saved successfully.');
  } catch (err) {
    console.error('savePerformanceOverride Error:', err);
    return sendError(res, 'Failed to save performance inputs.', 500);
  }
};

module.exports = { getAllPerformance, getTeacherPerformance, savePerformanceOverride };
