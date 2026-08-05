import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";

const connection = process.env.supabase_POSTGRES_URL_NON_POOLING ?? process.env.supabase_POSTGRES_URL;
if (!connection) throw new Error("Supabase database connection is missing");

const sql = postgres(connection, { max: 1, ssl: "require" });
const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
const migrations = (await readdir(migrationsUrl)).filter((file) => file.endsWith(".sql")).sort();
for (const file of migrations) {
  const migration = await readFile(new URL(file, migrationsUrl), "utf8");
  await sql.unsafe(migration);
}
await sql.end();
console.log("Supabase schema ready");
