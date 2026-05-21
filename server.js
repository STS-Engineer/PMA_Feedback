require('dotenv').config();
console.log('DB2_NAME =', process.env.DB2_NAME);
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// DEBUG
// ─────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 DÉMARRAGE PMA BACKEND');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('📦 DB_NAME       =', process.env.DB_NAME);
console.log('👤 ADMIN_EMAIL   =', process.env.ADMIN_EMAIL);
console.log('🌍 PORT          =', PORT);

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// FRONTEND PATH
// IMPORTANT :
// votre frontend est EN DEHORS du dossier backend
// donc on remonte avec ../frontend/public
// ─────────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend/public');
console.log('📁 FRONTEND PATH =', frontendPath);

// ─────────────────────────────────────────────────────────────
// STATIC FILES
// ─────────────────────────────────────────────────────────────
app.use(express.static(frontendPath));

// ─────────────────────────────────────────────────────────────
// TEST ROUTE
// ─────────────────────────────────────────────────────────────
app.get('/test', (req, res) => {
  console.log('✅ ROUTE /test appelée');
  res.json({
    success: true,
    message: 'Backend fonctionne'
  });
});

// ─────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────
console.log('📌 Chargement routes API...');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/stats', require('./routes/stats'));

// ─── AJOUT ROUTE EXPORT PDF ─────────────────────────────
app.use('/api/export', require('./routes/export')); // <=== ajout PDF
console.log('✅ Route /api/export chargée');

console.log('✅ Routes API chargées');

// ─────────────────────────────────────────────────────────────
// FRONTEND FALLBACK
// ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  console.log('📄 Frontend demandé :', req.originalUrl);
  res.sendFile(
    path.join(frontendPath, 'index.html')
  );
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────
async function start() {
  try {
    console.log('⏳ Initialisation base de données...');
    await initDB();
    console.log('✅ Base de données OK');

    app.listen(PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SERVEUR DÉMARRÉ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌍 Frontend : http://localhost:${PORT}`);
      console.log(`🔐 Admin    : http://localhost:${PORT}/admin.html`);
      console.log(`📡 API      : http://localhost:${PORT}/api`);
      console.log(`🧪 Test     : http://localhost:${PORT}/test`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (err) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR DÉMARRAGE');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(err);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    process.exit(1);
  }
}

start();