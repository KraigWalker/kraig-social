import type { LoaderFunctionArgs } from "react-router";

const API_TIMEOUT_MS = 1500;

export async function loader(_args: LoaderFunctionArgs) {
  const apiBase = process.env.TRAINING_API_BASE_URL;

  if (!apiBase) {
    return new Response("missing TRAINING_API_BASE_URL", { status: 503 });
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), API_TIMEOUT_MS);

    const res = await fetch(`${apiBase.replace(/\/$/, "")}/health`, {
      signal: ac.signal,
      headers: { Accept: "text/plain" },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return new Response(`api unhealthy (${res.status})`, { status: 503 });
    }

    return new Response("ok", {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response("api unreachable", { status: 503 });
  }
}

// Keep the module non-empty on the client build without turning this into a document route.
export const handle = { health: true };
