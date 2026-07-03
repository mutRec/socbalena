const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticat' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuari = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invàlid o caducat' });
  }
}

function adminOnly(req, res, next) {
  if (req.usuari?.rol !== 'admin') {
    return res.status(403).json({ error: 'Accés restringit a administradors' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
