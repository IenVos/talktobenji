import Link from "next/link";

type FounderLinkProps = {
  /** Tekst om te tonen (standaard: "LAAV") */
  label?: string;
  /** Optionele callback die wordt aangeroepen bij klik (bijv. om modal te sluiten) */
  onClick?: () => void;
};

/** Klikbare link die verwijst naar de Waarom Benji pagina. */
export function FounderLink({ label = "LAAV", onClick }: FounderLinkProps) {
  return (
    <Link
      href="/waarom-benji"
      onClick={onClick}
      className="text-primary-600 hover:text-primary-700 underline underline-offset-2 font-medium transition-colors"
    >
      {label}
    </Link>
  );
}
