require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Servir fitxers pujats directament des del backend (dev)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || '/app/uploads'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no controlat:', err);
  res.status(500).json({ error: err.message || 'Error intern del servidor' });
});

app.listen(PORT, () => console.log(`🐳 SócBalena backend escoltant al port ${PORT}`));
