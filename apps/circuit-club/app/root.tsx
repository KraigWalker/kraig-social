import type { LinksFunction } from "react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import appStylesHref from "./app.css?url";
import type { Route } from "./+types/root";

const basePath = "/circuit-club";

export const links: LinksFunction = () => [
  {
    rel: "preload stylesheet",
    media: "screen",
    as: "style",
    type: "text/css",
    href: appStylesHref,
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: `${basePath}/fonts/dm-sans-latin.woff2`,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  { rel: "icon", type: "image/svg+xml", href: `${basePath}/icon.svg` },
  { rel: "manifest", href: `${basePath}/manifest.webmanifest` },
  { rel: "apple-touch-icon", href: `${basePath}/icon-192.svg` },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0d1b1e" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Circuit interrupted";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Route unavailable";
    details =
      error.status === 404
        ? "That CircuitClub page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="page page--error">
      <section className="notice-panel">
        <h1>{message}</h1>
        <p>{details}</p>
        {stack ? (
          <pre>
            <code>{stack}</code>
          </pre>
        ) : null}
      </section>
    </main>
  );
}
