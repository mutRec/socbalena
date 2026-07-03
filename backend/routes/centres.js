const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/centres
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(z.id) AS num_zones
       FROM centres c
       LEFT JOIN zones z ON z.centre_id = c.id
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
    const zones = await pool.query('SELECT * FROM zones WHERE centre_id = $1 ORDER BY nom', [req.params.id]);
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

// DELETE /api/centres/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM centres WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
