// backend/src/config/sessionStore.js

const session = require('express-session');
const crypto = require('crypto');

// Function to set up the session store
const setupSessionStore = (app) => {
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

    // Session configuration
    const sessionSecret = crypto.randomBytes(64).toString('hex');
    
    app.use(session({
        store: sessionStore,
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            //sameSite: "none",
            secure: process.env.NODE_ENV === 'production', // ensure cookies are only sent over HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));
};

module.exports = { setupSessionStore };
