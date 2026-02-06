import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestampWithTz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const userRole = pgEnum("user_role", ["admin", "editor", "author"]);
export const postStatus = pgEnum("post_status", [
  "draft",
  "scheduled",
  "published",
  "archived",
  "cancelled",
]);
export const postVersionStatus = pgEnum("post_version_status", [
  "draft",
  "scheduled",
  "published",
  "archived",
  "cancelled",
]);
export const assetKind = pgEnum("asset_kind", [
  "rendered",
  "encrypted",
  "image",
  "attachment",
]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    role: userRole("role").notNull().default("admin"),
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

export const jwks = pgTable(
  "jwks",
  {
    id: text("id").primaryKey(),
    publicKey: text("publicKey").notNull(),
    privateKey: text("privateKey").notNull(),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    expiresAt: timestampWithTz("expiresAt"),
    alg: text("alg"),
    crv: text("crv"),
  },
  (table) => ({
    createdAtIdx: index("jwks_created_at_idx").on(table.createdAt),
  }),
);

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    kind: assetKind("kind").notNull(),
    storageKey: text("storageKey").notNull(),
    contentType: text("contentType"),
    sizeBytes: integer("sizeBytes"),
    sha256: text("sha256"),
    etag: text("etag"),
    cacheTag: text("cacheTag"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    storageKeyIdx: uniqueIndex("assets_storage_key_idx").on(table.storageKey),
  }),
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: postStatus("status").notNull().default("draft"),
    edition: integer("edition").notNull().default(1),
    currentVersionId: text("currentVersionId"),
    authorId: text("authorId").references(() => user.id, {
      onDelete: "set null",
    }),
    category: text("category"),
    tags: text("tags").array(),
    language: text("language"),
    canonicalUrl: text("canonicalUrl"),
    heroImageAssetId: text("heroImageAssetId").references(() => assets.id, {
      onDelete: "set null",
    }),
    ogImageAssetId: text("ogImageAssetId").references(() => assets.id, {
      onDelete: "set null",
    }),
    publishAt: timestampWithTz("publishAt"),
    embargoUntil: timestampWithTz("embargoUntil"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    updatedAt: timestampWithTz("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    cancelledAt: timestampWithTz("cancelledAt"),
    archivedAt: timestampWithTz("archivedAt"),
  },
  (table) => ({
    slugIdx: uniqueIndex("posts_slug_idx").on(table.slug),
    statusIdx: index("posts_status_idx").on(table.status),
  }),
);

export const postVersions = pgTable(
  "post_versions",
  {
    id: text("id").primaryKey(),
    postId: text("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: postVersionStatus("status").notNull().default("draft"),
    sourceRef: text("sourceRef"),
    contentHash: text("contentHash"),
    renderedAssetId: text("renderedAssetId").references(() => assets.id, {
      onDelete: "set null",
    }),
    encryptedPayloadAssetId: text("encryptedPayloadAssetId").references(
      () => assets.id,
      { onDelete: "set null" },
    ),
    changelog: text("changelog"),
    createdAt: timestampWithTz("createdAt").notNull().defaultNow(),
    publishedAt: timestampWithTz("publishedAt"),
    previousVersionId: text("previousVersionId"),
  },
  (table) => ({
    postVersionIdx: uniqueIndex("post_versions_post_id_version_idx").on(
      table.postId,
      table.version,
    ),
    postIdIdx: index("post_versions_post_id_idx").on(table.postId),
  }),
);

export const postSlugHistory = pgTable(
  "post_slug_history",
  {
    id: text("id").primaryKey(),
    postId: text("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    oldSlug: text("oldSlug").notNull(),
    newSlug: text("newSlug").notNull(),
    changedAt: timestampWithTz("changedAt").notNull().defaultNow(),
  },
  (table) => ({
    postIdIdx: index("post_slug_history_post_id_idx").on(table.postId),
  }),
);

export const schema = {
  user,
  session,
  account,
  verification,
  jwks,
  assets,
  posts,
  postVersions,
  postSlugHistory,
};
