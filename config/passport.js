// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing

const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            console.log("passport is called");
            User.findOne({ email: email.toLowerCase() }) // Use email to find the user
                .then(user => {
                    if (!user) {
                        console.log('User not found');
                        return done(null, false, { message: 'Email not registered' }); // Update message for email
                    }
                    // Compare hashed passwords
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            console.error('Error comparing passwords:', err);
                            return done(err);
                        }
                        if (isMatch) {
                            console.log('User authenticated:', user.email); // Log email instead of username
                            return done(null, user);
                        } else {
                            console.log('Incorrect password');
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => {
                    console.error('Error finding user:', err);
                    done(err);
                });
        })
    );

    passport.serializeUser((user, done) => {
        // console.log('Serializing user:', user);
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => {
                if (!user) {
                    console.log('User not found during deserialization');
                    return done(null, false, { message: 'User not found' });
                }
                //console.log('Deserializing user:', user);
                return done(null, user);
            })
            .catch(err => {
                console.error('Error deserializing user:', err);
                done(err);
            });
    });
};
