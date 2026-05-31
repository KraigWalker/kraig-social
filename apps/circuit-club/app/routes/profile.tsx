import { ProfileView } from "../circuit";
import type { Route } from "./+types/profile";

export const meta: Route.MetaFunction = () => [
  { title: "Profile | CircuitClub" },
  { name: "description", content: "Edit your local CircuitClub profile and manage favourites." },
];

export default function Profile() {
  return <ProfileView />;
}
