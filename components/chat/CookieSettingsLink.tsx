"use client";

const COOKIE_CONSENT_KEY = "benji_cookie_consent";

export function CookieSettingsLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
    >
      Cookie-instellingen wijzigen
    </button>
  );
}
