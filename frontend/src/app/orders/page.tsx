"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type StoredUser = {
  id: string;
  username: string;
  role?: string;
};

type LowStockProduct = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  stock: number;
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

function getSeverity(stock: number): {
  label: string;
  pillClass: string;
} {
  if (stock <= 0) {
    return {
      label: "Rupture immédiate",
      pillClass:
        "bg-red-50 text-red-700 ring-1 ring-red-100",
    };
  }
  if (stock <= 3) {
    return {
      label: "Stock critique",
      pillClass:
        "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    };
  }
  if (stock <= 10) {
    return {
      label: "Stock faible",
      pillClass:
        "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    };
  }
  return {
    label: "Stock confortable",
    pillClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  };
}

function getSuggestedQuantity(stock: number): number {
  const target = 30; // objectif simple : remonter à ~30 unités
  return stock >= target ? 0 : target - stock;
}

export default function OrdersPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!ready) return;
    const fetchLowStock = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/stock/low-stock`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Impossible de charger les produits en rupture");
        }
        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

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
          <p className="text-sm text-slate-600">Accès réservé au gérant.</p>
        </div>
      </div>
    );
  }

  const totalToOrder = products.reduce(
    (sum, p) => sum + getSuggestedQuantity(p.stock),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Commandes à faire
            </h1>
            <p className="text-sm text-slate-500">
              Liste des produits en stock faible (entre 0 et 10 unités) à
              recommander.
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

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium uppercase text-slate-500">
              Produits à commander
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {products.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium uppercase text-slate-500">
              Ruptures immédiates (0)
            </p>
            <p className="mt-1 text-lg font-semibold text-red-600">
              {products.filter((p) => p.stock <= 0).length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium uppercase text-slate-500">
              Quantité suggérée totale
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {totalToOrder} u.
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Détail des produits à commander
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">
              Chargement des produits en stock faible...
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun produit à commander pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const severity = getSeverity(p.stock);
                const suggested = getSuggestedQuantity(p.stock);
                return (
                  <div
                    key={p.productId}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    {p.imageUrl && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="text-[11px] text-slate-500">
                              {p.description}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-600">
                            Prix : {p.price.toFixed(2)} FCFA
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-700">
                          <p>
                            Stock actuel :
                            <span className="ml-1 font-semibold">
                              {p.stock}
                            </span>
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${severity.pillClass}`}
                          >
                            {severity.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-700">
                        <span>
                          Suggestion de commande :
                          <span className="ml-1 font-semibold">
                            {suggested} u.
                          </span>
                        </span>
                        <div className="flex gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => router.push("/stock")}
                            className="rounded-full border border-slate-300 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Ajuster le stock
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
