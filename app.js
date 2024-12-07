const express = require('express');
const cors = require('cors'); // Importeer cors
const app = express();
require('dotenv').config(); // Laad .env bestanden
const User = require('./models/api/v1/userModel'); // Zorg dat het pad naar userModel correct is
const bcrypt = require('bcryptjs'); // Voor hashing van wachtwoorden
const { Server } = require('socket.io'); // Voor live updates
const http = require('http');

const openaiRoutes = require('./routes/api/v1/openai');
app.use('/api/v1', openaiRoutes);

// Maak een HTTP-server
const server = http.createServer(app);

// Configureer Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://threed-sneaker-store-seda-ezzat-helia.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected to WebSocket');
  socket.on('disconnect', () => {
    console.log('User disconnected from WebSocket');
  });
});


// Middleware om Socket.IO te injecteren in requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Toegestane origins voor CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://threed-sneaker-store-seda-ezzat-helia.onrender.com'];

// Configuratie en middleware toevoegen
app.use(cors({
  origin: function (origin, callback) {
    // Controleer of de origin in de toegestane lijst staat
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Toegestane HTTP-methoden
  allowedHeaders: ['Content-Type', 'Authorization'], // Toegestane headers
}));

// Middleware voor JSON
app.use(express.json());

// Connectie naar MongoDB
const connectDB = require('./config/db');

// Basisroute
app.get('/', (req, res) => {
  res.send('Welcome to the 3D Configurator API');
});

// Routes importeren
const orderRoutes = require('./routes/api/v1/orderRoutes');
const userRoutes = require('./routes/api/v1/UserRoutes');

// Routes gebruiken
app.use('/api/v1', orderRoutes);
app.use('/api/v1', userRoutes);

// Functie om een standaard admingebruiker aan te maken
const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@admin.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin', 10); // Wachtwoord 'Admin' wordt gehasht
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      });
      await adminUser.save();
      console.log('Admin user created successfully with email:', adminEmail);
    } else {
      console.log('Admin user already exists with email:', adminEmail);
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

// Start verbinding met MongoDB en maak een admingebruiker aan
connectDB();
createAdminUser();

// Exporteer `server` in plaats van `app` om Socket.IO te ondersteunen
module.exports = { app, server };
