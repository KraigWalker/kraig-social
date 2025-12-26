import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNodeHandler } from "better-auth/node";
import { db } from "./db.js";
import { schema } from "./schema.js";

const auth = betterAuth({
  appName: process.env.APP_NAME ?? "Kraig Training",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});

export const authHandler = toNodeHandler(auth);
export { auth };
