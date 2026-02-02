import aiService from "../services/ai.service.js";

export const validateInputMessage = (req, res, next) => {
  if (!req.body.message)
    return res.status(400).json({ message: "Missing message" });

  const { message } = req.body;

  if (!req.session.chat) {
    req.session.chat = {
      intent: null,
      history: [],
      agent: {
        done: false,
        ask: null,
        slots: null,
        reason: null,
      },
    };
  }

  req.session.chat.history.push({
    role: "user",
    content: message,
  });

  next();
};

export const detectUserMessage = async (req, res, next) => {
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

export const handleIntent_goi_y_mon = async (req, res, next) => {
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

  if (agentRes.ask) {
    chat.history.push({
      role: "assistant",
      content: agentRes.ask,
    });
  }

  chat.agent = {
    done: agentRes.done,
    ask: agentRes.ask,
    slots: agentRes.slots, // preference: null, budget_vnd: null, quantity_kg: null
    reason: agentRes.reason,
  };

  next();
};
