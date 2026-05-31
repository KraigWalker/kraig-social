import { DiscoverView } from "../circuit";
import type { Route } from "./+types/discover";

export const meta: Route.MetaFunction = () => [
  { title: "Nearby | CircuitClub" },
  { name: "description", content: "Browse nearby CircuitClub profiles by coarse privacy-preserving cells." },
];

export default function Discover() {
  return <DiscoverView />;
}
