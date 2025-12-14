const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");

const authController = require("../controllers/auth.controller");

router.get("/account", requireAuth, authController.getAccount);
router.post("/login", authController.loginApi);
router.post("/register", authController.registerApi);

module.exports = router;
