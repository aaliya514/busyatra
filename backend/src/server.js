require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const http      = require('http');
const { Server } = require('socket.io');
const cron      = require('node-cron');
const { tickSimulation } = require('./simulation');
const { checkDelays }    = require('./delayDetection');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/buses',         require('./routes/buses'));
app.use('/api/routes',        require('./routes/routes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/trips',         require('./routes/trips'));
app.use('/api/user',          require('./routes/user'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.path} not found` }));

// ── Socket.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('track_bus',     (busId)   => socket.join(`bus_${busId}`));
  socket.on('untrack_bus',   (busId)   => socket.leave(`bus_${busId}`));
  socket.on('track_route',   (routeId) => socket.join(`route_${routeId}`));
  socket.on('untrack_route', (routeId) => socket.leave(`route_${routeId}`));

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// ── GPS Simulation (every 3 seconds for simulated buses) ──────
cron.schedule('*/3 * * * * *', () => tickSimulation(io));

// Delay detection (every 60 seconds)
cron.schedule('*/60 * * * * *', () => checkDelays(io));

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚌 BusYatra backend running on http://localhost:${PORT}`);
  console.log('   Simulation: every 3 seconds for non-IoT buses');
  console.log('   Run "npm run seed" first if starting fresh\n');
});
