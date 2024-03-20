const express = require("express");

const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
    verifyDealerAgentToken,
    verifyBuyerToken,
    verifyAdminToken
} = require("../controllers/middlewares")

const {
    buyerRegister,
    dealerRegister,
    login,

    createListing,
    deleteListing,

    getListing,

    requestDealershipManagerPrivilege,

    getUsers,
    getUser,
    updateUserPrivilege,
} = require("../controllers/mainController");


router.route("/").get(getUsers);

router.route("/buyer/register").post(buyerRegister);
router.route("/dealer/register").post(dealerRegister);
router.route("/user/login").post(login);
router.route("/dealer/list").post(upload.single("image"), verifyDealerAgentToken, createListing);
router.route("/dealer/list").delete(verifyDealerAgentToken, deleteListing);

router.route("/listing").get(getListing);

router.route("/request/1").post(verifyDealerAgentToken, requestDealershipManagerPrivilege);

router.route("/admin/users/update").put(verifyAdminToken, updateUserPrivilege);

// router.route("/user").get(getUser);

module.exports = router;