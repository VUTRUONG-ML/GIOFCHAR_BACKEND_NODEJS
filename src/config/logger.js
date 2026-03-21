import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";
import { asyncLocalStorage } from "../utils/asyncLocalStorage.js";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const addRequestId = format((info) => {
  const store = asyncLocalStorage.getStore();

  // Nếu đang trong một request, store sẽ tồn tại
  if (store?.requestId) {
    info.requestId = store.requestId;
  }
  return info;
});

const logger = createLogger({
  level: isProd ? "info" : "debug",

  format: format.combine(
    addRequestId(),
    format.timestamp(),
    format.errors({ stack: true }), // log stack trace
    isProd ? format.json() : format.combine(format.colorize(), format.simple()),
  ),

  defaultMeta: { service: "backend-service" },

  transports: [
    new transports.Console(),

    // chỉ ghi file khi dev
    ...(!isProd
      ? [
          new transports.File({ filename: "logs/error.log", level: "error" }),
          new transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

export default logger;
