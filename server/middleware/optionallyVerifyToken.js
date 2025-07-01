const jwt = require("jsonwebtoken");

const optionallyVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // silently fail for guest
  }
  next();
};

module.exports = optionallyVerifyToken;
