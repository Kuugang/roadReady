const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send("Unauthorized");
  }
  const token = authorization.split(" ")[1];
  try {
    const results = await queryDatabase(
      "SELECT * FROM blacklist WHERE token = $1",
      [token]
    );
    if (results.length > 0) {
      return res.status(401).send("Token is blacklisted");
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = payload;
    next();
  } catch (eror) {
    return res.status(401).send("Unauthorized");
  }
};

module.exports = {
    verifyToken
}