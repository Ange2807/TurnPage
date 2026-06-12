import express, { json } from 'express';
import cors from 'cors';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors());
app.use(json());

// ── Rutas (se irán agregando) ─────────────────────────────────
app.use('/api/auth', authRoutes);
// app.use('/api/usuarios', import('./routes/usuarios.js'));
// app.use('/api/libros',  require('./routes/libros.js'));
// app.use('/api/estante', require('./routes/estante.js'));
// app.use('/api/resenas', require('./routes/resenas.js'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'TurnPage API' });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler (siempre al final) ─────────────────────────
app.use(errorHandler);

export default app;
