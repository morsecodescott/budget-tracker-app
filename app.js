// app.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const User = require('./models/User');
const Budget = require('./models/Budget');
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budget');
const categoryRoutes = require('./routes/category');
const { ensureAuthenticated, isAdmin } = require('./config/auth');
const passportConfig = require('./config/passport')(passport); // Pass passport instance
const crypto = require('crypto'); // Import crypto module for generating session secret
require('dotenv').config();

// Define app name and slogan
const appName = 'ChaChing';
const appSlogan = 'Make Every Dollar Count';

const app = express();

// Generate a random session secret
const sessionSecret = crypto.randomBytes(64).toString('hex');



// Database connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

// MongoDB event handlers
db.on('connected', () => console.log(`Connected to MongoDB.`));
db.on('error', (err) => console.error(`Error in MongoDB connection: ${err.message}`));
db.on('disconnected', () => console.log('Disconnected from MongoDB'));

// Close MongoDB connection on app termination
process.on('SIGINT', () => {
  db.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: sessionSecret, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static('public')); // Serve static files from 'public' directory

// Set locals
app.use((req, res, next) => {
  res.locals.appName = appName;
  res.locals.appSlogan = appSlogan;
  res.locals.currentUser = req.user; // Set currentUser from req.user
  res.locals.error_msg = req.flash('error_msg');
  res.locals.success_msg = req.flash('success_msg');
  next();
});



// Middleware to ensure authentication
app.use((req, res, next) => {
  if (req.originalUrl === '/' || req.originalUrl === '/auth/login' || req.originalUrl === '/auth/register' || req.originalUrl === '/test') {
    // Skip authentication for the routes above) {
      // Skip authentication for the routes above
      return next();
  }
  ensureAuthenticated(req, res, next); // Apply ensureAuthenticated middleware to all other routes
});


// Routes
app.use('/auth', authRoutes);
app.use('/budget', budgetRoutes);
app.use('/categories', categoryRoutes);

// Route handlers
app.get('/', (req, res) => res.render('index'));
//app.get('/dashboard', (req, res) => res.render('dashboard'));

app.get('/test', (req,res) => res.render('test'));
app.get('/categoryManagement',(req,res) => res.render('categoryManagement'));

app.get('/dashboard', async (req, res) => {
  try {
    // Fetching budget items for the logged-in user
    const budgetItems = await Budget.find({ user: req.user._id });

    // Rendering the dashboard page and passing the budgetItems to it
    res.render('dashboard', { 
      budgetItems: budgetItems, 
      user: req.user // Assuming you want to pass the user object as well
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('dashboard', { 
      error: 'Failed to load budget items.', 
      user: req.user 
    });
  }
});


// Server setup
const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
module.exports = server; // Export the server for use in tests
module.exports = app; // Export the Express app instance