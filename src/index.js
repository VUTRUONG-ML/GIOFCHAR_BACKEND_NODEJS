import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./config/env.js";
validateEnv();

import app from "./app.js";
import pool, { checkDBConnection } from "./config/db.js";
import logger from "./config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "./constants/logEvents.js";

const port = process.env.PORT || 8081;

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
    process.exitCode = 1;
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
