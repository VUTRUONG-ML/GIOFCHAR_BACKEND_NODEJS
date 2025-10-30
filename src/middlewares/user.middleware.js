const checkAdmin = (req, res, next) => {
  const role = req.user.role;
  if (role === "admin") return next();
  return res.status(403).json({ message: "You do not have access" });
};

const checkSelfOrAdmin = (req, res, next) => {
  return next();
};

module.exports = {
  checkAdmin,
  checkSelfOrAdmin,
};
