"use client";

import { Suspense } from "react";
import { HouvasteGids } from "./HouvastGids";

export default function HouvasteGidsPage() {
  // Eigen Suspense-grens: HouvasteGids gebruikt useSearchParams. Sinds de root-layout
  // die hooks niet meer rond {children} opvangt (zie app/layout.tsx), heeft deze pagina
  // zijn eigen grens nodig om de CSR-bailout op te vangen bij static rendering.
  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
      <HouvasteGids />
    </Suspense>
  );
}
