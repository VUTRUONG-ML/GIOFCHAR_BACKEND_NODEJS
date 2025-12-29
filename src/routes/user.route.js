const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");

router.delete(
  "/:userId",
  requireAuth,
  checkAdmin,
  userController.deleteUserById
);
router.put(
  "/:userId",
  requireAuth,
  checkAdmin,
  userController.updateUserByAdmin
);
router.put("/updateMyInfo", requireAuth, userController.updateUserById);
router.get(
  "/stats/overviewCount",
  requireAuth,
  checkAdmin,
  userController.getOverviewCountUser
);
router.post("/", requireAuth, checkAdmin, userController.createUser);
router.get("/:userId", userController.getUserById);
router.get("/", requireAuth, checkAdmin, userController.getAllUsers);
module.exports = router;
