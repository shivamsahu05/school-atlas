const pool = require('../config/mysqlDb');

const getUnifiedNotifications = async (userId, userRole) => {
  try {
    // Fetch Teacher ID if it's a teacher
    let teacherId = null;
    if (userRole === 'teacher') {
      const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
      teacherId = teachers[0]?.id;
    }

    // 1. Leave Requests
    const leaveSql = userRole === 'admin' 
      ? `SELECT lr.id, 'leave' as type, 'New Leave Request' as title, 
          CONCAT(u.name, ' requested ', DATEDIFF(lr.to_date, lr.from_date) + 1, ' days leave') as message,
          lr.created_at as date
         FROM leave_requests lr
         JOIN teachers t ON lr.teacher_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE lr.status = 'Pending'
         ORDER BY lr.created_at DESC LIMIT 15`
      : `SELECT lr.id, 'leave' as type, 'Leave Update' as title, 
          CONCAT('Your leave request is ', lr.status) as message,
          lr.updated_at as date
         FROM leave_requests lr
         WHERE lr.teacher_id = ?
         ORDER BY lr.updated_at DESC LIMIT 15`;
    
    const [leaves] = await pool.execute(leaveSql, userRole === 'admin' ? [] : [teacherId]);

    // 2. Incomplete Work
    const incompleteSql = userRole === 'admin'
      ? `SELECT MIN(mst.id) as id, 'alert' as type, 'Incomplete Work' as title, 
          CONCAT(mst.class_number, ' ', mst.section_name, ' ', sub.name, ' - ', COUNT(mst.student_id), ' students incomplete') as message,
          MAX(mst.created_at) as date
         FROM micro_schedule_tracking mst
         JOIN subjects sub ON mst.subject_id = sub.id
         WHERE mst.status = 'NOT_COMPLETED'
         GROUP BY mst.class_number, mst.section_name, mst.subject_id, DATE(mst.created_at)
         ORDER BY date DESC LIMIT 15`
      : `SELECT MIN(mst.id) as id, 'alert' as type, 'Class Incomplete' as title, 
          CONCAT(mst.class_number, ' ', mst.section_name, ' ', sub.name, ' topic incomplete') as message,
          MAX(mst.created_at) as date
         FROM micro_schedule_tracking mst
         JOIN subjects sub ON mst.subject_id = sub.id
         WHERE mst.status = 'NOT_COMPLETED' AND mst.teacher_id = ?
         GROUP BY mst.class_number, mst.section_name, mst.subject_id, DATE(mst.created_at)
         ORDER BY date DESC LIMIT 15`;
    
    const [incomplete] = await pool.execute(incompleteSql, userRole === 'admin' ? [] : [teacherId]);

    // 3. Events
    const [events] = await pool.execute(`
      SELECT id, 'event' as type, 'New Event Scheduled' as title, 
        CONCAT(title, ' scheduled for ', DATE_FORMAT(event_date, '%d %b')) as message,
        created_at as date
      FROM school_events 
      ORDER BY created_at DESC LIMIT 15
    `);

    // 4. Assignments
    const assignmentSql = userRole === 'admin'
      ? `SELECT tmp.id, 'message' as type, 'Teacher Assigned' as title, 
          CONCAT(u.name, ' assigned to Grade ', ac.class_number) as message,
          tmp.created_at as date
         FROM teacher_module_permissions tmp
         JOIN teachers t ON tmp.teacher_id = t.id
         JOIN users u ON t.user_id = u.id
         JOIN academic_classes ac ON tmp.class_id = ac.id
         ORDER BY tmp.created_at DESC LIMIT 15`
      : `SELECT tmp.id, 'message' as type, 'New Class Assigned' as title, 
          CONCAT('You are assigned to Grade ', ac.class_number) as message,
          tmp.created_at as date
         FROM teacher_module_permissions tmp
         JOIN academic_classes ac ON tmp.class_id = ac.id
         WHERE tmp.teacher_id = ?
         ORDER BY tmp.created_at DESC LIMIT 15`;

    const [assignments] = await pool.execute(assignmentSql, userRole === 'admin' ? [] : [teacherId]);

    // 5. Contact Messages (Admin only)
    let messages = [];
    if (userRole === 'admin') {
      [messages] = await pool.execute(`
        SELECT id, 'message' as type, 'New Inquiry' as title, 
          CONCAT(full_name, ': ', subject) as message,
          created_at as date
        FROM contact_messages 
        WHERE status = 'new'
        ORDER BY created_at DESC LIMIT 15
      `);
    }

    // Merge and format
    const all = [
      ...leaves,
      ...incomplete,
      ...events,
      ...assignments,
      ...messages
    ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50)
    .map(n => ({
      id: `${n.type}-${n.id}-${new Date(n.date).getTime()}`,
      type: n.type,
      title: n.title,
      text: n.message,
      time: n.date,
      read: false
    }));

    return all;
  } catch (err) {
    console.error('Unified Notification Fetch Error:', err);
    return [];
  }
};

module.exports = { getUnifiedNotifications };
