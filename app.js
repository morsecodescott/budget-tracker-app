// app.js
// Assume that your app.js file is in the root directory of your project

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const User = require('./models/User');
const Budget = require('./models/Budget');
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budget');
require('./config/passport')(passport);
require('dotenv').config();

// Create an Express application
const app = express();

// Database connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

// Event handlers for MongoDB connection
db.on('connected', () => {
  console.log(`Connected to MongoDB at ${process.env.MONGO_URI}`);
});

db.on('error', (err) => {
  console.error(`Error in MongoDB connection: ${err.message}`);
});

db.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Close the MongoDB connection when Node.js process is terminated
process.on('SIGINT', () => {
  db.close(() => {
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
  });
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routes
app.use('/auth', authRoutes);
app.use('/budget', budgetRoutes);


app.get('/', (req, res) => {
  // Render the index page
  console.log("/ is getting called");
  res.render('index'); // Assuming your index file is named index.ejs
});

// Dashboard route - GET
app.get('/dashboard', (req, res) => {
  // Render the dashboard page
  res.render('dashboard'); // 
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
