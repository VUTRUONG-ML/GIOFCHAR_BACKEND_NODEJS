import { geminiModel } from "../config/gemini";

export const detectIntent = async (message) => {
  try {
    const prompt = `
        Hãy phân loại câu hỏi của người dùng vào một trong các intent sau: 
        - tim_san_pham
        - xem_gia
        - san_pham_giam_gia
        - goi_y_mon
        - xem_gio_hang
        - huong_dan_dat_hang
        - order
        
        Trả về JSON đúng format:
        {
        "intent": "...",
        "keywords": [...]
        }
        Nếu không nhận dạng được thì intent = "unknown".
        
        User: "${message}"
    `;

    const aiRes = await geminiModel.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return JSON.parse(aiRes.text);
  } catch (error) {
    console.log(">>>> SERVICE ERROR detectIntent:", error.message);
    throw error;
    x``;
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
