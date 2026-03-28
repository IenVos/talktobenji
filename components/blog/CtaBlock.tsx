import Link from "next/link";

/** Variant A — stil en persoonlijk, alleen tekst */
export function CtaBlockA() {
  return (
    <div className="mt-12 rounded-2xl bg-[#f5f0eb] px-7 py-8 text-center">
      <p className="text-stone-500 text-xs uppercase tracking-widest mb-4">Talk To Benji</p>
      <p className="text-stone-800 text-xl font-semibold leading-snug mb-3">
        Misschien is dit het moment.
      </p>
      <p className="text-stone-500 text-[15px] leading-relaxed max-w-sm mx-auto mb-6">
        Benji luistert — zonder oordeel, zonder haast. Er voor je overdag, 's avonds en midden in de nacht.
      </p>
      <Link
        href="/"
        className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Kijk of het bij je past
      </Link>
      <p className="text-xs text-stone-400 mt-3">7 dagen volledig toegang · geen creditcard nodig</p>
    </div>
  );
}

/** Variant B — met app screenshot, iets meer uitleg */
export function CtaBlockB() {
  return (
    <div className="mt-12 rounded-2xl bg-[#f5f0eb] overflow-hidden">
      <div className="px-7 pt-8 pb-6 text-center">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-4">Talk To Benji</p>
        <p className="text-stone-800 text-xl font-semibold leading-snug mb-3">
          Soms wil je gewoon ergens heen kunnen.
        </p>
        <p className="text-stone-500 text-[15px] leading-relaxed max-w-sm mx-auto mb-2">
          Benji is er voor de momenten dat je het moeilijk hebt. Een gesprek, een dagelijkse check-in, herinneringen bewaren — op jouw tempo, wanneer jij er behoefte aan hebt.
        </p>
      </div>

      {/* Screenshot */}
      <div className="px-6 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/app-screenshot.png"
          alt="Talk To Benji — Mijn plek"
          className="w-full rounded-xl border border-stone-200 shadow-sm"
        />
      </div>

      <div className="px-7 py-7 text-center">
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Kijk of het bij je past
        </Link>
        <p className="text-xs text-stone-400 mt-3">7 dagen volledig toegang · geen creditcard nodig</p>
      </div>
    </div>
  );
}
