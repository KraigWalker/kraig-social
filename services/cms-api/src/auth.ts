import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins/jwt";
import { toNodeHandler } from "better-auth/node";
import { db } from "./db.js";
import { schema } from "./schema.js";

const baseUrl =
  process.env.BETTER_AUTH_URL || process.env.CMS_BASE_URL || undefined;

const auth = betterAuth({
  appName: process.env.APP_NAME ?? "Kraig CMS",
  baseURL: baseUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_ISSUER ?? baseUrl,
        audience: process.env.BETTER_AUTH_AUDIENCE ?? baseUrl,
      },
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});

export const authHandler = toNodeHandler(auth);
export { auth };
