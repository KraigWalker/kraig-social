import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema.js";

const { Pool } = pg;

const databaseUrlRaw = process.env.DATABASE_URL?.trim();
if (!databaseUrlRaw) {
  throw new Error("DATABASE_URL is required");
}

let databaseUrl = databaseUrlRaw.replace(/^['"]|['"]$/g, "");
if (databaseUrl.startsWith("DATABASE_URL=")) {
  databaseUrl = databaseUrl.slice("DATABASE_URL=".length);
}

function assertValidUrl(candidate: string) {
  // Validate early so health checks fail with a clear error if the URL is invalid.
  new URL(candidate);
}

try {
  assertValidUrl(databaseUrl);
} catch (error) {
  if (/postgres%3A|postgresql%3A/i.test(databaseUrl)) {
    try {
      const decoded = decodeURIComponent(databaseUrl);
      assertValidUrl(decoded);
      databaseUrl = decoded;
    } catch (decodeError) {
      throw new Error(
        "DATABASE_URL must be a valid postgres URL (remove quotes, avoid encoding the whole URL, URL-encode only the password)",
      );
    }
  } else {
    throw new Error(
      "DATABASE_URL must be a valid postgres URL (remove quotes, avoid encoding the whole URL, URL-encode only the password)",
    );
  }
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
