import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";
import logger from "./logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // giữ tối đa 10 connection rảnh
  idleTimeout: 60000, // 60s thì đóng connection rảnh
  queueLimit: 0, // 0 = không giới hạn số request chờ
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  dateStrings: true,
});

async function checkDBConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info(LOG_ACTIONS.SYSTEM.DATABASE_CONNECTION, {
      status: LOG_STATUSES.SUCCEEDED,
      databaseType: "mysql",
    });
    connection.release();
  } catch (err) {
    logger.error(LOG_ACTIONS.SYSTEM.DATABASE_CONNECTION, {
      status: LOG_STATUSES.FAILED,
      databaseType: "mysql",
      reason: err.code || "CONNECTION_FAILED",
    });
    process.exit(1); // fail fast
  }
}

checkDBConnection();

export default pool;
