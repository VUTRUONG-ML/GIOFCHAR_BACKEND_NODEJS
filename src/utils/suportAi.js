export const formatAiRes = (aiText) => {
  let cleanText = aiText.trim();

  // Nếu có ```json ... ``` thì loại bỏ
  cleanText = cleanText.replace(/```json\s*([\s\S]*?)```/, "$1");

  // Parse JSON
  const result = JSON.parse(cleanText);
  return result;
};

export const isSlotComplete = (slots) => {
  const REQUIRED_SLOTS = ["preference", "budget_vnd", "quantity_kg"];

  return REQUIRED_SLOTS.every(
    (key) => slots[key] !== null && slots[key] !== undefined
  );
};
