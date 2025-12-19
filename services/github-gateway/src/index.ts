import Fastify from "fastify";
import crypto from "node:crypto";

const app = Fastify({ logger: true });

const {
  PORT = "9090",

  // GitHub
  GITHUB_WEBHOOK_SECRET = "", // required
  GITHUB_EVENT = "push", // optional filter; leave "push" as default

  // Dokploy
  DOKPLOY_ORIGIN = "http://127.0.0.1:3000", // or http://dokploy:3000 if reachable on network
  DOKPLOY_API_KEY = "", // required
  DOKPLOY_COMPOSE_ID = "", // required (the compose "id" in Dokploy)
} = process.env;

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function verifyGitHubSignature(
  rawBody: Buffer,
  signatureHeader: unknown,
): boolean {
  if (!GITHUB_WEBHOOK_SECRET) return false;
  if (typeof signatureHeader !== "string") return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqual(signatureHeader, `sha256=${expected}`);
}

// Parse ALL bodies as raw Buffer so we can verify signature reliably
app.addContentTypeParser("*", { parseAs: "buffer" }, (_req, body, done) =>
  done(null, body),
);

app.get("/health", async (_req, reply) => {
  return reply.code(200).type("text/plain").send("ok");
});

app.post("/hooks/github/dokploy", async (req, reply) => {
  const event = req.headers["x-github-event"];
  if (GITHUB_EVENT && event !== GITHUB_EVENT) {
    req.log.info({ event }, "Ignoring non-matching GitHub event");
    return reply.code(202).send({ ok: true, ignored: true });
  }

  const signature = req.headers["x-hub-signature-256"];
  const rawBody = req.body as Buffer;

  if (!verifyGitHubSignature(rawBody, signature)) {
    req.log.warn("Invalid GitHub signature");
    return reply.code(401).send({ message: "Invalid signature" });
  }

  if (!DOKPLOY_API_KEY || !DOKPLOY_COMPOSE_ID) {
    req.log.error("Missing Dokploy configuration");
    return reply.code(500).send({ message: "Relay not configured" });
  }

  const res = await fetch(
    `${DOKPLOY_ORIGIN.replace(/\/$/, "")}/api/compose.deploy`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": DOKPLOY_API_KEY,
      },
      body: JSON.stringify({ composeId: DOKPLOY_COMPOSE_ID }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    req.log.error({ status: res.status, text }, "Dokploy deploy failed");
    return reply
      .code(502)
      .send({ message: "Dokploy deploy failed", status: res.status });
  }

  req.log.info("Deploy triggered");
  return reply.code(202).send({ ok: true });
});

await app.listen({ host: "0.0.0.0", port: Number(PORT) });
