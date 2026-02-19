"use client";

import { useEffect, useState } from "react";
import { ComingSoonCard } from "./ComingSoonCard";

interface Feature {
  _id: string;
  featureId: string;
  iconName: string;
  title: string;
  description: string;
}

export function ComingSoonSection({ section, label }: { section: string; label: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    fetch(`/api/coming-soon?section=${encodeURIComponent(section)}`)
      .then((r) => r.json())
      .then((data) => setFeatures(data.features ?? []))
      .catch(() => {});
  }, [section]);

  if (features.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
        Aankomend in {label}
      </p>
      {features.map((f) => (
        <ComingSoonCard
          key={f._id}
          id={f.featureId}
          iconName={f.iconName}
          title={f.title}
          description={f.description}
        />
      ))}
    </div>
  );
}
