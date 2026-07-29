import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import categoryRoutes from "./routes/category.route.js";
import foodRoutes from "./routes/food.route.js";
import cartRoutes from "./routes/cart.route.js";
import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import authRoutes from "./routes/auth.route.js";
import botChatRoutes from "./routes/botChat.route.js";
import statisticRoutes from "./routes/statistic.route.js";
import { checkOrigin } from "./middlewares/session.middleware.js";
import { errorHandler } from "./errors/errorHandler.js";
import promotionRoutes from "./routes/promotion.route.js";
import variantRoutes from "./routes/variant.route.js";
import guestRoutes from "./routes/guest.route.js";
import { requestLogger } from "./middlewares/request.middleware.js";
import logger from "./config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "./constants/logEvents.js";
import pool, { checkDBConnection } from "./config/db.js";

const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGINS.split(","),
    credentials: true, // cho gửi cookie / session
    exposedHeaders: ["X-Guest-Token", "X-Request-ID"], // Cho phép frontend đọc header này
  }),
);

app.use(requestLogger);

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(checkOrigin);

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 }, // 5p
    httpOnly: true,
    sameSite: "lax",
  }),
);

app.use("/api/guest", guestRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/statistic", statisticRoutes);
app.use("/api/botchat", botChatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

app.use("/", (req, res) => {
  res.send("Hello world, this is GIOFCHAR WEBSITE");
});

app.use(errorHandler);

let server;
let isShuttingDown = false;
const SHUTDOWN_TIMEOUT_MS = 10_000;

function closeHttpServer() {
  return new Promise((resolve, reject) => {
    if (!server?.listening) {
      return resolve();
    }

    server.close((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });
}

async function shutdown({ reason, exitCode }) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(LOG_ACTIONS.SYSTEM.APPLICATION_SHUTDOWN, {
    status: LOG_STATUSES.STARTED,
    reason,
    exitCode,
  });

  const forceShutdownTimer = setTimeout(() => {
    logger.error(LOG_ACTIONS.SYSTEM.APPLICATION_SHUTDOWN, {
      status: LOG_STATUSES.FAILED,
      reason: "SHUTDOWN_TIMEOUT",
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  try {
    await closeHttpServer();
    await pool.end();

    logger.info(LOG_ACTIONS.SYSTEM.APPLICATION_SHUTDOWN, {
      status: LOG_STATUSES.COMPLETED,
      reason,
      exitCode,
    });
  } catch (error) {
    logger.error(LOG_ACTIONS.SYSTEM.APPLICATION_SHUTDOWN, {
      status: LOG_STATUSES.FAILED,
      reason: error.code || "SHUTDOWN_FAILED",
      message: error.message,
    });
    exitCode = 1;
  } finally {
    clearTimeout(forceShutdownTimer);
    process.exitCode = exitCode;
  }
}

function normalizeError(reason) {
  if (reason instanceof Error) return reason;

  return new Error(
    typeof reason === "string" ? reason : "Unknown rejected promise",
  );
}

function handleFatalError(type, reason) {
  if (isShuttingDown) return;

  const error = normalizeError(reason);

  logger.error(LOG_ACTIONS.SYSTEM.PROCESS_ERROR, {
    status: LOG_STATUSES.FAILED,
    type,
    reason: error.code || "UNEXPECTED_ERROR",
    message: error.message,
    stack: error.stack,
  });

  void shutdown({
    reason: type,
    exitCode: 1,
  });
}

function handleStartupError(error) {
  logger.error(LOG_ACTIONS.SYSTEM.APPLICATION_STARTUP, {
    status: LOG_STATUSES.FAILED,
    phase: "http_listen",
    reason: error.code || "STARTUP_FAILED",
    message: error.message,
  });

  void shutdown({
    reason: "startup_error",
    exitCode: 1,
  });
}

async function startApplication() {
  try {
    await checkDBConnection();

    server = app.listen(port, () => {
      logger.info(LOG_ACTIONS.SYSTEM.APPLICATION_STARTUP, {
        status: LOG_STATUSES.SUCCEEDED,
        port,
        environment: process.env.NODE_ENV,
      });
    });
    server.on("error", handleStartupError);
  } catch (error) {
    logger.error(LOG_ACTIONS.SYSTEM.APPLICATION_STARTUP, {
      status: LOG_STATUSES.FAILED,
      phase: "database_connection",
      databaseType: "mysql",
      reason: error.code || "CONNECTION_FAILED",
      message: error.message,
    });

    await pool.end();
    process.exitCode = 1; // fail fast
  }
}

process.on("SIGTERM", () => {
  void shutdown({
    reason: "SIGTERM",
    exitCode: 0,
  });
});

process.on("SIGINT", () => {
  void shutdown({
    reason: "SIGINT",
    exitCode: 0,
  });
});

process.on("uncaughtException", (error) => {
  handleFatalError("uncaught_exception", error);
});

process.on("unhandledRejection", (reason) => {
  handleFatalError("unhandled_rejection", reason);
});

void startApplication();
