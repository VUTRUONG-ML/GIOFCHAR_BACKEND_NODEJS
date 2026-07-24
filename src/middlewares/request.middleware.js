import { 
  v4 as uuidv4,
  validate as uuidValidate,
  version as uuidVersion,
} from "uuid";
import logger from "../config/logger.js";
import { asyncLocalStorage } from "../utils/asyncLocalStorage.js";

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
