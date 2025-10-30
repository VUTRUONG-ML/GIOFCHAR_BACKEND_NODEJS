const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");

router.delete(
  "/:userId",
  verifyToken,
  checkAdmin,
  userController.deleteUserById
);
router.put("/:userId", verifyToken, checkAdmin, userController.updateUserById);
router.post("/", verifyToken, checkAdmin, userController.createUser);
router.get("/:userId", userController.getUserById);
router.get("/", verifyToken, checkAdmin, userController.getAllUsers);

module.exports = router;
