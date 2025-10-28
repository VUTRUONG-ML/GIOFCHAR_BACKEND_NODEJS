const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(">>>>> AUTH MIDDLE WARE ERROR", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = {
  verifyToken,
};
