import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/posts";
import { apiRequest } from "~/lib/api";
import styles from "~/styles/cms.module.css";

type PostSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
  edition: number;
  currentVersion: number | null;
  updatedAt: string;
};

type LoaderData = {
  posts: PostSummary[];
  error?: string;
};

type ActionData = {
  error?: string;
};

export async function loader(): Promise<LoaderData> {
  try {
    const data = await apiRequest<{ posts: PostSummary[] }>("/api/posts");
    return { posts: data.posts };
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "CMS API is unreachable.";
    return { posts: [], error: message };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const payload = {
    title: String(formData.get("title") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    status: String(formData.get("status") || "draft"),
    description: String(formData.get("description") || "").trim() || undefined,
    edition: Number(formData.get("edition") || 1),
  };

  if (!payload.title || !payload.slug) {
    return { error: "Title and slug are required." };
  }

  try {
    const data = await apiRequest<{ post: { id: string } }>("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return redirect(`/posts/${data.post.id}`);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to create post.";
    return { error: message };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CMS Posts" },
    {
      name: "description",
      content: "Create and manage editorial posts for kraig.social",
    },
  ];
}

export default function Posts({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { posts, error } = loaderData;
  const createError = actionData as ActionData | undefined;

  return (
    <div className={styles.stackLarge}>
      <section className={styles.sectionElevated}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <p className={styles.sectionKicker}>Posts</p>
            <h2 className={styles.sectionTitle}>Create new post</h2>
            <p className={styles.sectionSubtitle}>
              Draft metadata now; JSX source and assets can be wired next.
            </p>
          </div>
        </div>

        {createError?.error ? (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            {createError.error}
          </div>
        ) : null}

        <Form method="post" className={styles.formGridTwo}>
          <label className={styles.field}>
            Title
            <input
              name="title"
              required
              className={styles.input}
              placeholder="Post headline"
            />
          </label>
          <label className={styles.field}>
            Slug
            <input
              name="slug"
              required
              className={styles.input}
              placeholder="post-slug"
            />
          </label>
          <label className={styles.field}>
            Description
            <input
              name="description"
              className={styles.input}
              placeholder="Short summary for schema.org + SEO"
            />
          </label>
          <label className={styles.field}>
            Status
            <select
              name="status"
              className={styles.select}
              defaultValue="draft"
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
              defaultValue={1}
              className={styles.input}
            />
          </label>
          <div className={styles.actionsEnd}>
            <button
              type="submit"
              className={`${styles.buttonPrimary} ${styles.buttonBlock}`}
            >
              Create post
            </button>
          </div>
        </Form>
      </section>

      <section className={styles.sectionMuted}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h3 className={styles.sectionTitleSmall}>Recent posts</h3>
            <p className={styles.sectionSubtitle}>{posts.length} total</p>
          </div>
        </div>

        {error ? (
          <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>
        ) : null}

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Title</th>
                <th className={styles.tableHeadCell}>Slug</th>
                <th className={styles.tableHeadCell}>Status</th>
                <th className={styles.tableHeadCell}>Edition</th>
                <th className={styles.tableHeadCell}>Version</th>
                <th className={styles.tableHeadCell}>Updated</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.tableEmpty}>
                    No posts yet. Create the first draft above.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <Link
                        to={`/posts/${post.id}`}
                        className={styles.tableLink}
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className={`${styles.tableCell} ${styles.mutedText}`}>
                      {post.slug}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.statusPill}>{post.status}</span>
                    </td>
                    <td className={styles.tableCell}>{post.edition}</td>
                    <td className={styles.tableCell}>
                      {post.currentVersion ?? "n/a"}
                    </td>
                    <td className={`${styles.tableCell} ${styles.mutedText}`}>
                      {new Date(post.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
