import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import fileURLToPath from "url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds() {
  console.log("🌱 Starting database seeding...");

  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "GIOFCHAR";
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      multipleStatements: true,
    });
    console.log(`✅ Connected to database '${database}' on ${host}:${port}`);
  } catch (error) {
    console.error("❌ Failed to connect to MySQL database:", error.message);
    process.exit(1);
  }

  try {
    const seedsDir = path.join(__dirname, "..", "seeds");
    if (!fs.existsSync(seedsDir)) {
      console.log("ℹ️ No seeds directory found.");
      await connection.end();
      return;
    }

    const files = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("ℹ️ No seed files found in ./seeds");
      await connection.end();
      return;
    }

    for (const file of files) {
      console.log(`  - 🌿 Running seed file '${file}'...`);
      const filePath = path.join(seedsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      if (sqlContent.trim().length > 0) {
        await connection.query(sqlContent);
      }
      console.log(`    ✅ Successfully seeded '${file}'`);
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error executing seed script:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeeds();
