import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Training Admin" },
    { name: "description", content: "Kraig Training admin setup" },
  ];
}

type LoaderData = {
  hasAdminUser: boolean;
  userCount: number;
  error?: string;
};

export async function loader(): Promise<LoaderData> {
  const apiBase = process.env.TRAINING_API_BASE_URL;

  if (!apiBase) {
    return {
      hasAdminUser: false,
      userCount: 0,
      error: "TRAINING_API_BASE_URL is not set for the admin app.",
    };
  }

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/admin/bootstrap`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        hasAdminUser: false,
        userCount: 0,
        error: `Training API returned ${res.status}.`,
      };
    }

    const data = (await res.json()) as LoaderData;
    if (typeof data?.hasAdminUser !== "boolean") {
      return {
        hasAdminUser: false,
        userCount: 0,
        error: "Training API response was invalid.",
      };
    }

    return data;
  } catch {
    return {
      hasAdminUser: false,
      userCount: 0,
      error: "Training API is unreachable from the admin app.",
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { hasAdminUser, userCount, error } = loaderData;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Kraig Training Admin
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {hasAdminUser ? "Admin ready" : "First user setup"}
              </h1>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                hasAdminUser
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              {hasAdminUser ? "Admin detected" : "Setup required"}
            </span>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-6 text-sm leading-relaxed text-slate-300">
            {error ? (
              <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
                <p className="text-sm font-semibold">
                  Admin status unavailable
                </p>
                <p className="mt-2 text-sm text-amber-100/90">{error}</p>
              </div>
            ) : null}
            {hasAdminUser ? (
              <div className="space-y-4">
                <p>
                  An admin user exists. You can now continue building the admin
                  experience.
                </p>
                <p className="text-slate-400">
                  Total users detected: <span className="font-medium">{userCount}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  No admin user has been created yet. Create the first account
                  with Better Auth, then refresh this page to continue.
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Next steps
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                    <li>Create the first user using the Better Auth flow.</li>
                    <li>Reload this page to unlock admin tools.</li>
                  </ol>
                </div>
                <p className="text-slate-500">
                  Once roles are wired, the first user will be promoted to
                  admin automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
