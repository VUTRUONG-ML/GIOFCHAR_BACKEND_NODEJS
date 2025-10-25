const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/login", authController.loginApi);
router.post("/register", authController.registerApi);

module.exports = router;
