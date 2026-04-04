"use client";

import { useState, useMemo } from "react";
import { useAdminQuery, useAdminMutation } from "../AdminAuthContext";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Network, Edit, Save, X, ExternalLink, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

type SortField = "incoming" | "outgoing" | "anchors" | "title";
type SortDir = "asc" | "desc";

export default function LinkStructuurPage() {
  const stats = useAdminQuery(api.blogPosts.listWithLinkStats, {});
  const pillars = useAdminQuery(api.pillars.list, {});
  const updatePost = useAdminMutation(api.blogPosts.update);
  const clearAllAnchors = useAdminMutation(api.blogPosts.clearAllAnchorPhrases);

  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "concept">("all");
  const [sortField, setSortField] = useState<SortField>("incoming");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingId, setEditingId] = useState<Id<"blogPosts"> | null>(null);
  const [editPhrases, setEditPhrases] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const pillarMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of (pillars ?? [])) map.set(p.slug, p.title);
    return map;
  }, [pillars]);

  const pillarOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { slug: string; title: string }[] = [];
    for (const p of (stats ?? [])) {
      if (p.pillarSlug && !seen.has(p.pillarSlug)) {
        seen.add(p.pillarSlug);
        options.push({ slug: p.pillarSlug, title: pillarMap.get(p.pillarSlug) ?? p.pillarSlug });
      }
    }
    return options.sort((a, b) => a.title.localeCompare(b.title));
  }, [stats, pillarMap]);

  const filtered = useMemo(() => {
    let items: any[] = stats ?? [];
    if (filterPillar !== "all") items = items.filter((p: any) => p.pillarSlug === filterPillar);
    if (filterStatus === "live") items = items.filter((p: any) => p.isLive);
    if (filterStatus === "concept") items = items.filter((p: any) => !p.isLive);
    return [...items].sort((a: any, b: any) => {
      let diff = 0;
      if (sortField === "incoming") diff = a.incomingLinkCount - b.incomingLinkCount;
      else if (sortField === "outgoing") diff = a.outgoingLinks.length - b.outgoingLinks.length;
      else if (sortField === "anchors") diff = a.anchorPhrases.length - b.anchorPhrases.length;
      else diff = a.title.localeCompare(b.title);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [stats, filterPillar, filterStatus, sortField, sortDir]);

  // Gezondheidssamenvatting (alleen live)
  const liveItems = (stats ?? []).filter((p: any) => p.isLive);
  const noLinks = liveItems.filter((p: any) => p.incomingLinkCount === 0).length;
  const oneLink = liveItems.filter((p: any) => p.incomingLinkCount === 1).length;
  const goodLinks = liveItems.filter((p: any) => p.incomingLinkCount >= 2).length;

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={13} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={13} className="text-primary-600" /> : <ChevronDown size={13} className="text-primary-600" />;
  }

  function healthBadge(count: number) {
    if (count === 0) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">{count}</span>;
    if (count === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{count}</span>;
    return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">{count}</span>;
  }

  async function savePhrases(id: Id<"blogPosts">) {
    setSaving(true);
    const phrases = editPhrases.split(",").map((s) => s.trim()).filter(Boolean);
    await updatePost({ id, anchorPhrases: phrases.length ? phrases : undefined });
    setSaving(false);
    setEditingId(null);
  }

  if (!stats) {
    return <div className="p-8 text-gray-400 text-sm">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Network className="text-primary-600" size={22} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Linkstructuur</h1>
            <p className="text-sm text-gray-500">Overzicht van interne links — welke artikelen hebben aandacht nodig?</p>
          </div>
        </div>
        <button
          onClick={async () => {
            if (!confirm("Alle ankerzinnen van alle artikelen verwijderen? Dit is onomkeerbaar.")) return;
            setClearing(true);
            const count = await clearAllAnchors({});
            setClearing(false);
            alert(`Ankerzinnen verwijderd van ${count} artikelen.`);
          }}
          disabled={clearing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {clearing ? "Bezig..." : "Alle ankerzinnen wissen"}
        </button>
      </div>

      {/* Gezondheidsindicatoren */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => { setFilterStatus("live"); setSortField("incoming"); setSortDir("asc"); }}>
          <p className="text-3xl font-bold text-red-600">{noLinks}</p>
          <p className="text-sm text-red-700 font-medium">Geen inkomende links</p>
          <p className="text-xs text-red-500 mt-0.5">Prioriteit: voeg links toe vanuit andere artikelen</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => { setFilterStatus("live"); setSortField("incoming"); setSortDir("asc"); }}>
          <p className="text-3xl font-bold text-amber-600">{oneLink}</p>
          <p className="text-sm text-amber-700 font-medium">Slechts 1 inkomende link</p>
          <p className="text-xs text-amber-500 mt-0.5">Doel: minimaal 2 per artikel</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-green-600">{goodLinks}</p>
          <p className="text-sm text-green-700 font-medium">2+ inkomende links</p>
          <p className="text-xs text-green-500 mt-0.5">Goed — deze zijn goed verankerd</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="all">Alle pillars</option>
          <option value="">Geen pillar</option>
          {pillarOptions.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "live" | "concept")}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="all">Live + concept</option>
          <option value="live">Alleen live</option>
          <option value="concept">Alleen concept</option>
        </select>
        <span className="text-sm text-gray-400">{filtered.length} artikelen</span>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                <button onClick={() => toggleSort("title")} className="flex items-center gap-1 hover:text-primary-600">
                  Artikel <SortIcon field="title" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Pillar</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ankerzinnen</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                <button onClick={() => toggleSort("anchors")} className="flex items-center gap-1 hover:text-primary-600 mx-auto">
                  # Ankers <SortIcon field="anchors" />
                </button>
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                <button onClick={() => toggleSort("incoming")} className="flex items-center gap-1 hover:text-primary-600 mx-auto">
                  ↓ Inkomend <SortIcon field="incoming" />
                </button>
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                <button onClick={() => toggleSort("outgoing")} className="flex items-center gap-1 hover:text-primary-600 mx-auto">
                  ↑ Uitgaand <SortIcon field="outgoing" />
                </button>
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Verwijst naar</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((post: any) => (
              <tr key={post._id} className={`hover:bg-gray-50 transition-colors ${!post.isLive ? "opacity-60" : ""}`}>
                {/* Titel */}
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-start gap-2">
                    {!post.isLive && (
                      <span className="mt-0.5 px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded font-medium flex-shrink-0">concept</span>
                    )}
                    <span className="text-gray-800 font-medium leading-tight line-clamp-2">{post.title}</span>
                  </div>
                </td>

                {/* Pillar */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {post.pillarSlug ? (
                    <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5">
                      {pillarMap.get(post.pillarSlug) ?? post.pillarSlug}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">—</span>
                  )}
                </td>

                {/* Ankerzinnen */}
                <td className="px-4 py-3">
                  {editingId === post._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editPhrases}
                        onChange={(e) => setEditPhrases(e.target.value)}
                        placeholder="zin 1, zin 2, zin 3"
                        className="text-xs border border-primary-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-primary-400"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") savePhrases(post._id as Id<"blogPosts">); if (e.key === "Escape") setEditingId(null); }}
                      />
                      <button onClick={() => savePhrases(post._id as Id<"blogPosts">)} disabled={saving}
                        className="text-green-600 hover:text-green-800 flex-shrink-0">
                        <Save size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      {post.anchorPhrases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.anchorPhrases.map((phrase: any, i: number) => (
                            <span key={i} className="text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded px-1.5 py-0.5">
                              {phrase}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-red-400 italic">geen ankerzinnen</span>
                      )}
                      <button
                        onClick={() => { setEditingId(post._id as Id<"blogPosts">); setEditPhrases(post.anchorPhrases.join(", ")); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary-600 flex-shrink-0 ml-1">
                        <Edit size={12} />
                      </button>
                    </div>
                  )}
                </td>

                {/* Ankerfrasen teller */}
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${post.anchorPhrases.length > 0 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-400"}`}>
                    {post.anchorPhrases.length}
                  </span>
                </td>

                {/* Inkomende links */}
                <td className="px-4 py-3 text-center">
                  {healthBadge(post.incomingLinkCount)}
                </td>

                {/* Uitgaande links */}
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${post.outgoingLinks.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                    {post.outgoingLinks.length}
                  </span>
                </td>

                {/* Verwijst naar */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  {post.outgoingLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {post.outgoingLinks.map((link: any, i: number) => (
                        <span key={i} className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 truncate max-w-[120px]" title={link.slug}>
                          {link.slug}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 italic">—</span>
                  )}
                </td>

                {/* Acties */}
                <td className="px-4 py-3">
                  <a href={post.isLive ? `/blog/${post.slug}` : `/blog/${post.slug}/preview?token=${process.env.NEXT_PUBLIC_PREVIEW_SECRET ?? "preview"}`}
                    target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors inline-flex">
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Geen artikelen gevonden.</div>
        )}
      </div>

      {/* Uitleg */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-600 space-y-2">
        <p className="font-medium text-stone-700">Hoe werkt het linknetwerk?</p>
        <ul className="space-y-1 text-xs text-stone-500">
          <li>🔴 <strong>0 inkomende links</strong> — dit artikel is een eiland. Voeg het toe als "Lees ook" in gerelateerde artikelen.</li>
          <li>🟡 <strong>1 inkomende link</strong> — kwetsbaar. Nog één link toevoegen voor meer autoriteit.</li>
          <li>🟢 <strong>2+ inkomende links</strong> — goed verankerd. Blijft meeprofiteren van linkjuice.</li>
          <li>🔗 <strong>Ankerzinnen</strong> — hover over een rij en klik het potlood om ze direct te bewerken. Gescheiden door komma's.</li>
        </ul>
        <p className="text-xs text-stone-400 mt-1">Tip: gebruik de rode kaarten als checklist bij het schrijven van een nieuw artikel — kies je 2 "Lees ook" artikelen uit de artikelen met de laagste score.</p>
      </div>
    </div>
  );
}
