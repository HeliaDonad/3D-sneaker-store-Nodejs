const express = require("express");
const cors = require("cors"); // Importeer cors
require("dotenv").config(); // Laad .env bestanden
const bcrypt = require("bcryptjs"); // Voor hashing van wachtwoorden
const User = require("./models/api/v1/userModel"); // Zorg dat het pad naar userModel correct is
const connectDB = require("./config/db");
const productRoutes = require("./routes/api/v1/productRoutes"); // Importeer productRoutes

const app = express(); // Maak een Express-app

// Toegestane origins voor CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://threed-sneaker-store-seda-ezzat-helia.onrender.com",
];

app.use('/api/v1', productRoutes); // Gebruik de routes hier

// Middleware voor CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: Origin ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors()); // Opties voor alle routes
app.use(express.json());

// Basisroute
app.get("/", (req, res) => {
  res.send("Welcome to the 3D Configurator API");
});

// Routes importeren
const orderRoutes = require("./routes/api/v1/orderRoutes");
const userRoutes = require("./routes/api/v1/UserRoutes");

// Routes gebruiken
app.use('/api/v1', productRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', userRoutes);

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Sta cookies en autorisatie toe
  },
});


io.on("connection", (socket) => {
  console.log("Gebruiker verbonden met WebSocket");
  socket.on("disconnect", () => {
    console.log("Gebruiker verbroken van WebSocket");
  });
});

// Middleware om `io` beschikbaar te maken in routes
app.use((req, res, next) => {
  req.io = io; // Socket.IO toevoegen aan het request-object
  next();
});

// Functie om een standaard admingebruiker aan te maken
const createAdminUser = async () => {
  try {
    const adminEmail = "admin@admin.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin", 10);
      const adminUser = new User({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      });
      await adminUser.save();
      console.log("Admin user created successfully with email:", adminEmail);
    } else {
      console.log("Admin user already exists with email:", adminEmail);
    }
  } catch (error) {
    console.error("Error creating admin user:", error.message);
  }
};

// Start verbinding met MongoDB en maak een admingebruiker aan
connectDB();
createAdminUser();

// Exporteer de Express-app
module.exports = app;
