const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Consulta els centres associats a una zona
const CENTRES_JSON = `
  COALESCE((
    SELECT json_agg(json_build_object('id', c.id, 'nom', c.nom) ORDER BY c.nom)
    FROM zona_centres zc
    JOIN centres c ON c.id = zc.centre_id
    WHERE zc.zona_id = z.id
  ), '[]'::json) AS centres`;

// Accepta el nou format (centre_ids: array) i el vell (centre_id únic)
function normalitzarCentres(centre_ids, centre_id) {
  const llista = Array.isArray(centre_ids) ? centre_ids : (centre_id ? [centre_id] : []);
  return [...new Set(llista.filter(Boolean))];
}

// Desa les associacions d'una zona dins d'una transacció
async function desarCentres(client, zonaId, centreIds) {
  await client.query('DELETE FROM zona_centres WHERE zona_id = $1', [zonaId]);
  if (!centreIds.length) return;
  await client.query(
    `INSERT INTO zona_centres (zona_id, centre_id)
     SELECT $1, unnest($2::uuid[])
     ON CONFLICT DO NOTHING`,
    [zonaId, centreIds]
  );
}

// GET /api/zones
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT z.*,
              (SELECT COUNT(*)::int FROM immersions i WHERE i.zona_id = z.id AND i.usuari_id = $1) AS num_immersions,
              ${CENTRES_JSON}
       FROM zones z
       ORDER BY z.nom`,
      [req.usuari.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/zones/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT z.*, ${CENTRES_JSON}
       FROM zones z
       WHERE z.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Zona no trobada' });

    // Immersions de l'usuari en aquesta zona (per saltar a les seves fitxes)
    const immersions = await pool.query(
      `SELECT id, numero_immersio, data
       FROM immersions
       WHERE zona_id = $1 AND usuari_id = $2
       ORDER BY numero_immersio DESC NULLS LAST, data DESC`,
      [req.params.id, req.usuari.id]
    );

    res.json({ ...rows[0], immersions: immersions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/zones
router.post('/', async (req, res) => {
  const { nom, centre_ids, centre_id, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes } = req.body;
  if (!nom) return res.status(400).json({ error: 'El nom és obligatori' });

  const ids = normalitzarCentres(centre_ids, centre_id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO zones (nom, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nom, pais, regio, latitud || null, longitud || null, tipus, nivell_dificultat, profunditat_max || null, descripcio, notes]
    );
    await desarCentres(client, rows[0].id, ids);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// PUT /api/zones/:id
router.put('/:id', async (req, res) => {
  const { nom, centre_ids, centre_id, pais, regio, latitud, longitud, tipus, nivell_dificultat, profunditat_max, descripcio, notes } = req.body;
  const ids = normalitzarCentres(centre_ids, centre_id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE zones SET nom=$1, pais=$2, regio=$3, latitud=$4, longitud=$5,
       tipus=$6, nivell_dificultat=$7, profunditat_max=$8, descripcio=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [nom, pais, regio, latitud || null, longitud || null, tipus, nivell_dificultat, profunditat_max || null, descripcio, notes, req.params.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Zona no trobada' });
    }
    await desarCentres(client, req.params.id, ids);
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// DELETE /api/zones/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM zones WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
