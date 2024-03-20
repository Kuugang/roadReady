const jwt = require("jsonwebtoken");
// const { queryDatabase } = require("./your-database-module"); // Import your database module

const verifyToken = async (req, res, next, privilege) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).send("Unauthorized");
    }

    try {
        // const results = await queryDatabase(
        //     "SELECT * FROM blacklist WHERE token = $1",
        //     [token]
        // );

        // if (results.length > 0) {
        //     return res.status(401).send("Token is blacklisted");
        // }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.privilege !== privilege) {
            return res.status(401).send("Unauthorized");
        }
        req.tokenData = payload;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).send("Unauthorized");
    }
};

const verifyDealerAgentToken = async (req, res, next) => {
    await verifyToken(req, res, next, "dealerAgent");
};

const verifyBuyerToken = async (req, res, next) => {
    await verifyToken(req, res, next, "buyer");
};

const verifyAdminToken = async (req, res, next) => {
    await verifyToken(req, res, next, "admin");
}

module.exports = {
    verifyDealerAgentToken,
    verifyBuyerToken,
    verifyAdminToken
};
