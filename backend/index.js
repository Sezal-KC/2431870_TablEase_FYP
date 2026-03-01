const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const tableRoutes = require('./Routes/tableRoutes'); 
const menuRoutes = require('./Routes/MenuRouter');
const path = require ('path');
const adminRoutes = require('./Routes/adminRoutes');
const orderRoutes = require('./Routes/orderRoutes');


require('dotenv').config(); // loading .env file 
require('./Models/db');     // connect to the database file

const PORT = process.env.PORT || 8080;

// small test  just to check server is alive
app.get('/ping', (req, res) => {
  res.send('PONG');
});

//  read JSON body sent from frontend
app.use(bodyParser.json());

// allow the server to accept requests from other origins
app.use(cors());

// all auth related routes will start with /auth
app.use('/auth', AuthRouter);  
app.use('/api/tables', tableRoutes);


app.use('/api/menu', menuRoutes);

app.use('/uploads', express.static('uploads'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', adminRoutes);

app.use('/api/orders', orderRoutes);


// server start
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
