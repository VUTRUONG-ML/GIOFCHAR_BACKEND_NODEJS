const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");

const authController = require("../controllers/auth.controller");

router.get("/account", verifyToken, authController.getAccount);
router.post("/login", authController.loginApi);
router.post("/register", authController.registerApi);

module.exports = router;
