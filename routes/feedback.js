const express = require('express'); 
const router = express.Router();

const { feedbackPool, employeePool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// POST /api/feedback
// Soumission publique du formulaire utilisateur
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 POST /api/feedback');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {

    const d = req.body;

    // ─────────────────────────────
// VERIFY EMPLOYEE
// ─────────────────────────────

const employeeCheck = await employeePool.query(
  `
  SELECT *
  FROM public.company_members
  WHERE
    LOWER(first_name) = LOWER($1)
    AND LOWER(last_name) = LOWER($2)
    AND LOWER(email) = LOWER($3)
  `,
  [
    d.first_name?.trim(),
    d.last_name?.trim(),
    d.email?.trim().toLowerCase()
  ]
);

if (employeeCheck.rows.length === 0) {

  return res.status(403).json({
    success: false,
    error: 'Employee not found in company database'
  });

}

    console.log('📦 BODY RECU :');
    console.log(JSON.stringify(d, null, 2));

    const query = `
      INSERT INTO feedback_responses (

  first_name,
  last_name,
  email,

  test_assistant,
  ease_of_use,
  native_language,
  accessibility_rating,
  accessibility_remarks,

  understands_needs,
  relevance_work,
  answer_quality_rating,
  discussion_levels,
  test_frequency,

  detail_level,
  usage_frequency,
  management_coach_level,
  email_help,
  email_quality,

  email_concise,
  email_tone,
  collaboration_comments,

  training_tested,
  training_helpful,
  checked_expectations,
  aligned_expectations,
  training_comments,

  higher_level_help,
  additional_functions,
  other_function,

  priority_improvement,
  overall_satisfaction,
  recommendation,

  final_comments

)

     VALUES (

  $1,$2,$3,

  $4,$5,$6,$7,$8,
  $9,$10,$11,$12,$13,
  $14,$15,$16,$17,$18,
  $19,$20,$21,
  $22,$23,$24,$25,$26,
  $27,$28,$29,
  $30,$31,$32,
  $33

)

      RETURNING id, submitted_at
    `;

    // ─────────────────────────────────────────────────────────
    // MAPPING FRONTEND → DATABASE
    // ─────────────────────────────────────────────────────────

const values = [

  // USER
  d.first_name || null,
  d.last_name || null,
  d.email ? d.email.toLowerCase() : null,

  // SECTION 1
  d.test_assistant || null,
  d.ease_use || null,
  d.native_language || null,
  d.accessibility_rating || null,
  d.accessibility_remarks || null,

  // SECTION 2
  d.understands_needs || null,
  d.relevant_work || null,
  d.answer_quality_rating || null,
  d.discussion_levels || null,
  d.test_frequency || null,

  d.detail_level || null,
  d.usage_frequency || null,
  d.management_coach_level || null,

  d.email_help || null,
  d.email_quality || null,

  d.email_concise || null,
  d.email_tone || null,
  d.collaboration_comments || null,

  // SECTION 3
  d.training_tested || null,
  d.training_helpful || null,

  d.checked_expectations || null,
  d.aligned_expectations || null,

  d.training_comments || null,

  // SECTION 4
  d.higher_level_help || null,
  d.additional_functions || [],
  d.other_function || null,

  d.priority_improvement || null,
  d.overall_satisfaction || null,
  d.recommendation || null,

  d.final_comments || null

];
    console.log('📤 VALUES SQL :');
    console.log(values);

    const result = await feedbackPool.query(query, values);

    console.log('✅ INSERTION OK');
    console.log(result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Feedback enregistré avec succès',
      id: result.rows[0].id,
      submitted_at: result.rows[0].submitted_at,
    });

  } catch (err) {

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ ERREUR INSERT COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.error(err);

  // EMAIL DEJA EXISTANT
  if (err.code === '23505') {

    return res.status(400).json({
      success: false,
      error: 'This email has already submitted feedback.'
    });

  }

  res.status(500).json({
    success: false,
    error: err.message
  });

}

});

// ─────────────────────────────────────────────────────────────
// GET /api/feedback
// Liste des réponses
// ─────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {

  const {
    recommend,
    min_rating,
    max_rating,
    limit = 50,
    offset = 0
  } = req.query;

  let where = [];
  let params = [];
  let i = 1;

  if (recommend) {

    where.push(`recommendation = $${i++}`);
    params.push(recommend);

  }

  if (min_rating) {

    where.push(`CAST(overall_satisfaction AS INTEGER)>= $${i++}`);
    params.push(Number(min_rating));

  }

  if (max_rating) {

    where.push(`overall_satisfaction <= $${i++}`);
    params.push(Number(max_rating));

  }

  const whereClause =
    where.length
      ? 'WHERE ' + where.join(' AND ')
      : '';

  params.push(Number(limit));
  params.push(Number(offset));

  try {

    const { rows } = await feedbackPool.query(

      `
     SELECT

  id,
  submitted_at,

  first_name,
  last_name,
  email,

  test_assistant,
  ease_of_use,

  native_language,
  accessibility_rating,
  accessibility_remarks,

  understands_needs,
  relevance_work,
  answer_quality_rating,

  discussion_levels,
  test_frequency,

  detail_level,
  usage_frequency,

  management_coach_level,

  email_help,
  email_quality,
  email_concise,
  email_tone,

  collaboration_comments,

  training_tested,
  training_helpful,

  checked_expectations,
  aligned_expectations,

  training_comments,

  higher_level_help,

  additional_functions,
  other_function,

  priority_improvement,

  overall_satisfaction,

  recommendation,

  final_comments

FROM feedback_responses
      ${whereClause}

      ORDER BY submitted_at DESC

      LIMIT $${i}
      OFFSET $${i + 1}
      `,

      params

    );

    const { rows: count } = await feedbackPool.query(

      `
      SELECT COUNT(*)
      FROM feedback_responses
      ${whereClause}
      `,

      params.slice(0, -2)

    );

    res.json({
      total: Number(count[0].count),
      responses: rows
    });

  } catch (err) {

    console.error('❌ ERREUR GET FEEDBACKS');
    console.error(err);

    res.status(500).json({
      error: 'Erreur serveur'
    });

  }

});

// ─────────────────────────────────────────────────────────────
// GET /api/feedback/:id
// Détail complet d'une réponse
// ─────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {

  try {

    const { rows } = await feedbackPool.query(

      'SELECT * FROM feedback_responses WHERE id = $1',

      [req.params.id]

    );

    if (rows.length === 0) {

      return res.status(404).json({
        error: 'Réponse introuvable'
      });

    }

    res.json(rows[0]);

  } catch (err) {

    console.error('❌ ERREUR DETAIL FEEDBACK');
    console.error(err);

    res.status(500).json({
      error: 'Erreur serveur'
    });

  }

});

// ─────────────────────────────────────────────────────────────
// DELETE /api/feedback/:id
// Supprimer une réponse
// ─────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {

  try {

    await feedbackPool.query(

      'DELETE FROM feedback_responses WHERE id = $1',

      [req.params.id]

    );

    res.json({
      success: true,
      message: 'Réponse supprimée'
    });

  } catch (err) {

    console.error('❌ ERREUR DELETE FEEDBACK');
    console.error(err);

    res.status(500).json({
      error: 'Erreur serveur'
    });

  }

});

module.exports = router;