require("dotenv").config();
const mysql = require("mysql2/promise");

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

module.exports = pool;
