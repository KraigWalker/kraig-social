import { ModerationView } from "../circuit";
import type { Route } from "./+types/moderation";

export const meta: Route.MetaFunction = () => [
  { title: "Safety | CircuitClub" },
  { name: "description", content: "CircuitClub community review and self-moderation demonstrator." },
];

export default function Moderation() {
  return <ModerationView />;
}
