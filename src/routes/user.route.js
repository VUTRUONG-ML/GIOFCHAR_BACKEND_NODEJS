const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.delete("/:userId", userController.deleteUserById);
router.put("/:userId", userController.updateUserById);
router.post("/", userController.createUser);
router.get("/:userId", userController.getUserById);
router.get("/", userController.getAllUsers);

module.exports = router;
