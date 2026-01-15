import dotenv from "dotenv";
dotenv.config();

export const vnpayConfig = {
  tmnCode: process.env.VNP_TMN_CODE,
  secretKey: process.env.VNP_HASH_SECRET,
  vnpUrl: process.env.VNP_PAY_URL,
  returnUrl: process.env.VNP_RETURN_URL,
};
