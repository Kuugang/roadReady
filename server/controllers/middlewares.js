const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next, privileges) => {
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
        if (!privileges.includes(payload.role)) {
            return res.status(401).send("Unauthorized");
        }
        req.tokenData = payload;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).send("Unauthorized");
    }
};

const verifyDealershipAgentToken = async (req, res, next) => {
    await verifyToken(req, res, next, ["dealershipAgent", "dealershipAgentApplicant"]);
};

const verifyDealerManagerToken = async (req, res, next) => {
    await verifyToken(req, res, next, ["dealerManager"]);
};

const verifyBuyerToken = async (req, res, next) => {
    await verifyToken(req, res, next, ["buyer"]);
};

const verifyAdminToken = async (req, res, next) => {
    await verifyToken(req, res, next, ["admin"]);
};
const verifyRole = async (req, res, next) => {
    await verifyToken(req, res, next, ["buyer", "dealershipAgent", "dealershipManager", "admin"]);
};

module.exports = {
    verifyDealershipAgentToken,
    verifyDealerManagerToken,
    verifyBuyerToken,
    verifyAdminToken,
    verifyRole
};
