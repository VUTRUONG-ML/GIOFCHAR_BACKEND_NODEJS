import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";
import { asyncLocalStorage } from "../utils/asyncLocalStorage.js";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_LOG_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "authorization",
  "cookie",
  "cookies",
  "set-cookie",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "jwt",
  "secret",
  "secretkey",
  "clientsecret",
  "apikey",
  "api_key",
]);

const addRequestId = format((info) => {
  const store = asyncLocalStorage.getStore();

  // Nếu đang trong một request, store sẽ tồn tại
  if (store?.requestId) {
    info.requestId = store.requestId;
  }
  return info;
});

export const redactSensitiveData = format((info) => {
  const visited = new WeakSet();

  const redact = (value) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    for (const [key, childValue] of Object.entries(value)) {
      if (SENSITIVE_LOG_KEYS.has(key.toLowerCase())) {
        value[key] = REDACTED_VALUE;
      } else {
        redact(childValue);
      }
    }
  };

  redact(info);
  return info;
});

const logger = createLogger({
  level: isProd ? "info" : "debug",

  format: format.combine(
    addRequestId(),
    format.timestamp(),
    format.errors({ stack: true }), // log stack trace
    redactSensitiveData(),
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
