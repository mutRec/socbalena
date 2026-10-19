require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutes API
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/centres',    require('./routes/centres'));
app.use('/api/zones',      require('./routes/zones'));
app.use('/api/immersions', require('./routes/immersions'));
app.use('/api/media',      require('./routes/media'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'SócBalena', ts: new Date() }));

// Migracions idempotents: garanteixen que l'esquema del volum existent estigui al dia
async function migrar(intents = 5) {
  try {
    await pool.query('ALTER TABLE centres ADD COLUMN IF NOT EXISTS logo_url TEXT');
  } catch (err) {
    if (intents > 0) {
      console.warn(`Migració ajornada (${err.message}); reintent en 3 s`);
      setTimeout(() => migrar(intents - 1), 3000);
    } else {
      console.error("No s'han pogut aplicar les migracions:", err.message);
    }
  }
}
migrar();

// Servir fitxers pujats directament des del backend (dev)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || '/app/uploads'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no controlat:', err);
  res.status(500).json({ error: err.message || 'Error intern del servidor' });
});

app.listen(PORT, () => console.log(`🐳 SócBalena backend escoltant al port ${PORT}`));
