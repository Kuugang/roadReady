const express = require("express");

const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

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
router.route("/user/otp").post(verify);

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
router.route("/dealershipagent/application").put(verifyDealershipAgentToken, updateApplicationRequest);
router.route("/dealershipagent/registration").put(verifyDealershipAgentToken, updateRegistrationRequest);

//dealershipManager routes
router.route("/dealershipmanager/agent").put(verifyDealerManagerToken, updateAgentStatus)

//admin
router.route("/admin/users/status").put(verifyAdminToken, updateUserStatus);
router.route("/admin/users").get(verifyAdminToken, getUsers);


module.exports = router;