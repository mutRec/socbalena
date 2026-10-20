const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const LOGOS_DIR = path.join(UPLOAD_DIR, 'logos');
const MIDA_LOGO = 512; // px (costat llarg màxim)

// Pujada del logotip en memòria: després es redimensiona amb sharp
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Cal una imatge (JPG, PNG, WEBP o HEIC)'), false);
  }
});

// Esborra el fitxer de logotip anterior si pertany a la carpeta de logotips
function esborrarLogoAnterior(logoUrl) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/logos/')) return;
  const cami = path.join(UPLOAD_DIR, logoUrl.replace('/uploads/', ''));
  try { if (fs.existsSync(cami)) fs.unlinkSync(cami); } catch { /* ignorem */ }
}

// Envolta multer per retornar 400 (i no 500) si la imatge no és vàlida o és massa gran
function rebreLogo(req, res, next) {
  uploadLogo.single('logo')(req, res, (err) => {
    if (err) {
      const missatge = err.code === 'LIMIT_FILE_SIZE'
        ? 'La imatge és massa gran (màxim 10 MB)'
        : err.message;
      return res.status(400).json({ error: missatge });
    }
    next();
  });
}

// GET /api/centres
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(zc.zona_id)::int AS num_zones
       FROM centres c
       LEFT JOIN zona_centres zc ON zc.centre_id = c.id
       GROUP BY c.id
       ORDER BY c.nom`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/centres/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM centres WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Centre no trobat' });
    const zones = await pool.query(
      `SELECT z.* FROM zones z
       JOIN zona_centres zc ON zc.zona_id = z.id
       WHERE zc.centre_id = $1
       ORDER BY z.nom`,
      [req.params.id]
    );
    res.json({ ...rows[0], zones: zones.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/centres
router.post('/', async (req, res) => {
  const { nom, pais, regio, adreca, telefon, email, web, notes } = req.body;
  if (!nom) return res.status(400).json({ error: 'El nom és obligatori' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO centres (nom, pais, regio, adreca, telefon, email, web, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nom, pais, regio, adreca, telefon, email, web, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/centres/:id
router.put('/:id', async (req, res) => {
  const { nom, pais, regio, adreca, telefon, email, web, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE centres SET nom=$1, pais=$2, regio=$3, adreca=$4, telefon=$5, email=$6, web=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [nom, pais, regio, adreca, telefon, email, web, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Centre no trobat' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/centres/:id/logo — pujar/actualitzar el logotip del centre
router.post('/:id/logo', rebreLogo, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Cal una imatge' });

  try {
    const existeix = await pool.query('SELECT logo_url FROM centres WHERE id = $1', [req.params.id]);
    if (!existeix.rows.length) return res.status(404).json({ error: 'Centre no trobat' });

    const sharp = require('sharp');
    fs.mkdirSync(LOGOS_DIR, { recursive: true });

    const nom = `${req.params.id}-${Date.now()}.png`;
    const desti = path.join(LOGOS_DIR, nom);

    // Escalat dins de 512x512 respectant proporcions (i la transparència)
    await sharp(req.file.buffer)
      .rotate()
      .resize(MIDA_LOGO, MIDA_LOGO, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(desti);

    const logo_url = `/uploads/logos/${nom}`;

    // Esborrar el logotip anterior (només si era un logotip pujat)
    esborrarLogoAnterior(existeix.rows[0].logo_url);

    await pool.query('UPDATE centres SET logo_url = $1 WHERE id = $2', [logo_url, req.params.id]);
    res.json({ logo_url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "No s'ha pogut processar la imatge. Prova amb JPG, PNG o WEBP." });
  }
});

// DELETE /api/centres/:id/logo — treure el logotip del centre
router.delete('/:id/logo', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT logo_url FROM centres WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Centre no trobat' });

    esborrarLogoAnterior(rows[0].logo_url);
    await pool.query('UPDATE centres SET logo_url = NULL WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/centres/:id
router.delete('/:id', async (req, res) => {
  try {
    const centre = await pool.query('SELECT logo_url FROM centres WHERE id = $1', [req.params.id]);
    if (centre.rows.length) esborrarLogoAnterior(centre.rows[0].logo_url);

    await pool.query('DELETE FROM centres WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
