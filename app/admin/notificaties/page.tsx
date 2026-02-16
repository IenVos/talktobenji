"use client";

import { useState } from "react";
import { useAdminQuery, useAdminMutation, useAdminAction } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import { Bell, Send, Users, Clock, Trash2, RefreshCw, UserPlus } from "lucide-react";

export default function AdminNotificatiesPage() {
  const subscriberCount = useAdminQuery(api.pushSubscriptions.getSubscriberCount, {});
  const subscribers = useAdminQuery(api.pushSubscriptions.listSubscribers, {});
  const sentNotifications = useAdminQuery(api.pushSubscriptions.listSentNotifications, {});
  const sendToAll = useAdminAction(api.pushNotifications.sendToAll);
  const sendToNewOnly = useAdminAction(api.pushNotifications.sendToNewOnly);
  const deleteNotification = useAdminMutation(api.pushSubscriptions.deleteNotification);
  const alreadyNotifiedIds = useAdminQuery(api.pushSubscriptions.getAllNotifiedUserIds, {});

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; skipped?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bereken het aantal nieuwe subscribers (nog nooit een notificatie ontvangen)
  const newSubscriberCount = subscribers && alreadyNotifiedIds
    ? subscribers.filter((s: any) => !alreadyNotifiedIds.includes(s.userId)).length
    : 0;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    if (!confirm(`Notificatie versturen naar ${subscriberCount ?? 0} gebruiker(s)?`)) return;

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await sendToAll({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
      });
      setResult(res);
      setTitle("");
      setBody("");
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Versturen mislukt");
    } finally {
      setSending(false);
    }
  };

  const handleSendToNew = async () => {
    if (!title.trim() || !body.trim()) return;

    if (!confirm(`Notificatie versturen naar ${newSubscriberCount} nieuwe subscriber(s)?`)) return;

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await sendToNewOnly({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
      });
      setResult(res);
      setTitle("");
      setBody("");
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Versturen mislukt");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell size={24} className="text-primary-600" />
        <h1 className="text-xl font-bold text-primary-900">Push Notificaties</h1>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <Users size={20} className="text-primary-500" />
          <div>
            <p className="text-2xl font-bold text-primary-900">{subscriberCount ?? 0}</p>
            <p className="text-xs text-gray-500">Subscribers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <Send size={20} className="text-primary-500" />
          <div>
            <p className="text-2xl font-bold text-primary-900">{sentNotifications?.length ?? 0}</p>
            <p className="text-xs text-gray-500">Verstuurd</p>
          </div>
        </div>
      </div>

      {/* Verstuur formulier */}
      <form onSubmit={handleSend} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Nieuwe notificatie versturen</h2>

        <div>
          <label htmlFor="notif-title" className="block text-sm font-medium text-gray-700 mb-1">
            Titel
          </label>
          <input
            id="notif-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Nieuw bericht van Benji"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="notif-body" className="block text-sm font-medium text-gray-700 mb-1">
            Bericht
          </label>
          <textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bijv. Er staat een nieuwe handreiking voor je klaar"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            maxLength={300}
            required
          />
        </div>

        <div>
          <label htmlFor="notif-url" className="block text-sm font-medium text-gray-700 mb-1">
            Link (optioneel)
          </label>
          <input
            id="notif-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/account/handreikingen"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">Waar de gebruiker naartoe gaat als ze op de notificatie tikken. Standaard: /account</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={sending || !title.trim() || !body.trim() || subscriberCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
            {sending ? "Versturen..." : `Alle subscribers (${subscriberCount ?? 0})`}
          </button>
          <button
            type="button"
            onClick={handleSendToNew}
            disabled={sending || !title.trim() || !body.trim() || newSubscriberCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus size={18} />
            {sending ? "Versturen..." : `Alleen nieuwe subscribers (${newSubscriberCount})`}
          </button>
        </div>
        {newSubscriberCount === 0 && (subscriberCount ?? 0) > 0 && (
          <p className="text-xs text-gray-400">Alle subscribers hebben al eerder een notificatie ontvangen.</p>
        )}

        {result && (
          <p className="text-sm text-green-600">
            Verstuurd naar {result.sent} gebruiker(s).
            {result.failed > 0 && ` ${result.failed} mislukt.`}
            {result.skipped !== undefined && result.skipped > 0 && ` ${result.skipped} overgeslagen (al ontvangen).`}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Subscribers lijst */}
      {subscribers && subscribers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscribers</h2>
          <div className="space-y-2">
            {subscribers.map((sub: any) => (
              <div key={sub.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  <p className="text-xs text-gray-500">{sub.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {sub.deviceCount > 1 ? `${sub.deviceCount} apparaten` : "1 apparaat"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Sinds {new Date(sub.subscribedAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geschiedenis */}
      {sentNotifications && sentNotifications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verstuurde notificaties</h2>
          <div className="space-y-3">
            {sentNotifications.map((n: any) => (
              <div key={n._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  {n.url && <p className="text-xs text-primary-500 mt-0.5">{n.url}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.sentAt).toLocaleString("nl-NL")} — {n.recipientCount} ontvanger(s)
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(n.title);
                        setBody(n.body);
                        setUrl(n.url || "");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Opnieuw versturen"
                    >
                      <RefreshCw size={12} />
                      Opnieuw
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Deze notificatie verwijderen?")) return;
                        await deleteNotification({ notificationId: n._id });
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 size={12} />
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
