const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ── Route imports 
const AuthRouter = require('./Routes/AuthRouter');
const tableRoutes = require('./Routes/tableRoutes');
const menuRoutes = require('./Routes/MenuRouter');
const adminRoutes = require('./Routes/adminRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const inventoryRoutes = require('./Routes/inventoryRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');

// ── Environment + Database
require('dotenv').config();
require('./Models/db');

const PORT = process.env.PORT || 8080;

// ── Allowed origins (localhost + production frontend) 
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL // add  Render frontend URL here later
].filter(Boolean); 

// ── CORS config
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
};

// ── Create HTTP server and Socket.io 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// ── Make io accessible in all routes 
app.set('io', io);

// ── Socket.io connection handler 
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Middleware 
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── Static files (uploads folder) 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check
app.get('/ping', (req, res) => res.json({ status: 'ok', message: 'PONG' }));

// ── API Routes
app.use('/auth', AuthRouter);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);

// ── 404 handler 
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start server 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});