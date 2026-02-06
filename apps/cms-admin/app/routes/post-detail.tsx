import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/post-detail";
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
  updatedAt: string;
  tags: string[];
  category?: string | null;
  language?: string | null;
  canonicalUrl?: string | null;
  schema: Record<string, unknown>;
};

type PostVersion = {
  id: string;
  version: number;
  status: string;
  sourceRef?: string | null;
  createdAt: string;
  publishedAt?: string | null;
};

type LoaderData = {
  post: PostDetail | null;
  versions: PostVersion[];
  error?: string;
};

type ActionData = {
  error?: string;
};

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const postId = params.postId;
  if (!postId) {
    return { post: null, versions: [], error: "Missing post id." };
  }

  try {
    const [postData, versionData] = await Promise.all([
      apiRequest<{ post: PostDetail }>(`/api/posts/${postId}`),
      apiRequest<{ versions: PostVersion[] }>(
        `/api/posts/${postId}/versions`,
      ),
    ]);
    return { post: postData.post, versions: versionData.versions };
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to load post details.";
    return { post: null, versions: [], error: message };
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const postId = params.postId;
  if (!postId) {
    return { error: "Missing post id." };
  }

  const formData = await request.formData();
  const payload = {
    version: Number(formData.get("version") || 1),
    status: String(formData.get("status") || "draft"),
    sourceRef: String(formData.get("sourceRef") || "").trim() || undefined,
    changelog: String(formData.get("changelog") || "").trim() || undefined,
  };

  try {
    await apiRequest(`/api/posts/${postId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return redirect(`/posts/${postId}`);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Unable to create version.";
    return { error: message };
  }
}

export default function PostDetail({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { post, versions, error } = loaderData;
  const createError = actionData as ActionData | undefined;

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
    <div className={styles.stackMedium}>
      <section className={styles.sectionElevated}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <p className={styles.sectionKicker}>
              {post.status}
            </p>
            <h2 className={styles.sectionTitle}>
              {post.title}
            </h2>
            <p className={styles.sectionSubtitle}>/{post.slug}</p>
          </div>
          <div className={styles.buttonRow}>
            <Link
              to={`/posts/${post.id}/edit`}
              className={styles.buttonSecondary}
            >
              Edit metadata
            </Link>
            <Link
              to="/"
              className={styles.buttonGhost}
            >
              Back to list
            </Link>
          </div>
        </div>

        <div className={styles.statsGridThree}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>
              Edition
            </p>
            <p className={styles.statValueStrong}>{post.edition}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>
              Publish
            </p>
            <p className={styles.statValue}>
              {post.publishAt
                ? new Date(post.publishAt).toLocaleString()
                : "n/a"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>
              Updated
            </p>
            <p className={styles.statValue}>
              {new Date(post.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className={styles.statsGridTwo}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>
              Description
            </p>
            <p className={styles.statValue}>
              {post.description || "n/a"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>
              Tags
            </p>
            <p className={styles.statValue}>
              {post.tags.length ? post.tags.join(", ") : "n/a"}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.sectionMuted}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h3 className={styles.sectionTitleSmall}>
              Versions
            </h3>
            <p className={styles.sectionSubtitle}>
              {versions.length} saved versions
            </p>
          </div>
        </div>

        {createError?.error ? (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            {createError.error}
          </div>
        ) : null}

        <Form method="post" className={styles.formGridFour}>
          <label className={styles.field}>
            Version
            <input
              name="version"
              type="number"
              min="1"
              defaultValue={versions.length + 1}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            Status
            <select
              name="status"
              className={styles.select}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className={styles.field}>
            Source ref
            <input
              name="sourceRef"
              className={styles.input}
              placeholder="git sha or object id"
            />
          </label>
          <label className={`${styles.field} ${styles.spanFull}`}>
            Changelog
            <textarea
              name="changelog"
              rows={2}
              className={styles.textarea}
            />
          </label>
          <div className={styles.spanFull}>
            <button
              type="submit"
              className={styles.buttonPrimary}
            >
              Add version
            </button>
          </div>
        </Form>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Version</th>
                <th className={styles.tableHeadCell}>Status</th>
                <th className={styles.tableHeadCell}>Source</th>
                <th className={styles.tableHeadCell}>Created</th>
                <th className={styles.tableHeadCell}>Published</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.tableEmpty}>
                    No versions yet.
                  </td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>v{version.version}</td>
                    <td className={styles.tableCell}>{version.status}</td>
                    <td className={`${styles.tableCell} ${styles.mutedText}`}>
                      {version.sourceRef ?? "n/a"}
                    </td>
                    <td className={`${styles.tableCell} ${styles.mutedText}`}>
                      {new Date(version.createdAt).toLocaleString()}
                    </td>
                    <td className={`${styles.tableCell} ${styles.mutedText}`}>
                      {version.publishedAt
                        ? new Date(version.publishedAt).toLocaleString()
                        : "n/a"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.sectionMuted}>
        <h3 className={styles.sectionTitleSmall}>
          Schema.org preview
        </h3>
        <p className={styles.sectionSubtitle}>
          Draft JSON-LD payload generated from the current metadata.
        </p>
        <pre className={styles.codeBlock}>
          <code>{JSON.stringify(post.schema, null, 2)}</code>
        </pre>
      </section>
    </div>
  );
}
