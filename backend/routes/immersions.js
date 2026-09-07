const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const NUMERICS = ['profunditat_max','profunditat_mitja','temps_fons','temps_superficie',
  'pressio_entrada','pressio_sortida','consum_aire','capacitat_bombona','pes_llastre',
  'temp_aigua','temp_aire','valoracio','numero_immersio'];

const CAMP_TIPUS = {
  numero_immersio:  'integer',
  data:             'date',
  hora_entrada:     'time',
  hora_sortida:     'time',
  zona_id:          'uuid',
  centre_id:        'uuid',
  profunditat_max:  'numeric',
  profunditat_mitja:'numeric',
  temps_fons:       'integer',
  temps_superficie: 'integer',
  pressio_entrada:  'integer',
  pressio_sortida:  'integer',
  consum_aire:      'integer',
  capacitat_bombona:'integer',
  tipus_gas:        'text',
  visibilitat:      'text',
  corrent:          'text',
  onatge:           'text',
  temp_aigua:       'numeric',
  temp_aire:        'numeric',
  tipus_vestit:     'text',
  pes_llastre:      'numeric',
  company:          'text',
  instructor:       'text',
  tipus_immersio:   'text',
  valoracio:        'integer',
  notes:            'text',
};

function netejarDades(dades) {
  const resultat = { ...dades };
  Object.keys(resultat).forEach(k => {
    if (resultat[k] === '' || resultat[k] === undefined) {
      resultat[k] = null;
    }
    if (NUMERICS.includes(k) && resultat[k] !== null) {
      const n = parseFloat(resultat[k]);
      resultat[k] = isNaN(n) ? null : n;
    }
    if (['hora_entrada','hora_sortida'].includes(k) && resultat[k] !== null) {
      resultat[k] = resultat[k].slice(0, 5) || null;
    }
  });
  return resultat;
}

const CAMPS = [
  'numero_immersio','data','hora_entrada','hora_sortida','zona_id','centre_id',
  'profunditat_max','profunditat_mitja','temps_fons','temps_superficie',
  'pressio_entrada','pressio_sortida','consum_aire','capacitat_bombona','tipus_gas',
  'visibilitat','corrent','onatge','temp_aigua','temp_aire',
  'tipus_vestit','pes_llastre','company','instructor','tipus_immersio',
  'valoracio','notes'
];

// GET /api/immersions
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
       ORDER BY i.numero_immersio DESC NULLS LAST
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

  const dades = netejarDades(req.body);

  let num = dades.numero_immersio;
  if (!num) {
    const r = await pool.query(
      'SELECT COALESCE(MAX(numero_immersio), 0) + 1 AS seg FROM immersions WHERE usuari_id = $1::uuid',
      [req.usuari.id]
    );
    num = r.rows[0].seg;
  }

  // usuari_id com a literal directe a la query per evitar problema de tipus amb $1 null
  const vals = CAMPS.map(c => c === 'numero_immersio' ? num : (dades[c] ?? null));
  const placeholders = CAMPS.map((c, i) => `$${i + 1}::${CAMP_TIPUS[c]}`).join(', ');

  try {
    const { rows } = await pool.query(
      `INSERT INTO immersions (usuari_id, ${CAMPS.join(', ')})
       VALUES ('${req.usuari.id}'::uuid, ${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/immersions/:id
router.put('/:id', async (req, res) => {
  const dades = netejarDades(req.body);

  // Si numero_immersio ve null, conservar el valor actual de la BD
  if (dades.numero_immersio === null) {
    const actual = await pool.query(
      'SELECT numero_immersio FROM immersions WHERE id = $1::uuid AND usuari_id = $2::uuid',
      [req.params.id, req.usuari.id]
    );
    if (actual.rows.length) dades.numero_immersio = actual.rows[0].numero_immersio;
  }

  const vals = CAMPS.map(c => dades[c] ?? null);
  const sets = CAMPS.map((c, i) => `${c} = $${i + 1}::${CAMP_TIPUS[c]}`).join(', ');
  const idPos = CAMPS.length + 1;

  const query = `UPDATE immersions SET ${sets}
     WHERE id = $${idPos}::uuid
     AND usuari_id = '${req.usuari.id}'::uuid
     RETURNING *`;

  try {
    const { rows } = await pool.query(query, [...vals, req.params.id]);
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
    await pool.query(
      'DELETE FROM immersions WHERE id = $1::uuid AND usuari_id = $2::uuid',
      [req.params.id, req.usuari.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
