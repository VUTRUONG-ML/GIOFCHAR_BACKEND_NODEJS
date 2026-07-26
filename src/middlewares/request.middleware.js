import { 
  v4 as uuidv4,
  validate as uuidValidate,
  version as uuidVersion,
} from "uuid";
import logger from "../config/logger.js";
import { asyncLocalStorage } from "../utils/asyncLocalStorage.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const isValidRequestId = (value) => {
  return (
    typeof value === "string" &&
    value.length <= 36 &&
    uuidValidate(value) &&
    uuidVersion(value) === 4
  );
};

export const requestLogger = (req, res, next) => {
  const incomingRequestId = req.get("X-Request-ID");

  const requestId = isValidRequestId(incomingRequestId)
    ? incomingRequestId
    : uuidv4();
  const start = Date.now();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  // Đưa requestId vào "kho" ALS
  asyncLocalStorage.run({ requestId, start }, () => {
    // Log khi request vừa đến (Winston sẽ tự lấy requestId từ ALS)
    logger.info(LOG_ACTIONS.SYSTEM.HTTP_REQUEST, {
      status: LOG_STATUSES.STARTED,
      method: req.method,
      path: req.path,
    });

    // Lắng nghe khi request kết thúc
    res.on("finish", () => {
      const duration = Date.now() - start;

      logger.info(LOG_ACTIONS.SYSTEM.HTTP_REQUEST, {
        status: LOG_STATUSES.COMPLETED,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  });
};
