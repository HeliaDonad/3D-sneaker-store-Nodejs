const express = require('express');
const app = express();
require('dotenv').config();
const User = require('./models/api/v1/userModel'); // Zorg dat het pad naar userModel correct is

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

const createAdminUser = async () => {
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
  }
};
createAdminUser();
connectDB(); // Start de verbinding met MongoDB

// Exporteer `app` zodat het kan worden gebruikt in `www`
module.exports = app;
