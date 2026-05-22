import fs from "fs";
import path from "path";
import { pool } from "./connection";
import "../config"; // Ensure dotenv is loaded

async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, "migrations");

  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${files.length} migration(s) to run.`);

    for (const file of files) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      await pool.query(sql);
      console.log(`Completed migration: ${file}`);
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
