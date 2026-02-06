CREATE TYPE "public"."asset_kind" AS ENUM('rendered', 'encrypted', 'image', 'attachment');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'scheduled', 'published', 'archived', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."post_version_status" AS ENUM('draft', 'scheduled', 'published', 'archived', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor', 'author');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"storageKey" text NOT NULL,
	"contentType" text,
	"sizeBytes" integer,
	"sha256" text,
	"etag" text,
	"cacheTag" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"alg" text,
	"crv" text
);
--> statement-breakpoint
CREATE TABLE "post_slug_history" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"oldSlug" text NOT NULL,
	"newSlug" text NOT NULL,
	"changedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"version" integer NOT NULL,
	"status" "post_version_status" DEFAULT 'draft' NOT NULL,
	"sourceRef" text,
	"contentHash" text,
	"renderedAssetId" text,
	"encryptedPayloadAssetId" text,
	"changelog" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"publishedAt" timestamp with time zone,
	"previousVersionId" text
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"edition" integer DEFAULT 1 NOT NULL,
	"currentVersionId" text,
	"authorId" text,
	"category" text,
	"tags" text[],
	"language" text,
	"canonicalUrl" text,
	"heroImageAssetId" text,
	"ogImageAssetId" text,
	"publishAt" timestamp with time zone,
	"embargoUntil" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelledAt" timestamp with time zone,
	"archivedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_slug_history" ADD CONSTRAINT "post_slug_history_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_renderedAssetId_assets_id_fk" FOREIGN KEY ("renderedAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_encryptedPayloadAssetId_assets_id_fk" FOREIGN KEY ("encryptedPayloadAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_heroImageAssetId_assets_id_fk" FOREIGN KEY ("heroImageAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_ogImageAssetId_assets_id_fk" FOREIGN KEY ("ogImageAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_storage_key_idx" ON "assets" USING btree ("storageKey");--> statement-breakpoint
CREATE INDEX "jwks_created_at_idx" ON "jwks" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_slug_history_post_id_idx" ON "post_slug_history" USING btree ("postId");--> statement-breakpoint
CREATE UNIQUE INDEX "post_versions_post_id_version_idx" ON "post_versions" USING btree ("postId","version");--> statement-breakpoint
CREATE INDEX "post_versions_post_id_idx" ON "post_versions" USING btree ("postId");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");