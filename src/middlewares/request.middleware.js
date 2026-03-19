import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";

export const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  const start = Date.now();

  logger.info("Incoming request", {
    requestId,
    method: req.method,
    url: req.originalUrl,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("Request completed", {
      requestId,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
};
