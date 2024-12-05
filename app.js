const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');

// Express-app initialiseren
const app = express();

// Middleware toevoegen
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://threed-sneaker-store-seda-ezzat-helia.onrender.com',
];

if (!process.env.ALLOWED_ORIGINS) {
  console.warn('ALLOWED_ORIGINS is not set. Using default origins:', allowedOrigins);
}

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes importeren
const orderRoutes = require('./routes/api/v1/orderRoutes');
const userRoutes = require('./routes/api/v1/UserRoutes');

// Routes koppelen
const setupRoutes = (app) => {
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/users', userRoutes);
  app.get('/', (req, res) => res.send('Welcome to the 3D Configurator API'));
};

setupRoutes(app);

// Verbinden met de database
connectDB();

// Fallback voor niet-bestaande routes
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// Algemene foutafhandeling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
