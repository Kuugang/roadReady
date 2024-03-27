// import all the things we need  
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { v4: uuidv4 } = require('uuid');
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
                try {
                    // let testId = profile.id

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

                    const user = (await pool.query(query, [uuidv4(), profile, "lastName", '099123', 'testadress', 'male'])).rows[0];

                } catch (error) {
                    console.error(error)
                }
            }
        )
    )
}
