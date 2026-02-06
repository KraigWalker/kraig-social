import Fastify, { type HTTPMethods } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { pool } from "./db.js";
import { authHandler } from "./auth.js";
import { registerPostRoutes } from "./posts.js";

const isProduction = process.env.NODE_ENV === "production";

function parseAllowedOrigins(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const configuredAllowedOrigins = parseAllowedOrigins(
  process.env.CMS_ALLOWED_ORIGINS,
);

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const allowedOrigins =
  configuredAllowedOrigins.length > 0
    ? configuredAllowedOrigins
    : isProduction
      ? []
      : defaultDevOrigins;

if (isProduction && allowedOrigins.length === 0) {
  throw new Error(
    "CMS_ALLOWED_ORIGINS must be set in production (comma-separated origins).",
  );
}

const server = Fastify({
  logger:
    isProduction
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: { translateTime: "SYS:standard" },
          },
        },
});

await server.register(helmet);
await server.register(cors, {
  credentials: true,
  // Reject browser origins not present in the allowlist. Non-browser callers
  // (no Origin header) are still allowed for server-to-server requests.
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  },
});
await server.register(sensible);

server.get("/health", async () => ({ ok: true }));
server.get("/health/db", async () => {
  await pool.query("select 1");
  return { ok: true };
});

server.get("/admin/bootstrap", async (_req, reply) => {
  try {
    const result = await pool.query('select count(*)::int as count from "user"');
    const userCount = Number(result.rows[0]?.count ?? 0);

    return {
      hasAdminUser: userCount > 0,
      userCount,
    };
  } catch (error) {
    const err = error as { code?: string };
    const missingTable = err?.code === "42P01";
    const message = missingTable
      ? "Database schema missing. Run CMS API migrations."
      : "CMS API database query failed.";

    server.log.error({ err: error }, "Admin bootstrap query failed");
    reply.code(503);
    return {
      hasAdminUser: false,
      userCount: 0,
      error: message,
    };
  }
});

const authMethods: HTTPMethods[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

server.route({
  method: authMethods,
  url: "/api/auth",
  handler: async (req, reply) => {
    await authHandler(req.raw, reply.raw);
    reply.hijack();
  },
});

server.route({
  method: authMethods,
  url: "/api/auth/*",
  handler: async (req, reply) => {
    await authHandler(req.raw, reply.raw);
    reply.hijack();
  },
});

await registerPostRoutes(server);

const port = Number(process.env.PORT ?? 3335);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await server.listen({ port, host });
  server.log.info(`CMS API listening on ${host}:${port}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
