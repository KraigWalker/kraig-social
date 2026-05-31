import { redirect } from "react-router";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "CircuitClub | Privacy-first queer proximity demo" },
  {
    name: "description",
    content:
      "CircuitClub is an installable web app demonstrator for coarse hex-grid discovery, encrypted messaging concepts, profiles, favourites, and community self-moderation.",
  },
];

export function loader() {
  return redirect("/discover");
}

export default function Home() {
  return null;
}
