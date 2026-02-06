import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db.js";
import { posts, postVersions, postSlugHistory, user } from "./schema.js";
import { requireCmsAdmin } from "./auth-session.js";
import { buildBlogPosting } from "./schema-org.js";

const statusEnum = z.enum([
  "draft",
  "scheduled",
  "published",
  "archived",
  "cancelled",
]);

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  status: statusEnum.default("draft"),
  edition: z.number().int().min(1).default(1),
  publishAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

const updatePostSchema = createPostSchema.partial();

const createVersionSchema = z.object({
  version: z.number().int().min(1),
  status: statusEnum.default("draft"),
  sourceRef: z.string().optional(),
  changelog: z.string().optional(),
});

const UNIQUE_VIOLATION_CODE = "23505";
const POSTS_SLUG_CONSTRAINT = "posts_slug_idx";
const POST_VERSIONS_UNIQUE_CONSTRAINT = "post_versions_post_id_version_idx";

function parseOptionalDate(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isUniqueConstraintError(
  error: unknown,
  constraintName?: string,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { code?: unknown; constraint?: unknown };
  if (err.code !== UNIQUE_VIOLATION_CODE) {
    return false;
  }

  if (!constraintName) {
    return true;
  }

  return err.constraint === constraintName;
}

export async function registerPostRoutes(server: FastifyInstance) {
  server.get("/api/posts", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        edition: posts.edition,
        currentVersionId: posts.currentVersionId,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt));

    const versionIds = rows
      .map((row) => row.currentVersionId)
      .filter((value): value is string => Boolean(value));

    const versions = versionIds.length
      ? await db
          .select({
            id: postVersions.id,
            version: postVersions.version,
          })
          .from(postVersions)
          .where(inArray(postVersions.id, versionIds))
      : [];

    const versionMap = new Map(
      versions.map((version) => [version.id, version.version]),
    );

    return {
      posts: rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        edition: row.edition,
        currentVersion: row.currentVersionId
          ? versionMap.get(row.currentVersionId) ?? null
          : null,
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  });

  server.post("/api/posts", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.badRequest("Invalid post payload");
    }

    const payload = parseResult.data;
    const publishAt = parseOptionalDate(payload.publishAt);
    if (payload.publishAt && !publishAt) {
      return reply.badRequest("publishAt must be an ISO timestamp");
    }

    const postId = randomUUID();
    const tags = payload.tags?.length ? payload.tags : [];

    try {
      await db.insert(posts).values({
        id: postId,
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        status: payload.status,
        edition: payload.edition,
        publishAt,
        tags,
        category: payload.category,
        language: payload.language,
        canonicalUrl: payload.canonicalUrl,
        authorId: session.user.id,
      });
    } catch (error) {
      if (isUniqueConstraintError(error, POSTS_SLUG_CONSTRAINT)) {
        return reply.conflict("Slug already exists for another post");
      }
      server.log.error({ err: error }, "Failed to create post");
      return reply.internalServerError("Failed to create post");
    }

    return reply.code(201).send({ post: { id: postId } });
  });

  server.get("/api/posts/:postId", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const postId = (req.params as { postId: string }).postId;
    const [postRow] = await db
      .select({
        post: posts,
        authorName: user.name,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postRow) {
      return reply.notFound("Post not found");
    }

    const { post, authorName } = postRow;

    const currentVersion = post.currentVersionId
      ? await db
          .select()
          .from(postVersions)
          .where(eq(postVersions.id, post.currentVersionId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

    return {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        status: post.status,
        edition: post.edition,
        publishAt: post.publishAt?.toISOString() ?? null,
        updatedAt: post.updatedAt.toISOString(),
        tags: post.tags ?? [],
        category: post.category,
        language: post.language,
        canonicalUrl: post.canonicalUrl,
        schema: buildBlogPosting(post, currentVersion, authorName),
      },
    };
  });

  server.patch("/api/posts/:postId", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const postId = (req.params as { postId: string }).postId;
    const parseResult = updatePostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.badRequest("Invalid post payload");
    }

    const payload = parseResult.data;
    const publishAt = parseOptionalDate(payload.publishAt);
    if (payload.publishAt && !publishAt) {
      return reply.badRequest("publishAt must be an ISO timestamp");
    }

    const [existing] = await db
      .select({ slug: posts.slug })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (!existing) {
      return reply.notFound("Post not found");
    }

    const nextSlug = payload.slug?.trim();
    const updatePayload: Record<string, unknown> = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (nextSlug !== undefined) updatePayload.slug = nextSlug;
    if (payload.description !== undefined)
      updatePayload.description = payload.description;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.edition !== undefined) updatePayload.edition = payload.edition;
    if (payload.publishAt !== undefined) updatePayload.publishAt = publishAt;
    if (payload.tags !== undefined) updatePayload.tags = payload.tags;
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.language !== undefined) updatePayload.language = payload.language;
    if (payload.canonicalUrl !== undefined)
      updatePayload.canonicalUrl = payload.canonicalUrl;

    if (Object.keys(updatePayload).length === 0) {
      return { ok: true };
    }

    try {
      await db.transaction(async (tx) => {
        // Slug history and slug update must commit together so history never
        // records a slug transition that failed to apply on the post row.
        if (nextSlug && nextSlug !== existing.slug) {
          await tx.insert(postSlugHistory).values({
            id: randomUUID(),
            postId,
            oldSlug: existing.slug,
            newSlug: nextSlug,
          });
        }

        await tx.update(posts).set(updatePayload).where(eq(posts.id, postId));
      });
    } catch (error) {
      if (isUniqueConstraintError(error, POSTS_SLUG_CONSTRAINT)) {
        return reply.conflict("Slug already exists for another post");
      }
      server.log.error({ err: error }, "Failed to update post");
      return reply.internalServerError("Failed to update post");
    }

    return { ok: true };
  });

  server.delete("/api/posts/:postId", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const postId = (req.params as { postId: string }).postId;
    await db.delete(posts).where(eq(posts.id, postId));
    return { ok: true };
  });

  server.get("/api/posts/:postId/versions", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const postId = (req.params as { postId: string }).postId;
    const versions = await db
      .select({
        id: postVersions.id,
        version: postVersions.version,
        status: postVersions.status,
        sourceRef: postVersions.sourceRef,
        createdAt: postVersions.createdAt,
        publishedAt: postVersions.publishedAt,
      })
      .from(postVersions)
      .where(eq(postVersions.postId, postId))
      .orderBy(desc(postVersions.version));

    return {
      versions: versions.map((version) => ({
        ...version,
        createdAt: version.createdAt.toISOString(),
        publishedAt: version.publishedAt?.toISOString() ?? null,
      })),
    };
  });

  server.post("/api/posts/:postId/versions", async (req, reply) => {
    const session = await requireCmsAdmin(req, reply);
    if (!session) return;

    const postId = (req.params as { postId: string }).postId;
    const parseResult = createVersionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.badRequest("Invalid version payload");
    }

    const payload = parseResult.data;
    const [postRecord] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postRecord) {
      return reply.notFound("Post not found");
    }

    const [existingVersion] = await db
      .select({ id: postVersions.id })
      .from(postVersions)
      .where(
        and(
          eq(postVersions.postId, postId),
          eq(postVersions.version, payload.version),
        ),
      )
      .limit(1);

    if (existingVersion) {
      return reply.conflict("Version already exists for this post");
    }

    const versionId = randomUUID();
    const publishedAt =
      payload.status === "published" ? new Date() : null;

    try {
      await db.transaction(async (tx) => {
        // Version create and current-version pointer update are a single logical
        // write. The transaction prevents split-brain state on partial failure.
        await tx.insert(postVersions).values({
          id: versionId,
          postId,
          version: payload.version,
          status: payload.status,
          sourceRef: payload.sourceRef,
          changelog: payload.changelog,
          publishedAt,
        });

        await tx
          .update(posts)
          .set({ currentVersionId: versionId })
          .where(eq(posts.id, postId));
      });
    } catch (error) {
      if (isUniqueConstraintError(error, POST_VERSIONS_UNIQUE_CONSTRAINT)) {
        return reply.conflict("Version already exists for this post");
      }
      server.log.error({ err: error }, "Failed to create post version");
      return reply.internalServerError("Failed to create post version");
    }

    return reply.code(201).send({ version: { id: versionId } });
  });
}
