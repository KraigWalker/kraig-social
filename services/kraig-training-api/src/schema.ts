import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestampWithTz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
  }),
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestampWithTz("expiresAt").notNull(),
    token: text("token").notNull(),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestampWithTz("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestampWithTz("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerAccountIdx: uniqueIndex("account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampWithTz("expiresAt").notNull(),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);

export const stravaAccount = pgTable(
  "stravaAccount",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    athleteId: text("athleteId").notNull(),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken").notNull(),
    expiresAt: timestampWithTz("expiresAt").notNull(),
    scope: text("scope"),
    tokenType: text("tokenType"),
    lastSyncAt: timestampWithTz("lastSyncAt"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: uniqueIndex("strava_account_user_id_idx").on(table.userId),
    athleteIdx: uniqueIndex("strava_account_athlete_id_idx").on(
      table.athleteId,
    ),
  }),
);

export const schema = {
  user,
  session,
  account,
  verification,
  stravaAccount,
};
