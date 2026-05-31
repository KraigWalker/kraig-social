import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("discover", "routes/discover.tsx"),
  route("messages", "routes/messages.tsx"),
  route("profile", "routes/profile.tsx"),
  route("moderation", "routes/moderation.tsx"),
] satisfies RouteConfig;
