"use client";

import { useAdminQuery } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Wifi } from "lucide-react";

const EVENT_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  failed_login:        { label: "Mislukte login",    color: "text-red-600 bg-red-50 border-red-200",    icon: XCircle },
  login_success:       { label: "Succesvol ingelogd", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle },
  rate_limited:        { label: "Rate limited",      color: "text-orange-600 bg-orange-50 border-orange-200", icon: AlertTriangle },
  suspicious_activity: { label: "Verdachte activiteit", color: "text-red-700 bg-red-50 border-red-200", icon: AlertTriangle },
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} uur geleden`;
  return `${Math.floor(hrs / 24)} dagen geleden`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("nl-NL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function BeveiligingPage() {
  const events = useAdminQuery(api.security.getRecentEvents, { limit: 100 }) as any[] | undefined;

  if (!events) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const now = Date.now();
  const lastHour   = now - 60 * 60 * 1000;
  const last24h    = now - 24 * 60 * 60 * 1000;

  const failedLastHour = events.filter(e => e.type === "failed_login" && e.timestamp > lastHour).length;
  const failedLast24h  = events.filter(e => e.type === "failed_login" && e.timestamp > last24h).length;
  const rateLimited24h = events.filter(e => e.type === "rate_limited" && e.timestamp > last24h).length;
  const lastSuccess    = events.find(e => e.type === "login_success");
  const alertLevel     = failedLastHour >= 3 ? "kritiek" : failedLastHour >= 1 ? "let_op" : "ok";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-primary-600" />
        <div>
          <h1 className="text-xl font-bold text-primary-900">Beveiliging</h1>
          <p className="text-sm text-primary-600">Overzicht van loginpogingen en verdachte activiteit</p>
        </div>
      </div>

      {/* Alert banner */}
      {alertLevel === "kritiek" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Meerdere mislukte loginpogingen</p>
            <p className="text-sm text-red-700 mt-0.5">
              {failedLastHour} mislukte pogingen in het laatste uur. Controleer de lijst hieronder.
            </p>
          </div>
        </div>
      )}
      {alertLevel === "let_op" && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Mislukte loginpoging gedetecteerd</p>
            <p className="text-sm text-orange-700 mt-0.5">
              {failedLastHour} mislukte poging in het laatste uur.
            </p>
          </div>
        </div>
      )}
      {alertLevel === "ok" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">Geen verdachte activiteit in het laatste uur</p>
        </div>
      )}

      {/* Statscards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Mislukt (1u)</p>
          <p className={`text-2xl font-bold ${failedLastHour > 0 ? "text-red-600" : "text-stone-800"}`}>
            {failedLastHour}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Mislukt (24u)</p>
          <p className={`text-2xl font-bold ${failedLast24h > 0 ? "text-orange-600" : "text-stone-800"}`}>
            {failedLast24h}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Rate limited (24u)</p>
          <p className={`text-2xl font-bold ${rateLimited24h > 0 ? "text-orange-600" : "text-stone-800"}`}>
            {rateLimited24h}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Laatste login</p>
          <p className="text-sm font-semibold text-stone-800">
            {lastSuccess ? timeAgo(lastSuccess.timestamp) : "—"}
          </p>
        </div>
      </div>

      {/* Events tabel */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Recente activiteit</h2>
          <span className="text-xs text-stone-400">{events.length} events (laatste 30 dagen)</span>
        </div>

        {events.length === 0 ? (
          <div className="px-5 py-12 text-center text-stone-400 text-sm">
            Nog geen beveiligingsgebeurtenissen geregistreerd.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {events.map((event: any) => {
              const cfg = EVENT_LABELS[event.type] ?? EVENT_LABELS.suspicious_activity;
              const Icon = cfg.icon;
              return (
                <li key={event._id} className="flex items-center gap-4 px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} flex-shrink-0 w-40`}>
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500 flex-shrink-0">
                    <Wifi size={12} />
                    {event.ip}
                  </span>
                  {event.details && (
                    <span className="text-xs text-stone-400 flex-1 truncate">{event.details}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-stone-400 flex-shrink-0 ml-auto">
                    <Clock size={12} />
                    {formatTime(event.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-stone-400 text-center">
        Events worden 30 dagen bewaard. Alleen admin loginpogingen worden bijgehouden.
      </p>
    </div>
  );
}
