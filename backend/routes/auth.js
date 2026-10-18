const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const AVATARS_DIR = path.join(UPLOAD_DIR, 'avatars');
const MIDA_AVATAR = 400; // px (quadrat)

// Pujada d'avatar en memòria: després es retalla amb sharp
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Cal una imatge (JPG, PNG, WEBP o HEIC)'), false);
  }
});

// Esborra el fitxer d'avatar anterior si pertany a la carpeta d'avatars
function esborrarAvatarAnterior(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;
  const cami = path.join(UPLOAD_DIR, avatarUrl.replace('/uploads/', ''));
  try { if (fs.existsSync(cami)) fs.unlinkSync(cami); } catch { /* ignorem */ }
}

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

// POST /api/auth/avatar — pujar/actualitzar la foto de perfil
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Cal una imatge' });

  try {
    const sharp = require('sharp');
    fs.mkdirSync(AVATARS_DIR, { recursive: true });

    const nom = `${req.usuari.id}-${Date.now()}.jpg`;
    const desti = path.join(AVATARS_DIR, nom);

    // Retall quadrat centrat (respectant l'orientació EXIF) i escalat a 400x400
    await sharp(req.file.buffer)
      .rotate()
      .resize(MIDA_AVATAR, MIDA_AVATAR, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 88 })
      .toFile(desti);

    const avatar_url = `/uploads/avatars/${nom}`;

    // Esborrar l'avatar anterior (només si era un avatar pujat)
    const prev = await pool.query('SELECT avatar_url FROM usuaris WHERE id = $1', [req.usuari.id]);
    esborrarAvatarAnterior(prev.rows[0] && prev.rows[0].avatar_url);

    await pool.query('UPDATE usuaris SET avatar_url = $1 WHERE id = $2', [avatar_url, req.usuari.id]);
    res.json({ avatar_url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "No s'ha pogut processar la imatge. Prova amb JPG, PNG o WEBP." });
  }
});

// DELETE /api/auth/avatar — treure la foto de perfil
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const prev = await pool.query('SELECT avatar_url FROM usuaris WHERE id = $1', [req.usuari.id]);
    esborrarAvatarAnterior(prev.rows[0] && prev.rows[0].avatar_url);

    await pool.query('UPDATE usuaris SET avatar_url = NULL WHERE id = $1', [req.usuari.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
