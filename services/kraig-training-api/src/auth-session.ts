import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export async function getAuthSession(req: FastifyRequest) {
  const headers = fromNodeHeaders(req.headers);
  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    `http://${req.headers.host ?? "localhost"}`;
  const request = new Request(new URL(req.url, baseUrl), {
    method: req.method,
    headers,
  });

  try {
    return await auth.api.getSession({
      headers,
      request,
      returnHeaders: false,
      returnStatus: false,
    });
  } catch {
    return null;
  }
}
