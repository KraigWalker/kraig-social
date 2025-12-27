import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema.js";

const { Pool } = pg;

const databaseUrlRaw = process.env.DATABASE_URL?.trim();
if (!databaseUrlRaw) {
  throw new Error("DATABASE_URL is required");
}

const databaseUrl = databaseUrlRaw.replace(/^['"]|['"]$/g, "");
try {
  // Validate early so health checks fail with a clear error if the URL is invalid.
  new URL(databaseUrl);
} catch (error) {
  throw new Error(
    "DATABASE_URL must be a valid postgres URL (remove quotes, URL-encode special characters)",
  );
}

const poolSizeRaw = Number(process.env.DATABASE_POOL_SIZE ?? 5);
const poolSize = Number.isFinite(poolSizeRaw) ? poolSizeRaw : 5;

export const pool = new Pool({
  connectionString: databaseUrl,
  max: poolSize,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { schema });

export async function closeDb() {
  await pool.end();
}
