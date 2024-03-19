const jwt = require("jsonwebtoken");

const verifyDealerToken = async (req, res, next) => {
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
        if (payload.privilege != "dealer") {
            return res.status(401).send("Unauthorized");
        }
        req.tokenData = payload;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send("Unauthorized");
    }
};


const verifyBuyerToken = async (req, res, next) => {
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
        if (payload.privilege != "buyer") {
            return res.status(401).send("Unauthorized");
        }
        req.tokenData = payload;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send("Unauthorized");
    }
};


module.exports = {
    verifyDealerToken,
    verifyBuyerToken
}