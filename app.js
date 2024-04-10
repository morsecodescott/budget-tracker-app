
// Essential module imports
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const crypto = require('crypto'); // For generating session secret
require('dotenv').config();

// Model imports
const User = require('./models/User');
const Budget = require('./models/Budget');

// Route handler imports
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budget');
const categoryRoutes = require('./routes/category');

// Authentication and authorization utilities
const { ensureAuthenticated, isAdmin } = require('./config/auth');
const passportConfig = require('./config/passport')(passport); // Initialize passport config

// Session store setup
let sessionStore;
if (process.env.NODE_ENV === 'production') {
    // Production environment: Use RedisStore
    const RedisStore = require('connect-redis').default;
    const redis = require('redis');
    const redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.connect().catch(console.error);
    sessionStore = new RedisStore({ client: redisClient });
} else {
    // Development environment: Use default MemoryStore
    sessionStore = new session.MemoryStore();
}

// Express app initialization
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on('connected', () => console.log('Connected to MongoDB.'));
db.on('error', (err) => console.error(`MongoDB connection error: ${err.message}`));
db.on('disconnected', () => console.log('Disconnected from MongoDB.'));
process.on('SIGINT', () => {
  db.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// App settings and middleware
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Session configuration
const sessionSecret = crypto.randomBytes(64).toString('hex');
app.use(session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
}));

// Passport and flash messages
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  res.locals.appName = 'ChaChing';
  res.locals.appSlogan = 'Make Every Dollar Count';
  res.locals.currentUser = req.user; // Set currentUser from req.user
  res.locals.error_msg = req.flash('error_msg');
  res.locals.success_msg = req.flash('success_msg');
  next();
});

// Authentication middleware for protected routes
app.use((req, res, next) => {
  if (['/', '/auth/login', '/auth/register', '/test'].includes(req.originalUrl)) {
    return next(); // Skip authentication for specific routes
  }
  ensureAuthenticated(req, res, next); // Apply to all other routes
});

// Routing
app.use('/auth', authRoutes);
app.use('/budget', budgetRoutes);
app.use('/categories', categoryRoutes);

// Root route
app.get('/', (req, res) => res.render('index'));

// Dashboard route with budget items fetching
app.get('/dashboard', async (req, res) => {
  try {
    const budgetItems = await Budget.find({ user: req.user._id });
    res.render('dashboard', { budgetItems, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('dashboard', { error: 'Failed to load budget items.' });
  }
});

// Test and category management routes
app.get('/test', (req, res) => res.render('test'));
app.get('/categoryManagement', (req, res) => res.render('categoryManagement'));

// Start server
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
module.exports = { app, server }; // Export for testing or modular use
