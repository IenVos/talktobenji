// Aparte layout voor Niet Alleen — geen sidebar, geen TTB-navigatie.
// De root layout (ConvexClientProvider, SessionProvider, etc.) blijft actief.
export default function NietAlleenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#fdf9f4" }}>
      {children}
    </div>
  );
}
