const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const CAMPS = [
  'numero_immersio','data','hora_entrada','hora_sortida','zona_id','centre_id',
  'profunditat_max','profunditat_mitja','temps_fons','temps_superficie',
  'pressio_entrada','pressio_sortida','consum_aire','capacitat_bombona','tipus_gas',
  'visibilitat','corrent','onatge','temp_aigua','temp_aire',
  'tipus_vestit','pes_llastre','company','instructor','tipus_immersio',
  'valoracio','notes'
];

// GET /api/immersions — totes les de l'usuari autenticat
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, zona_id, any: year } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = ['i.usuari_id = $1::uuid'];
  const params = [req.usuari.id];
  let pi = 2;

  if (zona_id) { conditions.push(`i.zona_id = $${pi++}`); params.push(zona_id); }
  if (year) { conditions.push(`EXTRACT(YEAR FROM i.data) = $${pi++}`); params.push(year); }

  const where = conditions.join(' AND ');
  try {
    const total = await pool.query(`SELECT COUNT(*) FROM immersions i WHERE ${where}`, params);
    const { rows } = await pool.query(
      `SELECT i.*, z.nom AS zona_nom, c.nom AS centre_nom,
              (SELECT nom_fitxer FROM media m WHERE m.immersio_id = i.id AND m.es_portada = true LIMIT 1) AS portada
       FROM immersions i
       LEFT JOIN zones z ON z.id = i.zona_id
       LEFT JOIN centres c ON c.id = i.centre_id
       WHERE ${where}
       ORDER BY i.data DESC, i.hora_entrada DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    );
    res.json({ total: parseInt(total.rows[0].count), pagina: parseInt(page), immersions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/immersions/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, z.nom AS zona_nom, z.tipus AS zona_tipus, z.latitud, z.longitud,
              c.nom AS centre_nom, c.telefon AS centre_telefon
       FROM immersions i
       LEFT JOIN zones z ON z.id = i.zona_id
       LEFT JOIN centres c ON c.id = i.centre_id
       WHERE i.id = $1::uuid AND i.usuari_id = $2::uuid`,
      [req.params.id, req.usuari.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Immersió no trobada' });

    const media = await pool.query(
      'SELECT * FROM media WHERE immersio_id = $1::uuid ORDER BY creat_a',
      [req.params.id]
    );
    res.json({ ...rows[0], media: media.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/immersions
router.post('/', async (req, res) => {
  if (!req.body.data) return res.status(400).json({ error: 'La data és obligatòria' });

  // Calcular numero d'immersió automàticament si no s'indica
  let num = req.body.numero_immersio;
  if (!num) {
    const r = await pool.query(
      'SELECT COALESCE(MAX(numero_immersio), 0) + 1 AS seg FROM immersions WHERE usuari_id = $1::uuid',
      [req.usuari.id]
    );
    num = r.rows[0].seg;
  }

  const vals = CAMPS.map(c => c === 'numero_immersio' ? num : (req.body[c] ?? null));
  const placeholders = CAMPS.map((_, i) => `$${i + 2}`).join(',');

  try {
    const { rows } = await pool.query(
      `INSERT INTO immersions (usuari_id, ${CAMPS.join(',')})
       VALUES ($1::uuid, ${placeholders}) RETURNING *`,
      [req.usuari.id, ...vals]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/immersions/:id
router.put('/:id', async (req, res) => {
  const sets = CAMPS.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const vals = CAMPS.map(c => req.body[c] ?? null);

  try {
    const { rows } = await pool.query(
      `UPDATE immersions SET ${sets} WHERE id = $${CAMPS.length + 2} AND usuari_id = $${CAMPS.length + 3} RETURNING *`,
      [...vals, req.params.id, req.usuari.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Immersió no trobada' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/immersions/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM immersions WHERE id = $1::uuid AND usuari_id = $2::uuid', [req.params.id, req.usuari.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
