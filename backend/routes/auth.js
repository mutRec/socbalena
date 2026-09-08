const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Cal email i contrasenya' });

  try {
    const { rows } = await pool.query('SELECT * FROM usuaris WHERE email = $1', [email.toLowerCase()]);
    const usuari = rows[0];
    if (!usuari) return res.status(401).json({ error: 'Credencials incorrectes' });

    const ok = await bcrypt.compare(password, usuari.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credencials incorrectes' });

    const token = jwt.sign(
      { id: usuari.id, nom: usuari.nom, email: usuari.email, rol: usuari.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuari: { id: usuari.id, nom: usuari.nom, email: usuari.email, rol: usuari.rol, avatar_url: usuari.avatar_url }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/perfil
router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom, email, rol, avatar_url, creat_a FROM usuaris WHERE id = $1',
      [req.usuari.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuari no trobat' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
