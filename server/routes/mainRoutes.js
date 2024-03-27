const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const { v4: uuidv4 } = require('uuid');


const GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require("passport");
const { pool } = require("../config/supabaseConfig")


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


passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://road-ready-black.vercel.app/auth/google/callback",
        passReqToCallback: true
    },
        async function (request, accessToken, refreshToken, profile, done) {
            let query = "SELECT * FROM tblUserProfile WHERE firstName = $1";
            const user = (await pool.query(query, ['Jake'])).rows[0];
            console.log(user);
            return done(null, user);
        }
    ));

router.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));

router.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    })
);

router.get('/auth/google/success', (req, res) => {
    res.send('Google authentication successful!');
});

router.get('/auth/google/failure', (req, res) => {
    res.send('Google authentication failed!');
});



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