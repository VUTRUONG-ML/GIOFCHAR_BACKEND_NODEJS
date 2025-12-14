const { guidesOrder, greeting } = require("../data/guides");
const aiService = require("../services/ai.service");
const { filterFood } = require("../services/food.service");

const handleIntentData = async (req, res, next) => {
  const { intent } = req.intentResult;
  const chat = req.session.chat;

  try {
    let data = null;

    switch (intent) {
      case "goi_y_mon": {
        if (!chat.slots) {
          return res
            .status(400)
            .json({ message: "Thiếu thông tin để gợi ý món" });
        }

        const { preference, budget_vnd, quantity_kg } = chat.slots;

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

    req.session.chat = {
      intent: null,
      slots: null,
      history: [],
    };

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
