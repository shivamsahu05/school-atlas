const pool = require('../config/mysqlDb');
const notificationEventService = require('../utils/notificationEventService');

/**
 * POST /api/contact
 * Saves a contact message to the database using mysql2 prepared statements.
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body;

    // 1. Validation
    if (!full_name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (full_name, email, subject, message) are required.'
      });
    }

    // 2. Database Insertion (Safe Prepared Statement via mysql2)
    const sql = `
      INSERT INTO contact_messages (full_name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `;
    const values = [full_name, email, subject, message];

    // Execute the query using the pool
    const [result] = await pool.execute(sql, values);

    // 3. Success Response
    if (result.affectedRows > 0) {
      // Emit Event
      await notificationEventService.emitNotification('contact_message_received', {
        messageId: result.insertId,
        senderName: full_name,
        subject: subject
      });

      return res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully!'
      });
    } else {
      throw new Error('Failed to insert record.');
    }

  } catch (error) {
    console.error('Contact Form Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

/**
 * GET /api/contact
 * Fetches all contact messages sorted by latest.
 */
exports.getMessages = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

/**
 * PATCH /api/contact/:id/status
 */
exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.execute('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json({ success: true, message: `Status updated to ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

/**
 * DELETE /api/contact/:id
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};
