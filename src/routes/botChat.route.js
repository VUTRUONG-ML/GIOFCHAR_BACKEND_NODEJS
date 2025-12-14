const express = require("express");
const router = express.Router();
const {
  validateInputMessage,
  detectUserMessage,
  handleIntentRouting,
} = require("../middlewares/ai.middleware");

const { handleIntentData } = require("../controllers/ai.controller");

router.post(
  "/",
  validateInputMessage,
  detectUserMessage,
  handleIntentRouting,
  handleIntentData
);

module.exports = router;
