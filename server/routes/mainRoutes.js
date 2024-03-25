const express = require("express");

const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
    verifyDealershipAgentToken,
    verifyBuyerToken,
    verifyAdminToken,
    verifyRole
} = require("../controllers/middlewares")

const {
    buyerRegister,
    dealerRegister,
    login,

    getUserProfile,
    updateUserProfile,

    createListing,
    deleteListing,
    getListing,

    getDealership,

    createCashApplicationRequest,
    createInstallmentApplicationRequest,
    updateApplicationRequest,



    //wala pani
    requestDealershipManagerPrivilege,
    getUsers,
    getUser,
    updateUserPrivilege,
} = require("../controllers/mainController");


router.route("/").get(getUsers);

//REGISTER
router.route("/buyer/register").post(buyerRegister);
router.route("/dealer/register").post(dealerRegister);

//LOGIN
router.route("/user/login").post(login);

//GET PROFILE
router.route("/user/profile").get(getUserProfile);

//UPDATE PROFILE
router.route("/user/profile").put(verifyRole, updateUserProfile);

router.route("/dealership").get(getDealership);

router.route("/dealershipagent/list").post(upload.single("image"), verifyDealershipAgentToken, createListing);

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
router.route("/dealershipagent/application").put(verifyDealershipAgentToken, updateApplicationRequest);




//wala pani
router.route("/dealer/list").delete(verifyDealershipAgentToken, deleteListing);

router.route("/listing").get(getListing);

router.route("/request/1").post(verifyDealershipAgentToken, requestDealershipManagerPrivilege);

router.route("/admin/users/update").put(verifyAdminToken, updateUserPrivilege);

// router.route("/user").get(getUser);

module.exports = router;