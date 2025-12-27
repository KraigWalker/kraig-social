import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { stravaAccount, verification } from "./schema.js";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_STATE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SCOPE = "read,activity:read_all";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  athlete: z.object({
    id: z.number(),
  }),
});

type StravaTokenResponse = z.infer<typeof tokenResponseSchema>;

type StravaConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function getStravaConfig(): StravaConfig {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REDIRECT_URI",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export async function createStravaAuthUrl(
  userId: string,
  scope?: string,
): Promise<string> {
  const { clientId, redirectUri } = getStravaConfig();
  const state = await createStravaState(userId);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: scope && scope.length > 0 ? scope : DEFAULT_SCOPE,
    state,
  });

  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeStravaToken(
  code: string,
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const text = payload ? JSON.stringify(payload) : "no response body";
    throw new Error(`Strava token exchange failed: ${response.status} ${text}`);
  }

  const parsed = tokenResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Strava token response did not match expected schema");
  }

  return parsed.data;
}

export async function upsertStravaAccountForUser(
  userId: string,
  tokenData: StravaTokenResponse,
) {
  const expiresAt = new Date(tokenData.expires_at * 1000);
  const athleteId = String(tokenData.athlete.id);

  await db
    .insert(stravaAccount)
    .values({
      id: randomUUID(),
      userId,
      athleteId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      scope: tokenData.scope ?? null,
      tokenType: tokenData.token_type ?? null,
    })
    .onConflictDoUpdate({
      target: stravaAccount.userId,
      set: {
        athleteId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        scope: tokenData.scope ?? null,
        tokenType: tokenData.token_type ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function consumeStravaState(
  userId: string,
  state: string,
): Promise<boolean> {
  const identifier = buildStravaStateIdentifier(userId);
  const [row] = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);

  if (!row) {
    return false;
  }

  const expired = row.expiresAt.getTime() <= Date.now();
  if (expired) {
    await db.delete(verification).where(eq(verification.id, row.id));
    return false;
  }

  if (row.value !== state) {
    return false;
  }

  await db.delete(verification).where(eq(verification.id, row.id));
  return true;
}

function buildStravaStateIdentifier(userId: string) {
  return `strava_state:${userId}`;
}

async function createStravaState(userId: string) {
  const identifier = buildStravaStateIdentifier(userId);
  const state = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + STRAVA_STATE_TTL_MS);

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: randomUUID(),
    identifier,
    value: state,
    expiresAt,
  });

  return state;
}

export function getStravaWebhookVerifyToken() {
  return process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
}
