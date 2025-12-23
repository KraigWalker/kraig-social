import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import crypto from "node:crypto";

const app = Fastify({ logger: true });

const {
  PORT = "9090",

  // GitHub
  GITHUB_WEBHOOK_SECRET = "", // required
  GITHUB_EVENT = "push", // optional filter; leave "push" as default

  // Dokploy
  DOKPLOY_ORIGIN = "http://127.0.0.1:3000", // or http://dokploy:3000 if reachable on network
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

// Parse bodies as raw Buffer so we can verify signature reliably.
const rawBodyParser = (
  _req: unknown,
  body: Buffer,
  done: (err: Error | null, body?: Buffer) => void,
) => done(null, body);

app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  rawBodyParser,
);
app.addContentTypeParser(
  "application/*+json",
  { parseAs: "buffer" },
  rawBodyParser,
);
app.addContentTypeParser(
  "application/x-www-form-urlencoded",
  { parseAs: "buffer" },
  rawBodyParser,
);
app.addContentTypeParser("*", { parseAs: "buffer" }, rawBodyParser);

function buildProxyHeaders(req: FastifyRequest): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (key === "host" || key === "content-length" || key === "connection") {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    } else {
      headers.set(key, value);
    }
  }

  return headers;
}

async function proxyToDokploy(
  req: FastifyRequest,
  reply: FastifyReply,
  targetPath: string,
) {
  if (!Buffer.isBuffer(req.body)) {
    req.log.warn({ type: typeof req.body }, "Expected raw Buffer body");
    return reply.code(400).send({ message: "Expected raw request body" });
  }

  const signature = req.headers["x-hub-signature-256"];
  if (GITHUB_WEBHOOK_SECRET && !verifyGitHubSignature(req.body, signature)) {
    req.log.warn("Invalid GitHub signature");
    return reply.code(401).send({ message: "Invalid signature" });
  }

  const targetUrl = `${DOKPLOY_ORIGIN.replace(/\/$/, "")}${targetPath}`;
  const headers = buildProxyHeaders(req);

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.body,
    });
  } catch (err) {
    req.log.error({ err, targetUrl }, "Dokploy proxy request failed");
    return reply.code(502).send({ message: "Dokploy request failed" });
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    req.log.error({ status: res.status, text }, "Dokploy deploy failed");
  }

  const contentType = res.headers.get("content-type");
  if (contentType) {
    reply.header("content-type", contentType);
  }

  return reply.code(res.status).send(text || undefined);
}

app.get("/health", async (_req, reply) => {
  return reply.code(200).type("text/plain").send("ok");
});

app.post("/*", async (req, reply) => {
  const event = req.headers["x-github-event"];

  if (GITHUB_EVENT && event !== GITHUB_EVENT) {
    req.log.info({ event }, "Ignoring non-matching GitHub event");
    return reply.code(202).send({ ok: true, ignored: true });
  }

  return proxyToDokploy(req, reply, req.url);
});

await app.listen({ host: "0.0.0.0", port: Number(PORT) });
