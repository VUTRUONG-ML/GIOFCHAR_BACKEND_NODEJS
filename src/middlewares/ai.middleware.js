const aiService = require("../services/ai.service");

const validateInputMessage = (req, res, next) => {
  if (!req.body.message)
    return res.status(400).json({ message: "Missing message" });

  next();
};

const detectUserMessage = async (req, res, next) => {
  const { message } = req.body;

  req.intent = await aiService.detectIntent(message);

  next();
};
