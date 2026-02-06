import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

type SessionUser = {
  id: string;
  role?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

type AuthSession = {
  user: SessionUser;
  session?: unknown;
};

function toSessionUserFromJwtPayload(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const claims = payload as Record<string, unknown>;

  // Better Auth JWT payloads use "sub" as the canonical subject claim.
  // The CMS authorization layer expects "user.id", so we normalize here.
  const idClaim =
    typeof claims.id === "string" && claims.id.trim().length > 0
      ? claims.id
      : typeof claims.sub === "string" && claims.sub.trim().length > 0
        ? claims.sub
        : null;

  if (!idClaim) {
    return null;
  }

  const user: SessionUser = {
    ...claims,
    id: idClaim,
  };

  if (typeof claims.role === "string") {
    user.role = claims.role;
  }
  if (typeof claims.email === "string") {
    user.email = claims.email;
  }
  if (typeof claims.name === "string") {
    user.name = claims.name;
  }

  return user;
}

export async function getAuthSession(
  req: FastifyRequest,
): Promise<AuthSession | null> {
  const headers = fromNodeHeaders(req.headers);
  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    `http://${req.headers.host ?? "localhost"}`;

  const request = new Request(new URL(req.url, baseUrl), {
    method: req.method,
    headers,
  });

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      try {
        const result = await auth.api.verifyJWT({
          body: { token },
          headers,
        });
        const user = toSessionUserFromJwtPayload(result?.payload);
        if (user) {
          return { user };
        }
      } catch {
        // If bearer verification fails, continue and attempt cookie session lookup.
      }
    }
  }

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

export async function requireCmsAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const session = await getAuthSession(req);
  const role = session?.user?.role;

  if (!session?.user?.id) {
    return reply.unauthorized("Authentication required");
  }

  if (role !== "admin" && role !== "editor") {
    return reply.forbidden("Admin access required");
  }

  return session;
}
