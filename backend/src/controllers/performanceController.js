const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/** GET /api/performance/all - Admin only */
const getAllPerformance = async (req, res) => {
  try {
    const scores = await prisma.performance_scores.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            teacher_subjects: {
              include: {
                subject: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { overall_score: 'desc' }
    });

    const formatted = scores.map(s => ({
      id: s.id,
      teacherId: s.teacher_id,
      name: s.teacher.name,
      subject: s.teacher.teacher_subjects[0]?.subject?.name || 'N/A',
      syllabus: Number(s.syllabus_completion_pct || 0),
      lo: Number(s.lo_avg_pct || 0),
      observation: Number(s.observation_pct || 0),
      other: Number(s.other_score || 0),
      overall: Number(s.overall_score || 0)
    }));

    return sendSuccess(res, formatted);
  } catch (err) {
    console.error('getAllPerformance Error:', err);
    return sendError(res, 'Failed to fetch performance scores.', 500);
  }
};

/** GET /api/performance/teacher/:id - Scoped */
const getTeacherPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = Number(id);

    // If teacher, they can only see their own
    if (req.user.role === 'teacher' && req.user.id !== teacherId) {
      return sendError(res, 'Access denied.', 403);
    }

    const score = await prisma.performance_scores.findUnique({
      where: { teacher_id: teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            teacher_subjects: {
              include: {
                subject: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!score) {
      return sendError(res, 'No performance data found for this teacher.', 404);
    }

    const formatted = {
      id: score.id,
      teacherId: score.teacher_id,
      name: score.teacher.name,
      subject: score.teacher.teacher_subjects[0]?.subject?.name || 'N/A',
      syllabus: Number(score.syllabus_completion_pct || 0),
      lo: Number(score.lo_avg_pct || 0),
      observation: Number(score.observation_pct || 0),
      other: Number(score.other_score || 0),
      overall: Number(score.overall_score || 0)
    };

    return sendSuccess(res, formatted);
  } catch (err) {
    console.error('getTeacherPerformance Error:', err);
    return sendError(res, 'Failed to fetch performance score.', 500);
  }
};

module.exports = { getAllPerformance, getTeacherPerformance };
