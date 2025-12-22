import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kraig Walker: Training Calendar" },
    { name: "description", content: "description" },
  ];
}

export default function Home() {
  return <Welcome />;
}
