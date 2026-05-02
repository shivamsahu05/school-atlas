const pool = require('../config/mysqlDb');

/**
 * NOTIFICATION EVENT ENGINE
 * Centralized dispatcher for all system events
 */
const notificationEventService = {
  /**
   * Main dispatcher
   * @param {string} eventType 
   * @param {Object} payload 
   */
  emitNotification: async (eventType, payload) => {
    try {
      console.log(`[NOTIF-EVENT] Emitting ${eventType}`, payload);

      switch (eventType) {
        // --- LEAVE SYSTEM ---
        case 'leave_request_created':
          // Admin & Principal Notif
          await create({
            type: 'leave',
            event_type: eventType,
            message: `New Leave Request from ${payload.userName}`,
            role_target: 'principal',
            reference_id: payload.leaveId,
            group_key: `leave-${payload.leaveId}`
          });
          await create({
            type: 'leave',
            event_type: eventType,
            message: `New Leave Request from ${payload.userName}`,
            role_target: 'admin',
            reference_id: payload.leaveId,
            group_key: `leave-${payload.leaveId}`
          });
          // Teacher Self-Notif
          if (payload.teacherUserId) {
            await create({
              type: 'leave',
              event_type: eventType,
              message: `Leave request submitted successfully (Pending Confirmation)`,
              role_target: 'teacher',
              user_id_target: payload.teacherUserId,
              reference_id: payload.leaveId,
              group_key: `leave-self-${payload.leaveId}`
            });
          }
          break;

        case 'leave_approved':
        case 'leave_rejected':
          const statusVerb = eventType.split('_')[1];
          await create({
            type: 'leave',
            event_type: eventType,
            message: `Your leave request has been ${statusVerb}${payload.remarks ? ': ' + payload.remarks : ''}`,
            role_target: 'teacher',
            user_id_target: payload.teacherUserId,
            reference_id: payload.leaveId,
            group_key: `leave-update-${payload.leaveId}`
          });
          break;

        // --- HOMEWORK / SYLLABUS BACKLOG (Aggregated) ---
        case 'homework_backlog_detected':
          const groupKey = `hw-backlog-${payload.classId}-${payload.subjectId}-${new Date().toISOString().slice(0,10)}`;
          const namesStr = payload.studentNames ? ` (${payload.studentNames})` : '';
          const message = `${payload.className} ${payload.subjectName} → ${payload.studentCount} students incomplete ${payload.topic}${namesStr}`;
          
          await upsert({
            type: 'alert',
            event_type: eventType,
            message,
            role_target: 'principal',
            group_key: groupKey
          });
          await upsert({
            type: 'alert',
            event_type: eventType,
            message,
            role_target: 'admin',
            group_key: groupKey
          });
          break;

        // --- EVENTS SYSTEM ---
        case 'school_event_created':
          await create({
            type: 'event',
            event_type: eventType,
            message: `New Event: ${payload.title} on ${payload.date}`,
            role_target: 'all',
            reference_id: payload.eventId,
            group_key: `event-${payload.eventId}`
          });
          break;

        // --- CONTACT MESSAGES ---
        case 'contact_message_received':
          await create({
            type: 'message',
            event_type: eventType,
            message: `New Inquiry from ${payload.senderName}: ${payload.subject}`,
            role_target: 'admin',
            reference_id: payload.messageId,
            group_key: `contact-${payload.messageId}`
          });
          break;

        // --- TEACHER ACTIONS ---
        case 'syllabus_updated':
          await create({
            type: 'info',
            event_type: eventType,
            message: `${payload.teacherName} updated syllabus for ${payload.className}`,
            role_target: 'admin',
            group_key: `syllabus-upd-${payload.teacherId}-${new Date().toISOString().slice(0,13)}`
          });
          break;

        case 'teacher_assigned':
          await create({
            type: 'info',
            event_type: eventType,
            message: `New subject assignment: ${payload.subjectName} for ${payload.className}`,
            role_target: 'teacher',
            user_id_target: payload.teacherUserId,
            group_key: `assign-${payload.teacherUserId}-${payload.subjectId}`
          });
          await create({
            type: 'info',
            event_type: eventType,
            message: `Teacher ${payload.teacherName} assigned to ${payload.subjectName} (${payload.className})`,
            role_target: 'admin',
            group_key: `assign-admin-${payload.teacherUserId}-${payload.subjectId}`
          });
          break;

        default:
          console.warn(`[NOTIF-EVENT] Unhandled event type: ${eventType}`);
      }
    } catch (err) {
      console.error('[NOTIF-EVENT] Dispatch Error:', err);
    }
  },

  /**
   * Fetch notifications based on role and optional user_id
   */
  getNotificationsByRole: async (role, userId = null) => {
    try {
      let sql = `
        SELECT * FROM notifications 
        WHERE (role_target = ? OR role_target = 'all')
      `;
      const params = [role];

      if (role === 'teacher' && userId) {
        sql += ` OR target_user_id = ? `;
        params.push(userId);
      }

      sql += ` ORDER BY created_at DESC LIMIT 50 `;
      
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('[NOTIF-EVENT] Fetch Error:', err);
      return [];
    }
  },

  markAsRead: async (id) => {
    try {
      await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    } catch (err) {
      console.error('[NOTIF-EVENT] Mark Read Error:', err);
    }
  },

  /**
   * Periodic check for expiring permissions
   */
  checkExpiringPermissions: async () => {
    try {
      const [expiring] = await pool.execute(`
        SELECT tmp.id, u.name as teacher_name, tmp.end_date, DATEDIFF(tmp.end_date, CURDATE()) as days_left
        FROM teacher_module_permissions tmp
        JOIN teachers t ON tmp.teacher_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE tmp.status = 'ACTIVE' 
        AND DATEDIFF(tmp.end_date, CURDATE()) BETWEEN 0 AND 3
      `);

      for (const p of expiring) {
        const groupKey = `perm-expiry-${p.id}`;
        await upsert({
          type: 'alert',
          event_type: 'permission_expiry',
          message: `Teacher ${p.teacher_name} permission expiring in ${p.days_left} days`,
          role_target: 'principal',
          group_key: groupKey
        });
        await upsert({
          type: 'alert',
          event_type: 'permission_expiry',
          message: `Teacher ${p.teacher_name} permission expiring in ${p.days_left} days`,
          role_target: 'admin',
          group_key: groupKey
        });
      }
    } catch (err) {
      console.error('[NOTIF-EVENT] Check Expiry Error:', err);
    }
  }
};

/**
 * Internal helper to insert notification
 */
async function create(data) {
  const { type, event_type, message, role_target, reference_id = null, group_key = null, user_id_target = null } = data;
  
  try {
    // Exact duplicate check
    const [existing] = await pool.execute(`
      SELECT id FROM notifications 
      WHERE group_key = ? AND role_target = ? AND message = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [group_key, role_target, message]);

    if (existing.length > 0 && group_key) return;

    await pool.execute(`
      INSERT INTO notifications (type, event_type, message, role_target, reference_id, group_key, target_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [type, event_type, message, role_target, reference_id, group_key, user_id_target]);
  } catch (err) {
    console.error('[NOTIF-EVENT] DB Create Error:', err);
  }
}

/**
 * Internal helper to update or insert
 */
async function upsert(data) {
  const { type, event_type, message, role_target, group_key } = data;
  
  try {
    const [existing] = await pool.execute(`
      SELECT id FROM notifications 
      WHERE group_key = ? AND role_target = ? AND is_read = FALSE
    `, [group_key, role_target]);

    if (existing.length > 0) {
      await pool.execute(`
        UPDATE notifications SET message = ?, updated_at = NOW() WHERE id = ?
      `, [message, existing[0].id]);
    } else {
      await create(data);
    }
  } catch (err) {
    console.error('[NOTIF-EVENT] DB Upsert Error:', err);
  }
}

module.exports = notificationEventService;
