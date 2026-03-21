import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";
import { asyncLocalStorage } from "../utils/asyncLocalStorage.js";

export const requestLogger = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  const start = Date.now();

  // Đưa requestId vào "kho" ALS
  asyncLocalStorage.run({ requestId, start }, () => {
    // Log khi request vừa đến (Winston sẽ tự lấy requestId từ ALS)
    logger.info("Incoming request", {
      method: req.method,
      url: req.originalUrl,
    });

    // Lắng nghe khi request kết thúc
    res.on("finish", () => {
      const duration = Date.now() - start;

      logger.info("Request completed", {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  });
};
