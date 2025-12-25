"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type StoredUser = {
  id: string;
  username: string;
  role?: string;
};

type ProductCategory = {
  _id: string;
  name: string;
  color?: string;
  isActive: boolean;
};

type FinanceCategory = {
  _id: string;
  name: string;
  color?: string;
  isActive: boolean;
};

function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}

export default function CategoriesPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  );
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    color: "",
  });
  const [financeForm, setFinanceForm] = useState({
    name: "",
    color: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const fetchProductCategories = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/product-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Erreur lors du chargement des catégories produits");
    }
    const data = await res.json();
    setProductCategories(data);
  };

  const fetchFinanceCategories = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/finance-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Erreur lors du chargement des catégories financières");
    }
    const data = await res.json();
    setFinanceCategories(data);
  };

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProductCategories(), fetchFinanceCategories()]);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleCreateProductCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !productForm.name.trim()) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/product-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productForm.name.trim(),
          color: productForm.color || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la création de la catégorie produit");
      }
      setProductForm({ name: "", color: "" });
      await fetchProductCategories();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const handleCreateFinanceCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !financeForm.name.trim()) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/finance-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: financeForm.name.trim(),
          color: financeForm.color || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(
          "Erreur lors de la création de la catégorie financière",
        );
      }
      setFinanceForm({ name: "", color: "" });
      await fetchFinanceCategories();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const toggleProductCategoryActive = async (
    category: ProductCategory,
  ): Promise<void> => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch(
        `${API_BASE}/product-categories/${category._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !category.isActive }),
        },
      );
      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour de la catégorie produit");
      }
      await fetchProductCategories();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const toggleFinanceCategoryActive = async (
    category: FinanceCategory,
  ): Promise<void> => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch(
        `${API_BASE}/finance-categories/${category._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !category.isActive }),
        },
      );
      if (!res.ok) {
        throw new Error(
          "Erreur lors de la mise à jour de la catégorie financière",
        );
      }
      await fetchFinanceCategories();
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

  if (user && user.role !== "manager") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Accès réservé au gérant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Gestion des catégories
            </h1>
            <p className="text-sm text-slate-500">
              Centralisez les catégories utilisées pour les produits et les
              mouvements financiers.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Tableau de bord
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Chargement des catégories...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Catégories produits */}
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Catégories de produits
              </h2>
              <form
                onSubmit={handleCreateProductCategory}
                className="mb-3 flex flex-col gap-2 text-xs md:flex-row"
              >
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Couleur (optionnel)
                  </label>
                  <input
                    value={productForm.color}
                    onChange={(e) =>
                      setProductForm({ ...productForm, color: e.target.value })
                    }
                    placeholder="#0ea5e9"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 md:mt-5"
                >
                  Ajouter
                </button>
              </form>
              {productCategories.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aucune catégorie pour le moment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b bg-slate-50 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-1">Nom</th>
                        <th className="px-2 py-1">Couleur</th>
                        <th className="px-2 py-1">Actif</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productCategories.map((c) => (
                        <tr key={c._id} className="border-b last:border-0">
                          <td className="px-2 py-1 text-slate-800">{c.name}</td>
                          <td className="px-2 py-1">
                            {c.color ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-slate-300"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.color}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-[11px] text-slate-700">
                            {c.isActive ? "Oui" : "Non"}
                          </td>
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => toggleProductCategoryActive(c)}
                              className="text-[11px] font-medium text-slate-700 hover:underline"
                            >
                              {c.isActive ? "Désactiver" : "Activer"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Catégories financières */}
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Catégories financières
              </h2>
              <form
                onSubmit={handleCreateFinanceCategory}
                className="mb-3 flex flex-col gap-2 text-xs md:flex-row"
              >
                <div className="flex-1">
                  <label className="mb-1 block font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    value={financeForm.name}
                    onChange={(e) =>
                      setFinanceForm({ ...financeForm, name: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Couleur (optionnel)
                  </label>
                  <input
                    value={financeForm.color}
                    onChange={(e) =>
                      setFinanceForm({ ...financeForm, color: e.target.value })
                    }
                    placeholder="#22c55e"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 md:mt-5"
                >
                  Ajouter
                </button>
              </form>
              {financeCategories.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aucune catégorie pour le moment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b bg-slate-50 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-1">Nom</th>
                        <th className="px-2 py-1">Couleur</th>
                        <th className="px-2 py-1">Actif</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeCategories.map((c) => (
                        <tr key={c._id} className="border-b last:border-0">
                          <td className="px-2 py-1 text-slate-800">{c.name}</td>
                          <td className="px-2 py-1">
                            {c.color ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-slate-300"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.color}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-[11px] text-slate-700">
                            {c.isActive ? "Oui" : "Non"}
                          </td>
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => toggleFinanceCategoryActive(c)}
                              className="text-[11px] font-medium text-slate-700 hover:underline"
                            >
                              {c.isActive ? "Désactiver" : "Activer"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
