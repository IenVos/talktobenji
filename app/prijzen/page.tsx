// Tijdelijk omgeleid naar jaar-toegang landingspagina
// Zet de originele inhoud terug voor het abo-model
import { redirect } from "next/navigation";

export default function PrijzenPage() {
  redirect("/lp/jaar-toegang");
}
