"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type FinancialEntry = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
};

type DashboardSummary = {
  from: string | null;
  to: string | null;
  salesRevenue: number;
  otherIncome: number;
  expenses: number;
  netResult: number;
};

type StoredUser = {
  id: string;
  username: string;
  role?: string;
};

function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}

export default function FinancePage() {
  const ready = useAuthGuard();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
  });

  const [user, setUser] = useState<StoredUser | null>(null);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, [ready]);

  const isManager = user?.role === "manager";

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/finance/entries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/finance/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!entriesRes.ok || !summaryRes.ok) {
        throw new Error("Erreur lors du chargement des données financières");
      }

      const entriesData = await entriesRes.json();
      const summaryData = await summaryRes.json();
      setEntries(entriesData);
      setSummary({
        ...summaryData,
        from: summaryData.from,
        to: summaryData.to,
      });
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: form.type,
          amount: Number(form.amount),
          category: form.category,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement du mouvement");
      }
      setForm({ type: "income", amount: "", category: "", description: "" });
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const getCategoryBadgeClasses = (entry: FinancialEntry) => {
    const base =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    if (entry.type === "income") {
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100`;
    }
    return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-100`;
  };

  const handleReset = async () => {
    if (!token) return;
    if (!confirm("Réinitialiser toutes les ventes et mouvements financiers ?")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la réinitialisation");
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const startEdit = (entry: FinancialEntry) => {
    setEditingId(entry._id);
    setEditForm({
      type: entry.type,
      amount: String(entry.amount),
      category: entry.category,
      description: entry.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/entries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: editForm.type,
          amount: Number(editForm.amount),
          category: editForm.category,
          description: editForm.description || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du mouvement");
      }
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const deleteEntry = async (id: string) => {
    if (!token) return;
    if (!confirm("Supprimer ce mouvement financier ?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/entries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression du mouvement");
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Finances</h1>
            <p className="text-sm text-slate-500">
              Suivi des ventes, revenus et dépenses de la boutique.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              ← Tableau de bord
            </button>
            {isManager && (
              <button
                onClick={handleReset}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                Réinitialiser les données
              </button>
            )}
          </div>
        </header>

        {summary && (
          <section className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-slate-500">
                Revenus ventes
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {summary.salesRevenue.toFixed(2)} FCFA
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-slate-500">
                Autres entrées
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {summary.otherIncome.toFixed(2)} FCFA
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-slate-500">
                Dépenses
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {summary.expenses.toFixed(2)} FCFA
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-slate-500">
                Résultat net
              </p>
              <p
                className={`mt-2 text-lg font-semibold ${
                  summary.netResult >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {summary.netResult.toFixed(2)} FCFA
              </p>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Ajouter un mouvement financier
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 md:grid-cols-4 md:items-end"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "income" | "expense" })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="income">Entrée</option>
                <option value="expense">Dépense</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Montant
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Catégorie
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Description (optionnel)
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 md:mt-0"
            >
              Enregistrer
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Historique des mouvements
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun mouvement enregistré pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Montant</th>
                    <th className="px-3 py-2">Catégorie</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e._id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === e._id ? (
                          <select
                            value={editForm.type}
                            onChange={(ev) =>
                              setEditForm({
                                ...editForm,
                                type: ev.target.value as "income" | "expense",
                              })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          >
                            <option value="income">Entrée</option>
                            <option value="expense">Dépense</option>
                          </select>
                        ) : e.type === "income" ? (
                          "Entrée"
                        ) : (
                          "Dépense"
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === e._id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(ev) =>
                              setEditForm({ ...editForm, amount: ev.target.value })
                            }
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        ) : (
                          <span
                            className={
                              e.type === "income"
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-rose-700"
                            }
                          >
                            {e.amount.toFixed(2)} FCFA
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === e._id ? (
                          <input
                            value={editForm.category}
                            onChange={(ev) =>
                              setEditForm({ ...editForm, category: ev.target.value })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        ) : (
                          <span className={getCategoryBadgeClasses(e)}>
                            {e.category}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === e._id ? (
                          <input
                            value={editForm.description}
                            onChange={(ev) =>
                              setEditForm({
                                ...editForm,
                                description: ev.target.value,
                              })
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        ) : (
                          e.description || "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === e._id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(e._id)}
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs font-medium text-slate-500 hover:underline"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(e)}
                              className="text-xs font-medium text-brand hover:underline"
                            >
                              Modifier
                            </button>
                            {isManager && (
                              <button
                                onClick={() => deleteEntry(e._id)}
                                className="text-xs font-medium text-red-600 hover:underline"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
