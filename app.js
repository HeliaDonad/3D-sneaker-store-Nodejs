const express = require('express');
const cors = require('cors'); // Importeer cors
const app = express();
require('dotenv').config();
const User = require('./models/api/v1/userModel'); // Zorg dat het pad naar userModel correct is
const bcrypt = require('bcryptjs');
const allowedOrigins = ['https://threed-sneaker-store-seda-ezzat-helia.onrender.com',  'http://localhost:5173'];

// Configuratie en middleware toevoegen
app.use(cors({
  origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) { 
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
// Configuratie en middleware toevoegen
app.use(express.json());

const connectDB = require('./config/db');
app.get('/', (req, res) => {
  res.send('Welcome to the 3D Configurator API');
});

const orderRoutes = require('./routes/api/v1/orderRoutes');
app.use('/api/v1', orderRoutes);


const userRoutes = require('./routes/api/v1/UserRoutes');
app.use('/api/v1', userRoutes);

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

connectDB(); // Start de verbinding met MongoDB
createAdminUser();

// Exporteer `app` zodat het kan worden gebruikt in `www`
module.exports = app;
