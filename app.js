const express = require('express');
const app = express();
require('dotenv').config();

// Configuratie en middleware toevoegen
app.use(express.json());

const connectDB = require('./config/db');
require('dotenv').config();
app.get('/', (req, res) => {
  res.send('Welcome to the 3D Configurator API');
});

const orderRoutes = require('./routes/api/v1/orderRoutes');
app.use('/api/v1', orderRoutes);


const userRoutes = require('./routes/api/v1/UserRoutes');
app.use('/api/v1', userRoutes);


connectDB(); // Start de verbinding met MongoDB

// Exporteer `app` zodat het kan worden gebruikt in `www`
module.exports = app;
