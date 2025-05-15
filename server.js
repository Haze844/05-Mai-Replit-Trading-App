import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { setupAuth } from './server/auth.js'; // Import mit korrekter Dateiendung
import { registerRoutes } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ➤ Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ➤ Auth & Session
setupAuth(app); // enthält session(), passport.initialize(), etc.

// ➤ API-Routen
await registerRoutes(app);

// ➤ Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// ➤ Debug-Routen
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    headers: req.headers,
    session: req.session || null,
    user: req.user || null,
    time: new Date().toISOString()
  });
});

// ➤ Statische Dateien aus Vite-Build
const clientPath = path.join(__dirname, 'dist');
app.use(express.static(clientPath));

// ➤ Weiterleitung von "/" direkt zu "/auth"
app.get('/', (_req, res) => {
  res.redirect('/auth');
});

// ➤ SPA-Fallback: alle nicht-API- und nicht-Datei-Routen auf index.html
app.get('*', (req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/') &&
    !req.path.includes('.') &&
    req.headers.accept?.includes('text/html')
  ) {
    return res.sendFile(path.join(clientPath, 'index.html'));
  }
  next();
});

// ➤ Serverstart
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT} im ${process.env.NODE_ENV || 'development'}-Modus`);
});