const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { feedbackPool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  // Vérification champs
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email et mot de passe requis'
    });
  }

  try {

    // Recherche admin
    const { rows } = await feedbackPool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    // Admin introuvable
    if (rows.length === 0) {

      console.log('❌ Admin introuvable');
      console.log('EMAIL RECU :', email);

      return res.status(401).json({
        error: 'Identifiants incorrects'
      });
    }

    const admin = rows[0];

    // DEBUG
    console.log('\n──────── LOGIN DEBUG ────────');
    console.log('EMAIL RECU :', email);
    console.log('PASSWORD RECU :', password);
    console.log('EMAIL BDD :', admin.email);
    console.log('HASH BDD :', admin.password);

    // Vérification mot de passe
    const valid = await bcrypt.compare(
      password,
      admin.password
    );

    console.log('PASSWORD VALID ?', valid);
    console.log('────────────────────────────\n');

    // Mot de passe incorrect
    if (!valid) {
      return res.status(401).json({
        error: 'Identifiants incorrects'
      });
    }

    // Création token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    // Réponse OK
    res.json({
      token,
      email: admin.email
    });

  } catch (err) {

    console.error('❌ Login error :', err);

    res.status(500).json({
      error: 'Erreur serveur'
    });

  }

});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// Vérification du token
// ─────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {

  res.json({
    id: req.admin.id,
    email: req.admin.email
  });

});

module.exports = router;