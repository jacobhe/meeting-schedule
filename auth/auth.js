/*jslint node: true, vars: true, nomen: true */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var path = require('path');
var nconf = require('nconf');
nconf.file({ file: path.resolve(__dirname, 'users.json') });
var users = nconf.get('users');

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    var i;
    var len;
    for (i = 0, len = users.length; i < len; i += 1) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object. In the real world, this would query a database;
// however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
    function (username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // Find the user by username. If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message. Otherwise, return the
            // authenticated `user`.
            findByUsername(username, function (err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unkown user ' + username }); }
                if (user.password !== password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            });
        });
    }
));

module.exports = passport;
