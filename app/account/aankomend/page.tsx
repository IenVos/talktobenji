"use client";

import { useEffect, useState } from "react";
import { ComingSoonCard } from "@/components/ComingSoonCard";

interface Feature {
  _id: string;
  featureId: string;
  iconName: string;
  title: string;
  description: string;
}

/** Alle "binnenkort"-dingen uit het account op één plek (achter de Aankomend-kaart). */
export default function AankomendPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/coming-soon?section=all")
      .then((r) => r.json())
      .then((data) => {
        setFeatures(data.features ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className="space-y-3">
      {!loaded ? (
        <p className="text-sm text-gray-400 px-1">Laden…</p>
      ) : features.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary-100 p-8 text-center text-sm text-gray-500">
          Nog niks op de planning. Kom snel terug.
        </div>
      ) : (
        features.map((f) => (
          <ComingSoonCard
            key={f._id}
            id={f.featureId}
            iconName={f.iconName}
            title={f.title}
            description={f.description}
          />
        ))
      )}
    </div>
  );
}
