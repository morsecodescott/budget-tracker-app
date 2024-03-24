const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const User = require('./models/User');
const Budget = require('./models/Budget');
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budget');
const passportConfig = require('./config/passport');
require('dotenv').config();

const app = express();

// Database connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

// MongoDB event handlers
db.on('connected', () => console.log(`Connected to MongoDB at ${process.env.MONGO_URI}`));
db.on('error', (err) => console.error(`Error in MongoDB connection: ${err.message}`));
db.on('disconnected', () => console.log('Disconnected from MongoDB'));

// Close MongoDB connection on app termination
process.on('SIGINT', () => {
  db.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static('public')); // Serve static files from 'public' directory

// Routes
app.use('/auth', authRoutes);
app.use('/budget', budgetRoutes);

// Route handlers
app.get('/', (req, res) => res.render('index'));
app.get('/dashboard', (req, res) => res.render('dashboard'));

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
