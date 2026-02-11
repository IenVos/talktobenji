"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";

export default function AccountDoelenPage() {
  const { data: session } = useSession();
  const userId = session?.userId ?? "";

  const goals = useQuery(api.reflecties.listGoals, userId ? { userId } : "skip");
  const createGoal = useMutation(api.reflecties.createGoal);
  const toggleGoal = useMutation(api.reflecties.toggleGoal);
  const deleteGoal = useMutation(api.reflecties.deleteGoal);

  const [newGoal, setNewGoal] = useState("");

  const handleAddGoal = async () => {
    if (!userId || !newGoal.trim()) return;
    await createGoal({ userId, content: newGoal.trim() });
    setNewGoal("");
  };

  const openGoals = goals?.filter((g) => !g.completed) ?? [];
  const completedGoals = goals?.filter((g) => g.completed) ?? [];

  return (
    <div className="space-y-6">
      {/* Nieuw doel toevoegen */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-2">
          <Target size={20} className="text-primary-500" />
          Persoonlijke doelen of wensen
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Schrijf kleine doelen op, bijvoorbeeld: &quot;Vandaag wil ik even buiten wandelen&quot; of &quot;Ik wil iets liefs doen voor mezelf&quot;.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Bijv. Vandaag wil ik even buiten wandelen"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
            className="flex-1 px-3 py-2 border border-primary-200 rounded-lg"
          />
          <button
            type="button"
            onClick={handleAddGoal}
            disabled={!newGoal.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
          >
            <Plus size={18} />
            Toevoegen
          </button>
        </div>
      </div>

      {/* Openstaande doelen */}
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
          <Circle size={20} className="text-primary-500" />
          Openstaande doelen
        </h2>
        {goals === undefined ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : openGoals.length === 0 ? (
          <p className="text-sm text-gray-500">Geen openstaande doelen. Voeg er een toe.</p>
        ) : (
          <ul className="space-y-2">
            {openGoals.map((g) => (
              <li
                key={g._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100"
              >
                <button
                  type="button"
                  onClick={() => toggleGoal({ goalId: g._id, userId })}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                  title="Markeer als voltooid"
                >
                  <Circle size={22} />
                </button>
                <span className="flex-1 text-primary-900">{g.content}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Doel verwijderen?")) deleteGoal({ goalId: g._id, userId });
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Voltooide doelen */}
      {completedGoals.length > 0 && (
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-primary-900 mb-4">
            <CheckCircle2 size={20} className="text-green-500" />
            Voltooide doelen
          </h2>
          <ul className="space-y-2">
            {completedGoals.map((g) => (
              <li
                key={g._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100"
              >
                <button
                  type="button"
                  onClick={() => toggleGoal({ goalId: g._id, userId })}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Markeer als niet voltooid"
                >
                  <CheckCircle2 size={22} />
                </button>
                <span className="flex-1 text-gray-500 line-through">{g.content}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Doel verwijderen?")) deleteGoal({ goalId: g._id, userId });
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
