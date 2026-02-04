"use client";

import { useState } from "react";
import { FounderModal } from "./FounderModal";

type FounderLinkProps = {
  /** Tekst om te tonen (standaard: "LAAV") */
  label?: string;
};

/** Klikbare link die een popup opent met info over de oprichter. */
export function FounderLink({ label = "LAAV" }: FounderLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary-600 hover:text-primary-700 underline bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit"
      >
        {label}
      </button>
      <FounderModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
