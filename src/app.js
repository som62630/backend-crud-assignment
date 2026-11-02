import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
export function createApp({ mongoUri, sessionSecret, sessionStore, production = false }) {
  if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(session({ name: 'sid', secret: sessionSecret, resave: false, saveUninitialized: false,
    store: sessionStore ?? MongoStore.create({ mongoUrl: mongoUri, ttl: 86400 }),
    cookie: { httpOnly: true, secure: production, sameSite: 'lax', maxAge: 86400000 } }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
  app.use((err, req, res, next) => {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: 'Invalid input' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' });
    console.error('Request failed:', err.name);
    res.status(500).json({ message: 'Internal server error' });
  });
  return app;
}
