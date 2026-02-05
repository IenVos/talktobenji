"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { MessageCircle, BarChart3, Hash, Calendar, HelpCircle, Plus } from "lucide-react";

function getDefaultMonths() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = new Date(y, m - 2, 1); // 3 maanden terug
  return {
    fromMonth: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`,
    toMonth: `${y}-${String(m + 1).padStart(2, "0")}`,
  };
}

export default function AdminAnalytics() {
  const defaults = getDefaultMonths();
  const [fromMonth, setFromMonth] = useState(defaults.fromMonth);
  const [toMonth, setToMonth] = useState(defaults.toMonth);

  const stats = useQuery(api.analytics.getDashboardStats, {
    fromMonth,
    toMonth,
  });

  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900">Analytics</h1>
          <p className="text-sm sm:text-base text-primary-700 mt-1">
            Overzicht van chatbot-gebruik
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            <label htmlFor="fromMonth" className="text-sm text-primary-700 sr-only sm:not-sr-only">
              Van
            </label>
            <input
              id="fromMonth"
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              max={toMonth}
              className="px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <span className="text-primary-600 text-sm">tot</span>
          <div className="flex items-center gap-2">
            <label htmlFor="toMonth" className="text-sm text-primary-700 sr-only sm:not-sr-only">
              Tot
            </label>
            <input
              id="toMonth"
              type="month"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              min={fromMonth}
              className="px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Kaart: Vragen beantwoord */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
            <MessageCircle className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">
              Vragen beantwoord
            </h2>
            <p className="text-xs sm:text-sm text-primary-700">
              Totaal aantal antwoorden van Benji
            </p>
          </div>
        </div>
        <p className="text-3xl sm:text-4xl font-bold text-primary-900">
          {stats.questionsAnswered.toLocaleString("nl-NL")}
        </p>
        <p className="text-sm text-primary-600 mt-1">
          {stats.totalSessions} chat-sessies
          {stats.fromMonth && stats.toMonth && (
            <> in {stats.fromMonth} – {stats.toMonth}</>
          )}
        </p>
      </div>

      {/* Populairste onderwerpen */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">
              Populairste onderwerpen
            </h2>
            <p className="text-xs sm:text-sm text-primary-700">
              Waar gebruikers op klikken om te starten
            </p>
          </div>
        </div>
        {stats.popularTopics.length > 0 ? (
          <ul className="space-y-2">
            {stats.popularTopics.map(({ topic, count }, i) => (
              <li
                key={topic}
                className="flex items-center justify-between py-2 border-b border-primary-100 last:border-0"
              >
                <span className="text-primary-800">{topic}</span>
                <span className="text-primary-600 font-medium">{count}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-primary-600 text-sm">Nog geen data</p>
        )}
      </div>

      {/* Populairste categorieën (Knowledge Base) */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
            <Hash className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">
              Meest gebruikte categorieën
            </h2>
            <p className="text-xs sm:text-sm text-primary-700">
              Q&A&apos;s uit de Knowledge Base (cumulatief, alle tijd)
            </p>
          </div>
        </div>
        {stats.popularCategories.length > 0 ? (
          <ul className="space-y-2">
            {stats.popularCategories.map(({ category, count }) => (
              <li
                key={category}
                className="flex items-center justify-between py-2 border-b border-primary-100 last:border-0"
              >
                <span className="text-primary-800">{category}</span>
                <span className="text-primary-600 font-medium">{count}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-primary-600 text-sm">Nog geen data</p>
        )}
      </div>

      {/* Onbeantwoorde vragen – voor Knowledge Base-aanvulling */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center border border-amber-200">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-primary-900">
              Onbeantwoorde vragen
            </h2>
            <p className="text-xs sm:text-sm text-primary-700">
              Vragen waar de AI geen antwoord op had – voeg toe aan de Knowledge Base
            </p>
          </div>
        </div>
        {stats.unansweredQuestions.length > 0 ? (
          <ul className="space-y-2">
            {stats.unansweredQuestions.map(({ question, count, lastAt }) => (
              <li
                key={question}
                className="flex items-center justify-between gap-3 py-2 border-b border-primary-100 last:border-0"
              >
                <span className="text-primary-800 flex-1 min-w-0">{question}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {count > 1 && (
                    <span className="text-amber-600 text-xs font-medium">{count}×</span>
                  )}
                  <Link
                    href={`/admin/knowledge?question=${encodeURIComponent(question)}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Plus size={14} />
                    Toevoegen
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-primary-600 text-sm">
            Geen onbeantwoorde vragen in deze periode. De AI kon alle vragen beantwoorden.
          </p>
        )}
      </div>
    </div>
  );
}
