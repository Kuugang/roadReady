const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { supabase, pool } = require("./supabaseConfig")

module.exports = function (passport) {


    passport.use(
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://road-ready-black.vercel.app/auth/google/callback",
            passReqToCallback: true
        },
            async function (request, accessToken, refreshToken, profile, done) {
                console.log(profile);

                let { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                })

                let query = "SELECT * FROM tblUserProfile WHERE firstName = $1";
                const user = (await pool.query(query, ['Jake'])).rows[0];
                console.log(user);
                return done(null, user);
            }
        )
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(async function (id, done) {
        try {
            const query = "SELECT * FROM tblUserProfile WHERE id = $1";
            const user = (await pool.query(query, [id])).rows[0];
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
}
