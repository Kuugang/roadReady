// import all the things we need  
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { pool } = require("./supabaseConfig")

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: '/auth/google/callback',
                passReqToCallback: true
            },
            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    displayName: profile.displayName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    image: profile.photos[0].value,
                    email: profile.emails[0].value
                }

                const query = `
                    INSERT INTO tblUserProfile (id, firstname, lastname, phonenumber, address, gender, role)
                    VALUES ($1, $2, $3, $4, $5, $6, 'buyer')
                    RETURNING *;
                    `;

                await pool.query(query, [newUser.id, newUser.firstName, newUser.lastName, '099123', 'testadress', 'male', 'buyer']);

                // try {
                //     //find the user in our database 
                //     let user = await User.findOne({ googleId: profile.id })

                //     if (user) {
                //         //If user present in our database.
                //         done(null, user)
                //     } else {
                //         // if user is not preset in our database save user data to database.
                //         user = await User.create(newUser)
                //         done(null, user)
                //     }
                // } catch (err) {
                //     console.error(err)
                // }


            }
        )
    )

    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    })
}
