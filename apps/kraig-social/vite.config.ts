import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
const addCrossoriginAnonymous = () => ({
  name: "add-crossorigin-anonymous",
  transformIndexHtml(html: string) {
    const withScripts = html.replace(
      /<script\b(?![^>]*\bcrossorigin\b)/g,
      '<script crossorigin="anonymous"',
    );
    return withScripts.replace(
      /<link\b(?![^>]*\bcrossorigin\b)(?=[^>]*\brel=(?:"stylesheet"|'stylesheet'|stylesheet))/g,
      '<link crossorigin="anonymous"',
    );
  },
});

export default defineConfig({
  plugins: [react(), addCrossoriginAnonymous()],
});
