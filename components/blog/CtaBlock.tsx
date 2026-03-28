import Link from "next/link";

export type CtaData = {
  eyebrow?: string;
  title: string;
  body: string;
  buttonText: string;
  footnote?: string;
  showImage: boolean;
  bgColor?: string;
  borderColor?: string;
  buttonColor?: string;
};

const DEFAULT_A: CtaData = {
  eyebrow: "Talk To Benji",
  title: "Misschien is dit het moment.",
  body: "Benji luistert — zonder oordeel, zonder haast. Er voor je overdag, 's avonds en midden in de nacht.",
  buttonText: "Kijk of het bij je past",
  footnote: "7 dagen volledig toegang · geen creditcard nodig",
  showImage: false,
};

const DEFAULT_B: CtaData = {
  eyebrow: "Talk To Benji",
  title: "Soms wil je gewoon ergens heen kunnen.",
  body: "Benji is er voor de momenten dat je het moeilijk hebt. Een gesprek, een dagelijkse check-in, herinneringen bewaren — op jouw tempo, wanneer jij er behoefte aan hebt.",
  buttonText: "Kijk of het bij je past",
  footnote: "7 dagen volledig toegang · geen creditcard nodig",
  showImage: true,
};

function CtaBlockInner({ data }: { data: CtaData }) {
  const bg = data.bgColor || "#f5f0eb";
  const btnColor = data.buttonColor || "#6d84a8";
  const borderStyle = data.borderColor
    ? { border: `2px solid ${data.borderColor}` }
    : {};

  return (
    <div
      className="mt-12 rounded-2xl overflow-hidden"
      style={{ background: bg, ...borderStyle }}
    >
      <div className="px-7 pt-8 pb-6 text-center">
        {data.eyebrow && (
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "color-mix(in srgb, #000 40%, " + bg + ")" }}>
            {data.eyebrow}
          </p>
        )}
        <p className="text-xl font-semibold leading-snug mb-3" style={{ color: "color-mix(in srgb, #000 75%, " + bg + ")" }}>
          {data.title}
        </p>
        <p className="text-[15px] leading-relaxed max-w-sm mx-auto mb-2" style={{ color: "color-mix(in srgb, #000 50%, " + bg + ")" }}>
          {data.body}
        </p>
      </div>

      {data.showImage && (
        <div className="px-6 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/app-screenshot.png"
            alt="Talk To Benji"
            className="w-full rounded-xl border border-stone-200 shadow-sm"
          />
        </div>
      )}

      <div className="px-7 pb-7 pt-5 text-center">
        <Link
          href="/"
          className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: btnColor }}
        >
          {data.buttonText}
        </Link>
        {data.footnote && (
          <p className="text-xs mt-3" style={{ color: "color-mix(in srgb, #000 35%, " + bg + ")" }}>
            {data.footnote}
          </p>
        )}
      </div>

      {/* Disclaimer — altijd onderaan */}
      <div className="px-6 pb-5 flex flex-col items-center gap-1">
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "color-mix(in srgb, #000 30%, " + bg + ")" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Gesprekken zijn privé en beveiligd.
        </span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "color-mix(in srgb, #000 30%, " + bg + ")" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Geen vervanging van professionele hulp.
        </span>
      </div>
    </div>
  );
}

export function CtaBlockA({ data }: { data?: CtaData | null }) {
  return <CtaBlockInner data={data ?? DEFAULT_A} />;
}

export function CtaBlockB({ data }: { data?: CtaData | null }) {
  return <CtaBlockInner data={data ?? DEFAULT_B} />;
}
