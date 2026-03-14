const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const tableRoutes = require('./Routes/tableRoutes');
const menuRoutes = require('./Routes/MenuRouter');
const path = require('path');
const adminRoutes = require('./Routes/adminRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const inventoryRoutes = require('./Routes/inventoryRoutes');


require('dotenv').config();
require('./Models/db');

const PORT = process.env.PORT || 8080;

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/ping', (req, res) => res.send('PONG'));

app.use(bodyParser.json());
app.use(cors());

app.use('/auth', AuthRouter);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/inventory', inventoryRoutes);

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});