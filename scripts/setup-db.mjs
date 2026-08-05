import postgres from "postgres";
import { readFile } from "node:fs/promises";

const connection = process.env.supabase_POSTGRES_URL_NON_POOLING ?? process.env.supabase_POSTGRES_URL;
if (!connection) throw new Error("Supabase database connection is missing");

const sql = postgres(connection, { max: 1, ssl: "require" });
const migration = await readFile(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8");
await sql.unsafe(migration);
await sql.end();
console.log("Supabase schema ready");
