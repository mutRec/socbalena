const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

// Configuració multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, req.usuari.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nom = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, nom);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipus de fitxer no permès'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// POST /api/media/:immersio_id — pujar fitxer
router.post('/:immersio_id', upload.single('fitxer'), async (req, res) => {
  const { immersio_id } = req.params;

  // Verificar que la immersió és de l'usuari
  const imm = await pool.query(
    'SELECT id FROM immersions WHERE id = $1 AND usuari_id = $2',
    [immersio_id, req.usuari.id]
  );
  if (!imm.rows.length) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Immersió no trobada' });
  }

  if (!req.file) return res.status(400).json({ error: 'Cal un fitxer' });

  const tipus = req.file.mimetype.startsWith('video/') ? 'video' : 'foto';
  const nom_fitxer = `${req.usuari.id}/${req.file.filename}`;
  const { descripcio } = req.body;

  try {
    // Si és foto, obtenir dimensions amb sharp (opcional)
    let amplada = null, alcada = null;
    if (tipus === 'foto') {
      try {
        const sharp = require('sharp');
        const meta = await sharp(req.file.path).metadata();
        amplada = meta.width;
        alcada = meta.height;
      } catch { /* sharp opcional */ }
    }

    const { rows } = await pool.query(
      `INSERT INTO media (immersio_id, usuari_id, tipus, nom_fitxer, nom_original, mida_bytes, amplada, alcada, descripcio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [immersio_id, req.usuari.id, tipus, nom_fitxer, req.file.originalname, req.file.size, amplada, alcada, descripcio || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/media/:id/portada — marcar com a portada
router.patch('/:id/portada', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, i.usuari_id FROM media m
       JOIN immersions i ON i.id = m.immersio_id
       WHERE m.id = $1`, [req.params.id]
    );
    if (!rows.length || rows[0].usuari_id !== req.usuari.id) {
      return res.status(404).json({ error: 'Arxiu no trobat' });
    }
    // Treure portada actual de la immersió
    await pool.query('UPDATE media SET es_portada = false WHERE immersio_id = $1', [rows[0].immersio_id]);
    await pool.query('UPDATE media SET es_portada = true WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/media/:id — actualitzar descripció
router.patch('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE media SET descripcio = $1
       WHERE id = $2 AND usuari_id = $3 RETURNING *`,
      [req.body.descripcio || null, req.params.id, req.usuari.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Arxiu no trobat' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.nom_fitxer, i.usuari_id FROM media m
       JOIN immersions i ON i.id = m.immersio_id
       WHERE m.id = $1 AND m.usuari_id = $2`,
      [req.params.id, req.usuari.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Arxiu no trobat' });

    // Eliminar fitxer físic
    const fitxerPath = path.join(UPLOAD_DIR, rows[0].nom_fitxer);
    if (fs.existsSync(fitxerPath)) fs.unlinkSync(fitxerPath);

    await pool.query('DELETE FROM media WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
