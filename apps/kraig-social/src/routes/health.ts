export async function loader() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}

// Keep the module non-empty on the client build without turning this into a document route.
export const handle = { health: true };
