import { redirect } from "next/navigation";

/** Redirect oude URL /account/notities naar /account/reflecties */
export default function NotitiesRedirectPage() {
  redirect("/account/reflecties");
}
