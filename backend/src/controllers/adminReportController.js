const pool = require('../config/mysqlDb');

const adminReportController = {
  getCompletionReport: async (req, res) => {
    try {
      const { class_id, section_id, subject_id, week, search } = req.query;
      console.log("REPORTS: Starting Dynamic Aggregation", { class_id, subject_id, week });

      // 1. TOTAL STUDENTS (Independent Query - Core Requirement)
      // We use a separate query to ensure the baseline count is NEVER 0 if students exist
      const [[{ total: totalActiveStudents }]] = await pool.execute(
        "SELECT COUNT(*) as total FROM students WHERE status = 'Active' OR status = 'active'"
      );
      console.log("REPORTS: Total Students Baseline:", totalActiveStudents);

      // 2. MAIN REPORT DATA
      // Using LEFT JOINs only to ensure no students are filtered out due to missing activity
      let conditions = ["1=1"];
      let params = [];

      if (class_id && class_id !== '') {
        conditions.push("st.class_id = ?");
        params.push(class_id);
      }
      if (section_id && section_id !== '') {
        conditions.push("st.section_id = ?");
        params.push(section_id);
      }
      if (search && search !== '') {
        conditions.push("st.name LIKE ?");
        params.push(`%${search}%`);
      }

      // Filter logic: If week is provided, we filter the activity, but we keep the LEFT JOIN structure
      // to ensure students still appear.
      const query = `
        SELECT 
          st.id as student_id,
          st.name as student_name,
          ac.name as class_name,
          asec.name as section_name,
          sub.name as subject_name,
          hs.status as hw_status,
          ms2.status as nb_status,
          COALESCE(ms2.submitted_at, hs.submission_date) as activity_date
        FROM students st
        LEFT JOIN academic_classes ac ON st.class_id = ac.id
        LEFT JOIN acad_sections asec ON st.section_id = asec.id
        LEFT JOIN subjects sub ON (1=1 ${subject_id ? "AND sub.id = ?" : ""})
        LEFT JOIN homework hw ON hw.class_id = st.class_id AND hw.subject_id = sub.id
        LEFT JOIN homework_submissions hs ON hs.homework_id = hw.id AND hs.student_id = st.id
        LEFT JOIN micro_schedule_student_status ms2 ON ms2.student_id = st.id
        WHERE ${conditions.join(" AND ")}
        GROUP BY st.id, sub.id
        ORDER BY st.name ASC
        LIMIT 500
      `;

      if (subject_id) params.unshift(subject_id); // Add subject_id to params if it was used in sub join

      console.log("REPORTS: Executing Main Join...");
      const [rows] = await pool.execute(query, params);
      console.log("REPORTS: Fetched Rows:", rows.length);

      // 3. PROCESS DATA (Logic: Treat NULL/MISSING as Incomplete)
      const processedData = rows.map(r => {
        // Business Rule: hs.status = 'submitted' is Complete
        const homeworkStatus = (r.hw_status === 'submitted' || r.hw_status === 'COMPLETED') ? 'Complete' : 'Incomplete';
        
        // Business Rule: ms2.status = 'COMPLETED' is Checked (equivalent to checked=1)
        const notebookStatus = (r.nb_status === 'COMPLETED') ? 'Checked' : 'Pending';
        
        const verificationStatus = (homeworkStatus === 'Complete' && notebookStatus === 'Checked') ? 'Verified' : 'Not Verified';

        return {
          student_id: r.student_id,
          name: r.student_name,
          class: r.class_name || 'N/A',
          section: (r.section_name || 'N/A').replace('section ', '').toUpperCase(),
          subject: r.subject_name || 'N/A',
          week: week || 'Current Week',
          homeworkStatus,
          notebookStatus,
          verificationStatus,
          lastUpdated: r.activity_date ? new Date(r.activity_date).toISOString().split('T')[0] : 'N/A'
        };
      });

      // 4. SUMMARY CALCULATION (From the processed set)
      const homeworkCompleteCount = processedData.filter(d => d.homeworkStatus === 'Complete').length;
      const notebookCheckedCount = processedData.filter(d => d.notebookStatus === 'Checked').length;
      const bothCompleteCount = processedData.filter(d => d.verificationStatus === 'Verified').length;
      
      // Percentage of total possible student-subject interactions
      const overallCompletion = processedData.length > 0 ? Math.round((bothCompleteCount / processedData.length) * 100) : 0;

      // 5. INCOMPLETE STUDENTS (Rule: Students missing ANY work)
      const incompleteMap = {};
      processedData.forEach(d => {
        if (d.verificationStatus !== 'Verified') {
          if (!incompleteMap[d.student_id]) {
            incompleteMap[d.student_id] = {
              studentName: d.name,
              class: `${d.class}-${d.section}`,
              issues: []
            };
          }
          if (d.homeworkStatus !== 'Complete') incompleteMap[d.student_id].issues.push(`Homework missing (${d.subject})`);
          if (d.notebookStatus !== 'Checked') incompleteMap[d.student_id].issues.push(`Notebook unchecked (${d.subject})`);
        }
      });

      return res.json({
        success: true,
        summary: {
          totalStudents: totalActiveStudents,
          homeworkComplete: homeworkCompleteCount,
          notebookChecked: notebookCheckedCount,
          bothComplete: bothCompleteCount,
          overallCompletion
        },
        incompleteStudents: Object.values(incompleteMap).slice(0, 20),
        detailedData: processedData
      });

    } catch (error) {
      console.error("🔥 CRITICAL REPORTS FAILURE:", error);
      res.status(200).json({
        success: false,
        summary: { totalStudents: 0, homeworkComplete: 0, notebookChecked: 0, bothComplete: 0, overallCompletion: 0 },
        detailedData: [],
        message: error.message
      });
    }
  },

  exportCompletionReport: async (req, res) => {
    res.status(200).send("CSV Export coming soon");
  }
};

module.exports = adminReportController;
