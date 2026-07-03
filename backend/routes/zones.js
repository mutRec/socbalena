const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/zones
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT z.*, c.nom AS centre_nom, COUNT(i.id) AS num_immersions
       FROM zones z
       LEFT JOIN centres c ON c.id = z.centre_id
       LEFT JOIN immersions i ON i.zona_id = z.id
       GROUP BY z.id, c.nom
       ORDER BY z.nom`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/zones/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT z.*, c.nom AS centre_nom FROM zones z
       LEFT JOIN centres c ON c.id = z.centre_id
       WHERE z.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Zona no trobada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/zones
router.post('/', async (req, res) => {
  const { nom, centre_id, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes } = req.body;
  if (!nom) return res.status(400).json({ error: 'El nom és obligatori' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO zones (nom, centre_id, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [nom, centre_id || null, pais, regio, latitud || null, longitud || null, tipus, nivell_dificultat, profunditat_max || null, descripcio, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/zones/:id
router.put('/:id', async (req, res) => {
  const { nom, centre_id, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE zones SET nom=$1, centre_id=$2, pais=$3, regio=$4, latitud=$5, longitud=$6,
       tipus=$7, nivell_dificultat=$8, profunditat_max=$9, descripcio=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [nom, centre_id || null, pais, regio, latitud || null, longitud || null, tipus, nivell_dificultat, profunditat_max || null, descripcio, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Zona no trobada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/zones/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM zones WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
