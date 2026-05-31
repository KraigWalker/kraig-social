import { MessagesView } from "../circuit";
import type { Route } from "./+types/messages";

export const meta: Route.MetaFunction = () => [
  { title: "Messages | CircuitClub" },
  { name: "description", content: "CircuitClub encrypted messaging concept demonstrator." },
];

export default function Messages() {
  return <MessagesView />;
}
