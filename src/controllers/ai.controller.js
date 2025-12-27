const { collectedFail } = require("../constants/resonAgent");
const { guidesOrder, greeting } = require("../data/guides");
const aiService = require("../services/ai.service");
const { filterFood } = require("../services/food.service");
const { isSlotComplete } = require("../utils/suportAi");

const handleIntentData = async (req, res, next) => {
  const chat = req.session.chat;
  const { intent } = chat;
  console.log(">>Chats:", chat.history);
  try {
    let data = null;

    switch (intent) {
      case "goi_y_mon": {
        const { agent } = req.session.chat;
        // nêu chưa done
        if (!agent.done) return res.json({ intent, reply: agent.ask });

        // done nhưng có lỗi
        if (agent.reason === collectedFail || !isSlotComplete(agent.slots))
          return res.json({
            intent,
            reply:
              "Mình vẫn cần thêm chút thông tin (loại giò, ngân sách, số kg) để tư vấn chính xác hơn nhé",
          });

        // đã done
        const { preference, budget_vnd, quantity_kg } = agent.slots;
        data = await filterFood(preference, budget_vnd, quantity_kg);
        break;
      }

      case "huong_dan_dat_hang": {
        data = guidesOrder;
        break;
      }

      default:
        data = greeting;
        break;
    }
    const reply = await aiService.answer({ intent, data });
    console.log(`>>>>> AI CONTROLLER Response for ${intent} done!`);
    req.session.chat = null;

    return res.json({ intent, reply });
  } catch (error) {
    console.log(">>>>> MIDDLEWARE handleIntentData ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  handleIntentData,
};
