import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/post-edit";
import { apiRequest } from "~/lib/api";
import styles from "~/styles/cms.module.css";

type PostDetail = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: string;
  edition: number;
  publishAt?: string | null;
  tags: string[];
  category?: string | null;
  language?: string | null;
  canonicalUrl?: string | null;
};

type LoaderData = {
  post: PostDetail | null;
  error?: string;
};

type ActionData = {
  error?: string;
};

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const postId = params.postId;
  if (!postId) {
    return { post: null, error: "Missing post id." };
  }

  try {
    const data = await apiRequest<{ post: PostDetail }>(
      `/api/posts/${postId}`,
    );
    return { post: data.post };
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to load post.";
    return { post: null, error: message };
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const postId = params.postId;
  if (!postId) {
    return { error: "Missing post id." };
  }

  const formData = await request.formData();
  const payload = {
    title: String(formData.get("title") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim() || undefined,
    status: String(formData.get("status") || "draft"),
    edition: Number(formData.get("edition") || 1),
    publishAt: String(formData.get("publishAt") || "").trim() || undefined,
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    category: String(formData.get("category") || "").trim() || undefined,
    language: String(formData.get("language") || "").trim() || undefined,
    canonicalUrl: String(formData.get("canonicalUrl") || "").trim() || undefined,
  };

  try {
    await apiRequest(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return redirect(`/posts/${postId}`);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to update post.";
    return { error: message };
  }
}

export default function PostEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { post, error } = loaderData;
  const updateError = actionData as ActionData | undefined;

  if (error) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`}>
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.sectionBase}>
        Post not found.
      </div>
    );
  }

  return (
    <section className={styles.sectionElevated}>
      <div className={styles.sectionHeaderRow}>
        <div>
          <p className={styles.sectionKicker}>
            Edit post
          </p>
          <h2 className={styles.sectionTitle}>
            {post.title}
          </h2>
          <p className={styles.sectionSubtitle}>/{post.slug}</p>
        </div>
        <Link
          to={`/posts/${post.id}`}
          className={styles.buttonGhost}
        >
          Back to details
        </Link>
      </div>

      {updateError?.error ? (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          {updateError.error}
        </div>
      ) : null}

      <Form method="post" className={styles.formGridTwo}>
        <label className={styles.field}>
          Title
          <input
            name="title"
            defaultValue={post.title}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Slug
          <input
            name="slug"
            defaultValue={post.slug}
            className={styles.input}
          />
        </label>
        <label className={`${styles.field} ${styles.spanFull}`}>
          Description
          <textarea
            name="description"
            rows={2}
            defaultValue={post.description ?? ""}
            className={styles.textarea}
          />
        </label>
        <label className={styles.field}>
          Status
          <select
            name="status"
            defaultValue={post.status}
            className={styles.select}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className={styles.field}>
          Edition
          <input
            name="edition"
            type="number"
            min="1"
            defaultValue={post.edition}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Publish at (ISO)
          <input
            name="publishAt"
            defaultValue={post.publishAt ?? ""}
            className={styles.input}
            placeholder="2025-01-01T10:00:00Z"
          />
        </label>
        <label className={styles.field}>
          Category
          <input
            name="category"
            defaultValue={post.category ?? ""}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Tags (comma separated)
          <input
            name="tags"
            defaultValue={post.tags.join(", ")}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Language (BCP47)
          <input
            name="language"
            defaultValue={post.language ?? ""}
            className={styles.input}
            placeholder="en-US"
          />
        </label>
        <label className={`${styles.field} ${styles.spanFull}`}>
          Canonical URL
          <input
            name="canonicalUrl"
            defaultValue={post.canonicalUrl ?? ""}
            className={styles.input}
            placeholder="https://kraig.social/post-slug"
          />
        </label>
        <div className={styles.spanFull}>
          <button
            type="submit"
            className={`${styles.buttonPrimary} ${styles.buttonBlock}`}
          >
            Save changes
          </button>
        </div>
      </Form>
    </section>
  );
}
