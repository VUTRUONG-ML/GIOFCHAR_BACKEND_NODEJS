const express = require("express");
const router = express.Router();
const {
  validateInputMessage,
  detectUserMessage,
  handleIntent_goi_y_mon,
} = require("../middlewares/ai.middleware");

const { handleIntentData } = require("../controllers/ai.controller");

router.post(
  "/",
  validateInputMessage,
  detectUserMessage,
  handleIntent_goi_y_mon,
  handleIntentData
);

module.exports = router;
