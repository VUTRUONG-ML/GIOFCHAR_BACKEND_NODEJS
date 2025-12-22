const guidesOrder = require("../data/guides");
const aiService = require("../services/ai.service");
const { isSlotComplete } = require("../utils/suportAi");

const validateInputMessage = (req, res, next) => {
  if (!req.body.message)
    return res.status(400).json({ message: "Missing message" });

  const { message } = req.body;

  if (!req.session.chat) {
    req.session.chat = {
      intent: null,
      slots: null,
      history: [],
    };
  }

  req.session.chat.history.push({
    role: "user",
    content: message,
  });

  next();
};

const detectUserMessage = async (req, res, next) => {
  const { message } = req.body;
  const { chat } = req.session;

  // Nếu vẫn còn trong phiên chat trước đó chưa kết thúc
  if (chat.intent) return next();

  try {
    const intentResult = await aiService.detectIntent(message);
    chat.intent = intentResult.intent;
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }

  next();
};

const handleIntentRouting = async (req, res, next) => {
  const { chat } = req.session;
  const { intent } = chat;
  const CHAT_HISTORY = req.session.chat.history;

  if (intent !== "goi_y_mon") return next();

  let agentRes = null;

  try {
    agentRes = await aiService.slotFillingAgent(CHAT_HISTORY);
    console.log(">>> ai res", agentRes);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }

  chat.history.push({
    role: "assistant",
    content: agentRes.ask,
  });

  console.log(">>Chats:", CHAT_HISTORY);

  // Nếu chưa hỏi xong
  if (!agentRes.done) {
    return res.json({ intent, reply: agentRes.ask });
  }

  if (!isSlotComplete(agentRes.slots)) {
    return res.json({
      intent,
      reply:
        "Mình vẫn cần thêm chút thông tin (loại giò, ngân sách, số kg) để tư vấn chính xác hơn nhé",
    });
  }

  req.session.chat.slots = agentRes.slots; // preference: null, budget_vnd: null, quantity_kg: null
  next();
};

module.exports = {
  validateInputMessage,
  detectUserMessage,
  handleIntentRouting,
};
