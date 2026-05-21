const express = require('express');
const router = express.Router();

const ExcelJS = require('exceljs');

const { feedbackPool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────
// EXPORT EXCEL
// GET /api/export/excel
// ─────────────────────────────────────────────

router.get('/excel', authMiddleware, async (req, res) => {

  const { ids } = req.query;

  try {

    let query = `
      SELECT *
      FROM feedback_responses
    `;

    let params = [];

    // ─────────────────────────────
    // EXPORT SELECTION
    // ─────────────────────────────

    if (ids && ids !== 'all') {

      const idArray = ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (idArray.length === 0) {

        return res.status(400).json({
          error: 'Aucun ID valide'
        });

      }

      query += `
        WHERE id = ANY($1)
      `;

      params = [idArray];

    }

    query += `
      ORDER BY submitted_at DESC
    `;

    const { rows } = await feedbackPool.query(
      query,
      params
    );

    if (rows.length === 0) {

      return res.status(404).json({
        error: 'Aucune réponse trouvée'
      });

    }

    console.log(`✅ ${rows.length} réponses exportées`);

    // ─────────────────────────────
    // CREATE WORKBOOK
    // ─────────────────────────────

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'PMA Feedback';
    workbook.created = new Date();

    // =========================================================
    // STYLES
    // =========================================================

    const headerStyle = {
      font: {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0B3A82' }
      },
      alignment: {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const cellBorder = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } }
    };

    // =========================================================
    // SHEET 1 → FULL FEEDBACK DATA
    // =========================================================

    const sheet = workbook.addWorksheet('PMA Feedback');

    sheet.columns = [

      { header: 'ID', key: 'id', width: 8 },

      { header: 'Submitted At', key: 'submitted_at', width: 24 },

      { header: 'First Name', key: 'first_name', width: 18 },

      { header: 'Last Name', key: 'last_name', width: 18 },

      { header: 'Email', key: 'email', width: 30 },

      // SECTION 1

      { header: 'Test Assistant', key: 'test_assistant', width: 28 },

      { header: 'Ease Of Use', key: 'ease_of_use', width: 18 },

      { header: 'Native Language', key: 'native_language', width: 30 },

      { header: 'Accessibility Rating', key: 'accessibility_rating', width: 20 },

      { header: 'Accessibility Remarks', key: 'accessibility_remarks', width: 40 },

      // SECTION 2

      { header: 'Understands Needs', key: 'understands_needs', width: 35 },

      { header: 'Relevant For Work', key: 'relevance_work', width: 30 },

      { header: 'Answer Quality', key: 'answer_quality_rating', width: 20 },

      { header: 'Discussion Levels', key: 'discussion_levels', width: 25 },

      { header: 'Test Frequency', key: 'test_frequency', width: 20 },

      { header: 'Detail Level', key: 'detail_level', width: 25 },

      { header: 'Usage Frequency', key: 'usage_frequency', width: 22 },

      { header: 'Management Coach Level', key: 'management_coach_level', width: 28 },

      { header: 'Email Help', key: 'email_help', width: 20 },

      { header: 'Email Quality', key: 'email_quality', width: 20 },

      { header: 'Email Concise', key: 'email_concise', width: 20 },

      { header: 'Email Tone', key: 'email_tone', width: 20 },

      { header: 'Collaboration Comments', key: 'collaboration_comments', width: 45 },

      // SECTION 3

      { header: 'Training Tested', key: 'training_tested', width: 20 },

      { header: 'Training Helpful', key: 'training_helpful', width: 20 },

      { header: 'Checked Expectations', key: 'checked_expectations', width: 24 },

      { header: 'Aligned Expectations', key: 'aligned_expectations', width: 24 },

      { header: 'Training Comments', key: 'training_comments', width: 45 },

      // SECTION 4

      { header: 'Higher Level Help', key: 'higher_level_help', width: 28 },

      { header: 'Additional Functions', key: 'additional_functions', width: 45 },

      { header: 'Other Function', key: 'other_function', width: 35 },

      { header: 'Priority Improvement', key: 'priority_improvement', width: 40 },

      { header: 'Overall Satisfaction', key: 'overall_satisfaction', width: 22 },

      { header: 'Recommendation', key: 'recommendation', width: 22 },

      { header: 'Final Comments', key: 'final_comments', width: 50 }

    ];

    // =========================================================
    // DATA
    // =========================================================

    rows.forEach(r => {

      sheet.addRow({

        id: r.id || '',

        submitted_at:
          r.submitted_at
            ? new Date(r.submitted_at).toLocaleString('fr-FR')
            : '',

        first_name: r.first_name || '',

        last_name: r.last_name || '',

        email: r.email || '',

        // SECTION 1

        test_assistant: r.test_assistant || '',

        ease_of_use: r.ease_of_use || '',

        native_language: r.native_language || '',

        accessibility_rating: r.accessibility_rating || '',

        accessibility_remarks: r.accessibility_remarks || '',

        // SECTION 2

        understands_needs: r.understands_needs || '',

        relevance_work: r.relevance_work || '',

        answer_quality_rating: r.answer_quality_rating || '',

        discussion_levels: r.discussion_levels || '',

        test_frequency: r.test_frequency || '',

        detail_level: r.detail_level || '',

        usage_frequency: r.usage_frequency || '',

        management_coach_level: r.management_coach_level || '',

        email_help: r.email_help || '',

        email_quality: r.email_quality || '',

        email_concise: r.email_concise || '',

        email_tone: r.email_tone || '',

        collaboration_comments: r.collaboration_comments || '',

        // SECTION 3

        training_tested: r.training_tested || '',

        training_helpful: r.training_helpful || '',

        checked_expectations: r.checked_expectations || '',

        aligned_expectations: r.aligned_expectations || '',

        training_comments: r.training_comments || '',

        // SECTION 4

        higher_level_help: r.higher_level_help || '',

        additional_functions:
          Array.isArray(r.additional_functions)
            ? r.additional_functions.join(', ')
            : r.additional_functions || '',

        other_function: r.other_function || '',

        priority_improvement: r.priority_improvement || '',

        overall_satisfaction: r.overall_satisfaction || '',

        recommendation: r.recommendation || '',

        final_comments: r.final_comments || ''

      });

    });

    // =========================================================
    // HEADER STYLE
    // =========================================================

    sheet.getRow(1).height = 32;

    sheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    // =========================================================
    // CELL STYLE
    // =========================================================

    sheet.eachRow((row, rowNumber) => {

      if (rowNumber > 1) {

        row.height = 24;

        row.eachCell(cell => {

          cell.border = cellBorder;

          cell.alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true
          };

        });

      }

    });

    // =========================================================
    // FREEZE HEADER
    // =========================================================

    sheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ];

    // =========================================================
    // FILTER
    // =========================================================

    sheet.autoFilter = {
      from: 'A1',
      to: 'AJ1'
    };

    // =========================================================
    // STATS SHEET
    // =========================================================

    const statsSheet = workbook.addWorksheet('Statistics');

    statsSheet.columns = [

      { header: 'Metric', key: 'metric', width: 40 },

      { header: 'Value', key: 'value', width: 20 }

    ];

    const totalResponses = rows.length;

    const avgSatisfaction =
      rows.reduce(
        (acc, r) => acc + (Number(r.overall_satisfaction) || 0),
        0
      ) / totalResponses;

    const recommendYes =
      rows.filter(r =>
        r.recommendation === 'Yes'
        ||
        r.recommendation === 'Yes, strongly'
      ).length;

    const usageWeekly =
      rows.filter(r =>
        r.usage_frequency === 'Daily'
        ||
        r.usage_frequency === 'Several times per week'
        ||
        r.usage_frequency === 'Once per week'
      ).length;

    statsSheet.addRows([

      {
        metric: 'Total Responses',
        value: totalResponses
      },

      {
        metric: 'Average Satisfaction',
        value: avgSatisfaction.toFixed(1)
      },

      {
        metric: 'Recommendation Positive',
        value: recommendYes
      },

      {
        metric: 'Real Usage Users',
        value: usageWeekly
      }

    ]);

    statsSheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    statsSheet.eachRow((row, rowNumber) => {

      if (rowNumber > 1) {

        row.eachCell(cell => {

          cell.border = cellBorder;

          cell.alignment = {
            vertical: 'middle'
          };

        });

      }

    });

    // =========================================================
    // GENERATE FILE
    // =========================================================

    const filename =
      ids === 'all'
        ? `PMA_Feedback_All_${new Date()
            .toISOString()
            .slice(0,10)}.xlsx`
        : `PMA_Feedback_${ids}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);

    res.end();

    console.log('✅ Excel envoyé');

  } catch (err) {

    console.error('❌ Export Excel error');
    console.error(err);

    res.status(500).json({
      error: 'Erreur export Excel'
    });

  }

});

module.exports = router;