import { geminiModel } from "../config/gemini.js";
import { formatAiRes } from "../utils/suportAi.js";

export const detectIntent = async (message) => {
  try {
    const prompt = `
        Hãy phân loại câu hỏi của người dùng vào một trong các intent sau: 
        - goi_y_mon
        - chao_hoi
        - huong_dan_dat_hang
        - order
        
        Trả về JSON đúng format:
        {
        "intent": "...",
        "confidence": 0.0-1.0,
        "keywords": ["..."]
        }

        Nếu không xác định được:
        - intent = "unknown"
        - keywords = []
        
        Chú ý: chỉ trả raw JSON, KHÔNG markdown, KHÔNG giải thích.
        Tin nhắn User: "${message}"
    `;

    const aiRes = await geminiModel.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return formatAiRes(aiRes.text);
  } catch (error) {
    console.log(">>>> SERVICE ERROR detectIntent:", error.message);
    throw error;
  }
};

export const slotFillingAgent = async (CHAT_HISTORY) => {
  try {
    const prompt = `
    You are a conversation agent for a Vietnamese ecommerce system selling giò chả.
    Your ONLY task is to manage a multi-turn conversation and collect enough information
    from the user to recommend giò chả products.

    IMPORTANT LANGUAGE RULE:
    - All questions and any text intended for the user MUST be written in natural Vietnamese.
    - Do NOT use English when talking to the user.

    Required slots:
    - preference: loại giò chả người dùng muốn (vd: giò lụa, chả cốm, chả quế...)
    - budget_vnd: ngân sách người dùng (số tiền VND)
    - quantity_kg: số lượng cần mua (kg)

    Rules:
    1. Always return a Only raw JSON will be returned, NO markdown, NO explanations.
    2. Never answer the user outside the JSON.
    3. If a slot is not mentioned, keep it as null.
    4. If the user provides a value again, overwrite the previous value.
    5. Convert prices like "200k", "300 nghìn" to integer VND.
    6. quantity_kg must be a number (vd: 0.5, 1, 2).
    7. Ask ONLY ONE question at a time.
    8. Be polite, concise, and friendly.
    9. If the user message does not provide any new slot value, ask again in a different way.
    10. If after 3 attempts no new slot is provided, stop asking and set done = true with reason = "insufficient_information".

    Conversation so far:
    {${JSON.stringify(CHAT_HISTORY)}}


    Return JSON in this exact format:
    {
      "done": boolean,
      "slots": {
        "preference": string or null,
        "budget_vnd": number or null,
        "quantity_kg": number or null
      },
      "ask": string or null,
      "reason": string or null
    }
  `;

    const aiRes = await geminiModel.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return formatAiRes(aiRes.text);
  } catch (error) {
    console.log(">>>>> SERVICE ERROR:", error.message);
    throw error;
  }
};

export const answer = async ({ intent, data }) => {
  try {
    const prompt = `
        Dựa trên intent: ${intent}
        Dữ liệu thật: ${JSON.stringify(data)} 
        Viết câu trả lời thân thiện, tự nhiên cho người dùng.
    `;
    const aiRes = await geminiModel.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return aiRes.text;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR ai answer:", error.message);
    throw error;
  }
};
