const { sessionStore } = require('../config/sessionStore');
const User = require('../models/User');

const socketAuthMiddleware = (socket, next) => {
    const sessionID = socket.handshake.auth.token;

    if (!sessionID) {
        return next(new Error('Authentication error: No session token provided.'));
    }

    sessionStore.get(sessionID, (err, session) => {
        if (err) {
            return next(new Error('Authentication error: Could not retrieve session.'));
        }
        if (!session || !session.passport || !session.passport.user) {
            return next(new Error('Authentication error: Invalid session or user not authenticated.'));
        }

        User.findById(session.passport.user)
            .then(user => {
                if (!user) {
                    return next(new Error('Authentication error: User not found.'));
                }
                socket.user = user;
                next();
            })
            .catch(err => {
                return next(new Error('Authentication error: Database error while finding user.'));
            });
    });
};

module.exports = socketAuthMiddleware;
