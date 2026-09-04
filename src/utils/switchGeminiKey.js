import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

export const keys = process.env.GEMINI_API_KEYS
  ? process.env.GEMINI_API_KEYS.split(",")
  : [];
let currentKeyIndex = 0;

function getCurrentKey() {
  return keys[currentKeyIndex];
}

// Tạo instance mới mỗi lần dùng key
export function createGeminiModel() {
  return new GoogleGenAI({ apiKey: getCurrentKey() });
}

// Nếu gặp lỗi quota → chuyển sang key khác
export function switchKey() {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return currentKeyIndex;
}
