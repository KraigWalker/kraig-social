import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { closeDb, pool } from "./db.js";
import { authHandler } from "./auth.js";

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

const authMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;

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

// Placeholder: Strava webhook verification + events
server.get("/integrations/strava/webhook", async (req, reply) => {
  // Strava expects a hub.challenge echo during subscription creation.
  // We'll wire this properly once you create the Strava app + subscription.
  const query = req.query as Partial<{
    "hub.mode": string;
    "hub.challenge": string;
    "hub.verify_token": string;
  }>;

  if (query["hub.challenge"]) {
    return { "hub.challenge": query["hub.challenge"] };
  }

  return reply.badRequest("Missing hub.challenge");
});

server.post("/integrations/strava/webhook", async (req) => {
  // Strava posts lightweight events; you’ll enqueue a job to fetch the activity.
  server.log.info({ body: req.body }, "Strava webhook event received");
  return { ok: true };
});

// Placeholder: OAuth callback endpoints
server.get("/integrations/strava/oauth/callback", async (req) => {
  // exchange code -> token; store refresh token; kick off initial sync, etc.
  server.log.info({ query: req.query }, "Strava OAuth callback");
  return { ok: true };
});

server.addHook("onClose", async () => {
  await closeDb();
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

await server.listen({ port, host });
server.log.info(`kraig-training-api listening on http://${host}:${port}`);
