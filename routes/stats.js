const express = require('express');
const router = express.Router();

const { feedbackPool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PMA STATS API
// CLEAN EXECUTIVE VERSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/', authMiddleware, async (req, res) => {

  try {

    // ─────────────────────────────
    // GLOBAL KPI
    // ─────────────────────────────

    const { rows: [global] } = await feedbackPool.query(`

      SELECT

        COUNT(*) AS total,

        ROUND(
          AVG(overall_satisfaction::numeric),
          1
        ) AS avg_satisfaction,

        COUNT(*) FILTER (
          WHERE recommendation IN (
            'Yes',
            'Yes, strongly'
          )
        ) AS recommend_yes,

        COUNT(*) FILTER (
          WHERE usage_frequency IN (
            'Daily',
            'Several times per week',
            'Once per week'
          )
        ) AS active_usage

      FROM feedback_responses

    `);

    // ─────────────────────────────
    // USAGE FREQUENCY
    // ─────────────────────────────

    const { rows: usage_frequency } = await feedbackPool.query(`

      SELECT

        usage_frequency AS label,
        COUNT(*) AS count

      FROM feedback_responses

      WHERE usage_frequency IS NOT NULL
      AND usage_frequency <> ''

      GROUP BY usage_frequency

      ORDER BY count DESC

    `);

    // ─────────────────────────────
    // SATISFACTION DISTRIBUTION
    // ─────────────────────────────

    const { rows: satisfaction_levels } = await feedbackPool.query(`

      SELECT

        overall_satisfaction AS label,
        COUNT(*) AS count

      FROM feedback_responses

      WHERE overall_satisfaction IS NOT NULL

      GROUP BY overall_satisfaction

      ORDER BY overall_satisfaction

    `);

    // ─────────────────────────────
    // ADDITIONAL FUNCTIONS
    // ─────────────────────────────

    const { rows: additional_functions } = await feedbackPool.query(`

      SELECT

        unnest(additional_functions) AS label,
        COUNT(*) AS count

      FROM feedback_responses

      WHERE additional_functions IS NOT NULL

      GROUP BY label

      ORDER BY count DESC

      LIMIT 8

    `);

    // ─────────────────────────────
    // TOP IMPROVEMENTS
    // ─────────────────────────────

    const { rows: improvements } = await feedbackPool.query(`

      SELECT

        priority_improvement AS label,
        COUNT(*) AS count

      FROM feedback_responses

      WHERE priority_improvement IS NOT NULL
      AND priority_improvement <> ''

      GROUP BY priority_improvement

      ORDER BY count DESC

      LIMIT 5

    `);

    // ─────────────────────────────
    // INSIGHTS
    // ─────────────────────────────

    const insights = [];

    const total =
      Number(global.total) || 0;

    const avg =
      Number(global.avg_satisfaction) || 0;

    const recommendPct =

      total > 0

        ? Math.round(
            (
              Number(global.recommend_yes)
              /
              total
            ) * 100
          )

        : 0;

    const usagePct =

      total > 0

        ? Math.round(
            (
              Number(global.active_usage)
              /
              total
            ) * 100
          )

        : 0;

    insights.push(
      `${usagePct}% of users use PMA weekly or more`
    );

    insights.push(
      `Average satisfaction is ${avg}/5`
    );

    insights.push(
      `${recommendPct}% would recommend PMA`
    );

    if (improvements.length > 0) {

      insights.push(
        `Main improvement request: ${improvements[0].label}`
      );

    }

    if (additional_functions.length > 0) {

      insights.push(
        `Most used feature: ${additional_functions[0].label}`
      );

    }

    // ─────────────────────────────
    // RESPONSE
    // ─────────────────────────────

    res.json({

      global: {

        total,

        avg_satisfaction: avg,

        recommend_yes:
          Number(global.recommend_yes),

        recommend_pct: recommendPct,

        active_usage:
          Number(global.active_usage),

        active_usage_pct: usagePct

      },

      usage_frequency,

      satisfaction_levels,

      additional_functions,

      improvements,

      insights

    });

  } catch (err) {

    console.error('━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ STATS ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━');

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;