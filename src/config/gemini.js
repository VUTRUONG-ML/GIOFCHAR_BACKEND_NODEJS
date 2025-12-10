import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

export const geminiModel = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});
