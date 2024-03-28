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

                // let { data, error } = await supabase.auth.signInWithPassword({
                //     email: email,
                //     password: password
                // })

                let query = "SELECT * FROM tblUserProfile WHERE email = $1";
                const user = (await pool.query(query, [profile.email])).rows[0];

                if (!user) {
                    query = `
                        INSERT INTO tblUserProfile (id, firstname, lastname, email, role)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, 'buyer')
                        RETURNING *;
                        `;

                }
                return done(null, user);
                console.log(user);
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
