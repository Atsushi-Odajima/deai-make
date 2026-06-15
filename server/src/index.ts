import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { avatarSvg } from './avatar.js';
import { initRealtime } from './realtime.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { discoveryRouter } from './routes/discovery.js';
import { swipesRouter } from './routes/swipes.js';
import { matchesRouter } from './routes/matches.js';
import { messagesRouter } from './routes/messages.js';
import { safetyRouter } from './routes/safety.js';

const app = express();
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '8mb' })); // generous limit for base64 photo uploads

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'mingle', time: new Date().toISOString() }));

// Server-rendered gradient avatars (offline-safe imagery for every profile).
app.get('/api/avatar/:seed.svg', (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name : '';
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(avatarSvg(req.params.seed, name));
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/swipes', swipesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/safety', safetyRouter);

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

const server = http.createServer(app);
initRealtime(server);

server.listen(config.port, () => {
  console.log(`Mingle API listening on ${config.publicUrl}`);
});
