require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function diagnostic() {

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DIAGNOSTIC PMA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📦 CONFIGURATION');
  console.log('DB_HOST      =', process.env.DB_HOST);
  console.log('DB_PORT      =', process.env.DB_PORT);
  console.log('DB_NAME      =', process.env.DB_NAME);
  console.log('DB_USER      =', process.env.DB_USER);
  console.log('ADMIN_EMAIL  =', process.env.ADMIN_EMAIL);
  console.log('JWT SECRET ? =', !!process.env.JWT_SECRET);
  console.log('');

  try {

    // ─────────────────────────────────────────
    // TEST CONNEXION
    // ─────────────────────────────────────────

    const client = await pool.connect();

    console.log('✅ PostgreSQL connecté\n');

    // ─────────────────────────────────────────
    // TABLE ADMINS
    // ─────────────────────────────────────────

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 TEST ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const adminResult = await client.query(`
      SELECT * FROM admins
    `);

    console.log('Admins trouvés :', adminResult.rows.length);

    // Aucun admin
    if (adminResult.rows.length === 0) {

      console.log('⚠️ Aucun admin trouvé');
      console.log('➡️ Création admin...\n');

      const hash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
      );

      await client.query(`
        INSERT INTO admins (
          email,
          password
        )
        VALUES ($1,$2)
      `, [
        process.env.ADMIN_EMAIL,
        hash
      ]);

      console.log('✅ Admin créé');
      console.log('EMAIL :', process.env.ADMIN_EMAIL);
      console.log('PASSWORD :', process.env.ADMIN_PASSWORD);

    } else {

      const admin = adminResult.rows[0];

      console.log('\n📧 EMAIL BDD :', admin.email);
      console.log('🔐 HASH BDD  :', admin.password);

      // TEST PASSWORD
      const valid = await bcrypt.compare(
        process.env.ADMIN_PASSWORD,
        admin.password
      );

      console.log('\n🔎 TEST PASSWORD');
      console.log('PASSWORD .env =', process.env.ADMIN_PASSWORD);
      console.log('MATCH ?       =', valid);

      // Mauvais hash
      if (!valid) {

        console.log('\n❌ HASH INCORRECT');
        console.log('➡️ Recréation admin...\n');

        await client.query(`
          DELETE FROM admins
        `);

        const newHash = await bcrypt.hash(
          process.env.ADMIN_PASSWORD,
          10
        );

        await client.query(`
          INSERT INTO admins (
            email,
            password
          )
          VALUES ($1,$2)
        `, [
          process.env.ADMIN_EMAIL,
          newHash
        ]);

        console.log('✅ Admin recréé');
      } else {

        console.log('✅ Login admin OK');
      }
    }

    // ─────────────────────────────────────────
    // TABLE FEEDBACK
    // ─────────────────────────────────────────

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST FEEDBACK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const feedbackCount = await client.query(`
      SELECT COUNT(*) FROM feedback_responses
    `);

    console.log(
      'Nombre de feedbacks :',
      feedbackCount.rows[0].count
    );

    // ─────────────────────────────────────────
    // TEST INSERTION
    // ─────────────────────────────────────────

    console.log('\n🧪 TEST INSERTION...\n');

    const insertResult = await client.query(`
      INSERT INTO feedback_responses (
        useful_rating,
        situations,
        clarity_yno,
        frequency,
        recommend
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
    `, [
      5,
      ['TEST'],
      'Oui',
      'Daily',
      'Oui'
    ]);

    const insertedId = insertResult.rows[0].id;

    console.log('✅ INSERTION OK');
    console.log('ID =', insertedId);

    // Vérification lecture
    const checkInsert = await client.query(`
      SELECT *
      FROM feedback_responses
      WHERE id = $1
    `, [insertedId]);

    console.log('\n📄 LIGNE INSÉRÉE :');
    console.log(checkInsert.rows[0]);

    // Nettoyage
    await client.query(`
      DELETE FROM feedback_responses
      WHERE id = $1
    `, [insertedId]);

    console.log('\n🧹 TEST SUPPRIMÉ');

    // ─────────────────────────────────────────
    // FIN
    // ─────────────────────────────────────────

    client.release();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);

  } catch (err) {

    console.error('\n❌ ERREUR DIAGNOSTIC\n');
    console.error(err);

    process.exit(1);
  }
}

diagnostic();