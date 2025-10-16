const checkAdmin = (req, res, next) => {
  next();
};

const checkSelfOrAdmin = (req, res, next) => {
  next();
  //middleware này sử dụng khi chỉ muốn cho người xem ordersByUserId là admin hoặc chính user có các order đó
  //   const { role, id } = req.user;
  //   const { userId } = req.params;
  //   if (role === "admin" || id == userId) {
  //     return next();
  //   }
  //   return res.status(403).json({ message: "Forbidden" });
};

module.exports = {
  checkAdmin,
  checkSelfOrAdmin,
};
