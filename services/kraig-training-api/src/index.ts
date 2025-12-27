import Fastify, { type HTTPMethods } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { closeDb, pool } from "./db.js";
import { authHandler } from "./auth.js";
import { getAuthSession } from "./auth-session.js";
import {
  consumeStravaState,
  createStravaAuthUrl,
  deleteStravaAccountForUser,
  exchangeStravaToken,
  getStravaAccountForUser,
  getStravaWebhookVerifyToken,
  upsertStravaAccountForUser,
} from "./strava.js";

const server = Fastify({
  logger:
    process.env.NODE_ENV === "production"
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
  origin: true, // tighten later (kraig.social + local dev)
  credentials: true,
});
await server.register(sensible);

server.get("/health", async () => ({ ok: true }));
server.get("/health/db", async () => {
  await pool.query("select 1");
  return { ok: true };
});

server.get("/admin/bootstrap", async () => {
  const result = await pool.query(
    'select count(*)::int as count from "user"',
  );
  const userCount = Number(result.rows[0]?.count ?? 0);

  // Until role support is wired, treat any existing user as the admin.
  return {
    hasAdminUser: userCount > 0,
    userCount,
  };
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

server.get("/integrations/strava/oauth/start", async (req, reply) => {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) {
    return reply.unauthorized("Authentication required");
  }

  const query = req.query as Partial<{ scope: string }>;

  try {
    const url = await createStravaAuthUrl(userId, query.scope);
    return { url };
  } catch (error) {
    server.log.error({ err: error }, "Strava OAuth start failed");
    return reply.internalServerError("Strava OAuth start failed");
  }
});

server.get("/integrations/strava/status", async (req, reply) => {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) {
    return reply.unauthorized("Authentication required");
  }

  const account = await getStravaAccountForUser(userId);
  if (!account) {
    return { connected: false };
  }

  return {
    connected: true,
    athleteId: account.athleteId,
    expiresAt: account.expiresAt.toISOString(),
    scope: account.scope,
    lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
  };
});

server.delete("/integrations/strava/connection", async (req, reply) => {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) {
    return reply.unauthorized("Authentication required");
  }

  await deleteStravaAccountForUser(userId);
  return { ok: true };
});

// Strava webhook verification + events
server.get("/integrations/strava/webhook", async (req, reply) => {
  // Strava expects a hub.challenge echo during subscription creation.
  const query = req.query as Partial<{
    "hub.mode": string;
    "hub.challenge": string;
    "hub.verify_token": string;
  }>;

  if (!query["hub.challenge"]) {
    return reply.badRequest("Missing hub.challenge");
  }

  const verifyToken = getStravaWebhookVerifyToken();
  if (!verifyToken) {
    return reply.internalServerError("Missing STRAVA_WEBHOOK_VERIFY_TOKEN");
  }

  if (query["hub.verify_token"] !== verifyToken) {
    return reply.forbidden("Invalid verify token");
  }

  return { "hub.challenge": query["hub.challenge"] };
});

server.post("/integrations/strava/webhook", async (req) => {
  // Strava posts lightweight events; you’ll enqueue a job to fetch the activity.
  server.log.info({ body: req.body }, "Strava webhook event received");
  return { ok: true };
});

server.get("/integrations/strava/oauth/callback", async (req, reply) => {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) {
    return reply.unauthorized("Authentication required");
  }

  const query = req.query as Partial<{
    code: string;
    state: string;
    scope: string;
    error: string;
  }>;

  if (query.error) {
    return reply.badRequest(`Strava authorization failed: ${query.error}`);
  }

  if (!query.code || !query.state) {
    return reply.badRequest("Missing Strava code or state");
  }

  const stateOk = await consumeStravaState(userId, query.state);
  if (!stateOk) {
    return reply.badRequest("Invalid or expired Strava state");
  }

  try {
    const tokenData = await exchangeStravaToken(query.code);
    await upsertStravaAccountForUser(userId, tokenData);
    return { ok: true };
  } catch (error) {
    server.log.error({ err: error }, "Strava OAuth callback failed");
    return reply.internalServerError("Strava OAuth callback failed");
  }
});

server.addHook("onClose", async () => {
  await closeDb();
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

await server.listen({ port, host });
server.log.info(`kraig-training-api listening on http://${host}:${port}`);
