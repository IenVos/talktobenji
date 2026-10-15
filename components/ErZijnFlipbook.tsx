"use client";

/** Het bladerende Er Zijn-boekje als video (echte Heyzine-pagina-animatie).
 *  Gedeeld tussen het blog-productblok en de checkout, zodat de bezoeker dezelfde
 *  kaart herkent. Speelt automatisch, gedempt en in een loop (ook op mobiel).
 *  Poster = de cover, zodat er meteen iets staat vóór de video geladen is. */
export function ErZijnFlipbook({ maxWidth = 680 }: { maxWidth?: number }) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth }}>
      <video
        src="/videos/er-zijn-boekje.mp4"
        poster="/images/er-zijn-boek-0.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Doorbladeren van het boekje Er Zijn"
        className="w-full rounded-lg shadow-lg block"
      />
    </div>
  );
}
