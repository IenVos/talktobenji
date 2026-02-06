import { redirect } from "next/navigation";

/** Redirect voor backwards compatibility – gebruikers gaan naar account-pagina */
export default function MijnGesprekkenRedirectPage() {
  redirect("/account/gesprekken");
}
