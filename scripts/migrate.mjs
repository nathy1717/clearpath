import { neon } from "@neondatabase/serverless";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const sql = neon(process.env.DATABASE_URL);
const migrationDirectory = path.join(projectRoot, "db/migrations");
const migrationFiles = (await readdir(migrationDirectory))
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

for (const filename of migrationFiles) {
  const migration = await readFile(path.join(migrationDirectory, filename), "utf8");
  for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
  console.log(`Applied ${filename}.`);
}
