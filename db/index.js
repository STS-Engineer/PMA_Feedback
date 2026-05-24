const { Pool } = require('pg');
require('dotenv').config();

// =========================================
// DATABASE 1 → FEEDBACK
// =========================================


const feedbackPool = new Pool({
  host: process.env.DB2_HOST,
  port: Number(process.env.DB2_PORT || 5432),
  database: process.env.DB2_NAME,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// =========================================
// DATABASE 2 → EMPLOYEES (AZURE)
// =========================================

const employeePool = new Pool({

  connectionString: process.env.PEOPLE_DATABASE_URL

});

async function initDB() {

  // =========================================
  // TEST FEEDBACK DB
  // =========================================

  const feedbackClient = await feedbackPool.connect();

  try {

    await feedbackClient.query('SELECT NOW()');

    console.log('✅ Feedback DB connected');

    // =========================================
    // TABLE ADMINS
    // =========================================

    await feedbackClient.query(`

      CREATE TABLE IF NOT EXISTS admins (

        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()

      );

    `);

    // =========================================
    // TABLE FEEDBACK RESPONSES
    // =========================================

    await feedbackClient.query(`
 
      CREATE TABLE IF NOT EXISTS feedback_responses (

        id SERIAL PRIMARY KEY,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),

        first_name VARCHAR(120),
last_name VARCHAR(120),
email VARCHAR(255),

test_assistant VARCHAR(100),
ease_of_use VARCHAR(100),
native_language VARCHAR(100),
accessibility_rating SMALLINT,
accessibility_remarks TEXT,

understands_needs VARCHAR(100),
relevance_work VARCHAR(100),
answer_quality_rating SMALLINT,
discussion_levels VARCHAR(100),
test_frequency VARCHAR(100),

detail_level VARCHAR(100),
usage_frequency VARCHAR(100),
management_coach_level VARCHAR(100),
email_help VARCHAR(100),
email_quality VARCHAR(100),

email_concise VARCHAR(100),
email_tone VARCHAR(100),
collaboration_comments TEXT,

training_tested VARCHAR(100),
training_helpful VARCHAR(100),
checked_expectations VARCHAR(100),
aligned_expectations VARCHAR(100),
training_comments TEXT,

higher_level_help VARCHAR(100),
additional_functions TEXT[],
other_function TEXT,

priority_improvement TEXT,
overall_satisfaction SMALLINT,
continue_expansion VARCHAR(100),

final_comments TEXT

      );

    `);

    console.log('✅ Feedback tables initialized');

  } finally {

    feedbackClient.release();

  }

  // =========================================
  // TEST EMPLOYEE DB
  // =========================================

  const employeeClient = await employeePool.connect();

  try {

    await employeeClient.query('SELECT NOW()');

    console.log('✅ Employee DB connected');
   console.log('━━━━━━━━━━━━━━━━━━━━');
console.log('AZURE DEBUG');
console.log('━━━━━━━━━━━━━━━━━━━━');

const dbTest = await employeeClient.query(`
  SELECT current_database()
`);

console.log('DATABASE:', dbTest.rows);

const schemaTest = await employeeClient.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  ORDER BY table_schema, table_name
  LIMIT 50
`);

console.log(schemaTest.rows);
  } finally {

    employeeClient.release();

  }

}

module.exports = {

  feedbackPool,
  employeePool,
  initDB

};
