import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const poolSizeRaw = Number(process.env.DATABASE_POOL_SIZE ?? 5);
const poolSize = Number.isFinite(poolSizeRaw) ? poolSizeRaw : 5;

export const pool = new Pool({
  connectionString: databaseUrl,
  max: poolSize,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool);

export async function closeDb() {
  await pool.end();
}
