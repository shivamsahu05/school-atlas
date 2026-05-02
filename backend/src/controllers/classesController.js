// src/controllers/classesController.js
const pool = require('../config/mysqlDb');

/**
 * GET /api/classes
 * Fetch from "classes" table and map "class_name" to "name" for frontend compatibility.
 */
exports.getClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name AS class_name 
      FROM academic_classes 
      ORDER BY id
    `);

    res.json({
      success: true,
      data: rows,
      classes: rows
    });

  } catch (error) {
    console.error("GET CLASSES ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load classes"
    });
  }
};

/**
 * GET /api/classes/:classId/sections
 */
exports.getClassSections = async (req, res) => {
  try {
    const { classId } = req.params;
    const sql = `
      SELECT s.id, s.name AS section_name
      FROM acad_class_sections cs
      JOIN acad_sections s ON s.id = cs.section_id
      WHERE cs.class_id = ?
    `;
    const [rows] = await pool.execute(sql, [classId]);
    return res.status(200).json({ success: true, data: rows, sections: rows });
  } catch (error) {
    console.error('GET SECTIONS ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch sections.' });
  }
};

/**
 * Other methods (standard CRUD)
 */
exports.createClass = async (req, res) => { /* ... */ };
exports.updateClass = async (req, res) => { /* ... */ };
exports.deleteClass = async (req, res) => { /* ... */ };
