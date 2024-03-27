const express = require("express");
const passport = require("passport");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const { v4: uuidv4 } = require('uuid');

const {
    verifyDealershipAgentToken,
    verifyBuyerToken,
    verifyAdminToken,
    verifyRole,
    verifyDealerManagerToken
} = require("../controllers/middlewares")

const {
    buyerRegister,
    dealerRegister,
    login,

    getUserProfile,
    updateUserProfile,

    requestOTPCode,
    verify,

    createListing,
    updateListing,
    deleteListing,
    getListing,

    getDealership,

    createCashApplicationRequest,
    createInstallmentApplicationRequest,
    updateApplicationRequest,
    updateRegistrationRequest,


    //dealershipmanager
    updateAgentStatus,

    //admin
    updateUserStatus,
    getUsers,
} = require("../controllers/mainController");


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
            callbackURL: 'http://road-ready-black.vercel.app/auth/google/callback',
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

                // const query = `
                // INSERT INTO tblUserProfile (id, firstname, lastname, phonenumber, address, gender, role)
                // VALUES ($1, $2, $3, $4, $5, $6, 'buyer')
                // RETURNING *;
                // `;

                // const user = (await pool.query(query, [uuidv4(), profile, "lastName", '099123', 'testadress', 'male'])).rows[0];
                done(null, 0);
            } catch (error) {
                console.error(error)
            }
        }
    )
)


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    }),
    // async (req, res, next) => {
    //     return res.status(200).json({ status: true, message: "Successfully logged in or register" });
    // }
)





//REGISTER
router.route("/buyer/register").post(buyerRegister);
router.route("/dealer/register").post(dealerRegister);

//LOGIN
router.route("/user/login").post(login);

//GET PROFILE
router.route("/user/profile").get(getUserProfile);

//UPDATE PROFILE
router.route("/user/profile").put(verifyRole, updateUserProfile);
router.route("/user/otp").get(requestOTPCode);
router.route("/buyer/verify").post(verify);

router.route("/dealership").get(getDealership);

//returns listing based on string query, returns listing regardless if available of not
router.route("/listing").get(getListing);

const cashPaymentUpload = upload.fields([
    { name: 'signature' },
    { name: 'validId' }
])
router.route("/buyer/apply/cash").post(cashPaymentUpload, verifyBuyerToken, createCashApplicationRequest);
const installmentPaymentUpload = upload.fields([
    { name: 'buyerValidId', maxCount: 1 },
    { name: 'buyerSignature', maxCount: 1 },
    { name: 'coMakerValidId', maxCount: 1 },
    { name: 'coMakerSignature', maxCount: 1 }
]);
router.route("/buyer/apply/installment").post(installmentPaymentUpload, verifyBuyerToken, createInstallmentApplicationRequest);

//dealershipAgent routes
router.route("/dealershipagent/listing").post(upload.single("image"), verifyDealershipAgentToken, createListing);

//todo can also update the picture
router.route("/dealershipagent/listing").put(verifyDealershipAgentToken, updateListing);
router.route("/dealershipagent/listing").delete(verifyDealershipAgentToken, deleteListing);

router.route("/dealershipagent/application").put(verifyDealershipAgentToken, updateApplicationRequest);
router.route("/dealershipagent/registration").put(verifyDealershipAgentToken, updateRegistrationRequest);

//dealershipManager routes
router.route("/dealershipmanager/agent").put(verifyDealerManagerToken, updateAgentStatus)

//admin
router.route("/admin/users/status").put(verifyAdminToken, updateUserStatus);
router.route("/admin/users").get(verifyAdminToken, getUsers);


module.exports = router;