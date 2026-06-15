"use client";

import { HouvasteGids } from "../page";

// Nette URL per verliestype: /even-houvast/huisdier, /even-houvast/persoon, enz.
// Het type komt direct uit het pad en wordt op naam (de code) in de content
// opgezocht, dus nieuwe types uit de admin krijgen automatisch deze URL.
export default function HouvastTypePage({ params }: { params: { type: string } }) {
  return <HouvasteGids verliesTypeOverride={params.type} />;
}
