const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
    verifyDealerToken,
    verifyBuyerToken
} = require("../controllers/middlewares")

const {
    buyerRegister,
    dealerRegister,
    login,

    createListing,
    deleteListing,

    getListing,

    getUsers,
    getUser
} = require("../controllers/mainController");


router.route("/buyer/register").post(buyerRegister);
router.route("/dealer/register").post(dealerRegister);
router.route("/user/login").post(login);
router.route("/dealer/list").post(upload.single("image"), verifyDealerToken, createListing);
router.route("/dealer/list").delete(verifyDealerToken, deleteListing);

router.route("/listing").get(getListing);

router.route("/").get(getUsers);

// router.route("/user").get(getUser);

module.exports = router;