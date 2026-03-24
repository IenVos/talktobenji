"use client";

import { useEffect, useState } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  Clock, Wifi, Pencil, Check, X,
} from "lucide-react";

const EVENT_LABELS: Record<string, { label: string; color: string; dimColor: string; icon: React.ElementType }> = {
  failed_login:        { label: "Mislukte login",       color: "text-red-600 bg-red-50 border-red-200",         dimColor: "text-red-300 bg-red-50/50 border-red-100",       icon: XCircle },
  login_success:       { label: "Succesvol ingelogd",   color: "text-green-700 bg-green-50 border-green-200",   dimColor: "text-green-300 bg-green-50/50 border-green-100", icon: CheckCircle },
  rate_limited:        { label: "Rate limited",         color: "text-orange-600 bg-orange-50 border-orange-200",dimColor: "text-orange-300 bg-orange-50/50 border-orange-100", icon: AlertTriangle },
  suspicious_activity: { label: "Verdachte activiteit", color: "text-red-700 bg-red-50 border-red-200",         dimColor: "text-red-300 bg-red-50/50 border-red-100",       icon: AlertTriangle },
  admin_action:        { label: "Admin actie",          color: "text-blue-700 bg-blue-50 border-blue-200",      dimColor: "text-blue-300 bg-blue-50/50 border-blue-100",    icon: Shield },
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

function NoteEditor({ eventId, currentNote, onSave }: {
  eventId: string;
  currentNote?: string;
  onSave: (id: string, note: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNote ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(eventId, value);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
        title={currentNote ? "Notitie bewerken" : "Notitie toevoegen"}
      >
        <Pencil size={11} />
        {currentNote ? (
          <span className="max-w-[140px] truncate text-stone-500 italic">{currentNote}</span>
        ) : (
          <span className="hidden sm:inline">notitie</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        placeholder="Bijv. dit was ik zelf met VPN..."
        className="flex-1 min-w-0 text-xs px-2 py-1 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
      />
      <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-700 flex-shrink-0">
        <Check size={14} />
      </button>
      <button onClick={() => { setValue(currentNote ?? ""); setEditing(false); }} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export default function BeveiligingPage() {
  const events = useAdminQuery(api.security.getRecentEvents, { limit: 100 }) as any[] | undefined;
  const markAllRead = useAdminMutation(api.security.markAllRead);
  const addNote = useAdminMutation(api.security.addNote);

  // Markeer als gelezen zodra de pagina geopend wordt
  useEffect(() => {
    if (events && events.some((e: any) => !e.isRead)) {
      markAllRead({}).catch(() => {});
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNote = async (eventId: string, note: string) => {
    await addNote({ eventId: eventId as any, note });
  };

  if (!events) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const now = Date.now();
  const lastHour  = now - 60 * 60 * 1000;
  const last24h   = now - 24 * 60 * 60 * 1000;

  const failedLastHour = events.filter((e: any) => e.type === "failed_login" && e.timestamp > lastHour).length;
  const failedLast24h  = events.filter((e: any) => e.type === "failed_login" && e.timestamp > last24h).length;
  const rateLimited24h = events.filter((e: any) => e.type === "rate_limited" && e.timestamp > last24h).length;
  const lastSuccess    = events.find((e: any) => e.type === "login_success");
  const alertLevel     = failedLastHour >= 3 ? "kritiek" : failedLastHour >= 1 ? "let_op" : "ok";
  const unreadCount    = events.filter((e: any) => !e.isRead && (e.type === "failed_login" || e.type === "rate_limited")).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-primary-900">Beveiliging</h1>
            <p className="text-sm text-primary-600">Overzicht van loginpogingen en verdachte activiteit</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full font-medium">
            {unreadCount} ongelezen
          </span>
        )}
      </div>

      {/* Alert banner */}
      {alertLevel === "kritiek" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Meerdere mislukte loginpogingen</p>
            <p className="text-sm text-red-700 mt-0.5">{failedLastHour} mislukte pogingen in het laatste uur.</p>
          </div>
        </div>
      )}
      {alertLevel === "let_op" && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Mislukte loginpoging gedetecteerd</p>
            <p className="text-sm text-orange-700 mt-0.5">{failedLastHour} mislukte poging in het laatste uur.</p>
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
          <p className={`text-2xl font-bold ${failedLastHour > 0 ? "text-red-600" : "text-stone-800"}`}>{failedLastHour}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Mislukt (24u)</p>
          <p className={`text-2xl font-bold ${failedLast24h > 0 ? "text-orange-600" : "text-stone-800"}`}>{failedLast24h}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Rate limited (24u)</p>
          <p className={`text-2xl font-bold ${rateLimited24h > 0 ? "text-orange-600" : "text-stone-800"}`}>{rateLimited24h}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 mb-1">Laatste login</p>
          <p className="text-sm font-semibold text-stone-800">{lastSuccess ? timeAgo(lastSuccess.timestamp) : "—"}</p>
        </div>
      </div>

      {/* Events tabel */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Recente activiteit</h2>
          <span className="text-xs text-stone-400">{events.length} events · laatste 30 dagen</span>
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
              const isRead = event.isRead;
              const badgeColor = isRead ? cfg.dimColor : cfg.color;

              return (
                <li key={event._id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isRead ? "bg-stone-50/50" : "bg-white"}`}>
                  {/* Ongelezen indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!isRead && (event.type === "failed_login" || event.type === "rate_limited") ? "bg-orange-400" : "bg-transparent"}`} />

                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 w-38 ${badgeColor}`}>
                    <Icon size={12} />
                    {cfg.label}
                  </span>

                  <span className={`flex items-center gap-1.5 text-xs flex-shrink-0 ${isRead ? "text-stone-300" : "text-stone-500"}`}>
                    <Wifi size={12} />
                    {event.ip}
                  </span>

                  {event.details && !event.note && (
                    <span className={`text-xs flex-1 truncate ${isRead ? "text-stone-300" : "text-stone-400"}`}>
                      {event.details}
                    </span>
                  )}

                  {/* Notitie editor */}
                  <div className="flex-1 min-w-0 flex justify-end">
                    <NoteEditor
                      eventId={event._id}
                      currentNote={event.note}
                      onSave={handleSaveNote}
                    />
                  </div>

                  <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${isRead ? "text-stone-300" : "text-stone-400"}`}>
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
        Events worden 30 dagen bewaard · Badge verdwijnt automatisch als je deze pagina bezoekt
      </p>
    </div>
  );
}
