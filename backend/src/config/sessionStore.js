// backend/src/config/sessionStore.js

const session = require('express-session');
const crypto = require('crypto');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

let sessionStore;
let sessionMiddleware;

if (process.env.NODE_ENV === 'production') {
    // Production environment: Use RedisStore
    const redisClient = redis.createClient({ url: process.env.REDIS_URL });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.connect().catch(console.error);

    sessionStore = new RedisStore({ client: redisClient });
} else {
    // Development environment: Use default MemoryStore
    sessionStore = new session.MemoryStore();
}

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
if (sessionSecret === 'development_secret') {
    console.warn('Using a default development session secret. Please set a secure SESSION_SECRET in your .env file for production.');
}


sessionMiddleware = session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
});

const setupSessionStore = (app) => {
    app.use(sessionMiddleware);
};


module.exports = { setupSessionStore, sessionMiddleware, sessionStore };
