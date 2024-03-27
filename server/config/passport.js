// import all the things we need  
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { pool } = require("./supabaseConfig")

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
                clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
                callbackURL: '/auth/google/callback',
                passReqToCallback: true
            },
            async (accessToken, refreshToken, profile, done) => {
                // const newUser = {
                //     googleId: profile.id,
                //     displayName: profile.displayName,
                //     firstName: profile.name.givenName,
                //     lastName: profile.name.familyName,
                //     image: profile.photos[0].value,
                //     email: profile.emails[0].value
                // }

                const query = `
                    INSERT INTO tblUserProfile (id, firstname, lastname, phonenumber, address, gender, role)
                    VALUES ($1, $2, $3, $4, $5, $6, 'buyer')
                    RETURNING *;
                    `;

                await pool.query(query, ["123", "firstName", "lastName", '099123', 'testadress', 'male', 'buyer']);

                done(null, "1");
            }
        )
    )

    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, "1")
    })

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        done(err, "test");
        // User.findById(id, (err, user) => {
        //     done(err, user);
        // });
    })
}
