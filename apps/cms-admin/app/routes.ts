import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/posts.tsx"),
  route("posts/:postId", "routes/post-detail.tsx"),
  route("posts/:postId/edit", "routes/post-edit.tsx"),
] satisfies RouteConfig;
