const express = require("express");
const router = express.Router();
const path = require("path");

const {
    verifyToken,
} = require("../controllers/middlewares")

const {
    getUsers,
    getUser,
    register
} = require("../controllers/mainController");


router.route("/").get(getUsers);
router.route("/user/register").post(register);
router.route("/user").get(getUser);

module.exports = router;