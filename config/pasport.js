const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/userModel/userSchema");
const env = require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://capturepro.arshanap.in.net/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // console.log("Google profile:", profile); // Log the profile information for debugging

        let user = await User.findOne({ googleId: profile.id });

        const email = profile.emails[0].value;

        if (user) {
            return done(null, user); 
        }

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            console.log("User with this email already exists.");
            if (existingUser.isBlocked) {
                return done(null, false, { message: "This user is blocked. Please contact support." });
            }
            return done(null, false, { message: "This email is already registered. Please log in." });
        }

        user = new User({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
        });
        await user.save();
        return done(null, user);
    } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});

module.exports = { passport };