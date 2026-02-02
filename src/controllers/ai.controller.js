import { collectedFail } from "../constants/resonAgent.js";
import { guidesOrder, greeting } from "../data/guides.js";
import aiService from "../services/ai.service.js";
import foodService from "../services/food.service.js";
import { isSlotComplete } from "../utils/suportAi.js";

const resetChatAndReply = (req, res, response) => {
  req.session.chat = null;
  return res.json(response);
};

const textResponse = (intent, text) => ({
  intent,
  type: "TEXT",
  payload: { text },
});

export const handleIntentData = async (req, res) => {
  const chat = req.session.chat;
  const { intent, agent } = chat;

  try {
    switch (intent) {
      case "goi_y_mon": {
        // Chưa thu thập xong slot
        if (!agent.done) {
          return res.json(textResponse(intent, agent.ask));
        }

        // Thu thập lỗi hoặc thiếu slot
        if (agent.reason === collectedFail || !isSlotComplete(agent.slots)) {
          return res.json(
            textResponse(
              intent,
              "Mình vẫn cần thêm chút thông tin (loại giò, ngân sách, số kg) để tư vấn chính xác hơn nhé",
            ),
          );
        }

        // Đã đủ dữ liệu
        const { preference, budget_vnd, quantity_kg } = agent.slots;
        const products = await foodService.filterFood(
          preference,
          budget_vnd,
          quantity_kg,
        );

        if (!products) {
          return resetChatAndReply(
            req,
            res,
            textResponse(
              intent,
              "Hiện tại tôi không thể tìm kiếm món phù hợp dựa trên thông tin bạn đưa cho tôi. Có thể món này đã hết hoặc lý do khác, bạn thông cảm cho shop nhé!",
            ),
          );
        }

        return resetChatAndReply(req, res, {
          intent,
          type: "PRODUCT_RECOMMENDATION",
          payload: {
            title: "Danh sách món gợi ý:",
            products,
          },
        });
      }

      case "huong_dan_dat_hang": {
        const reply = await aiService.answer({
          intent,
          data: guidesOrder,
        });
        return resetChatAndReply(req, res, textResponse(intent, reply));
      }

      default: {
        const reply = await aiService.answer({
          intent,
          data: greeting,
        });
        return resetChatAndReply(req, res, textResponse(intent, reply));
      }
    }
  } catch (error) {
    console.error(">>>>> CONTROLLER handleIntentData ERROR:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
