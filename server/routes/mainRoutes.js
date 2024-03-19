const express = require("express");
const router = express.Router();
const path = require("path");

const {
    verifyToken,
} = require("../controllers/middlewares")

const {
    buyerRegister,
    dealerRegister,
    login,


    getUsers,
    getUser
} = require("../controllers/mainController");


router.route("/buyer/register").post(buyerRegister);
router.route("/dealer/register").post(dealerRegister);
router.route("/user/login").post(login);




router.route("/").get(getUsers);

router.route("/user").get(getUser);

module.exports = router;