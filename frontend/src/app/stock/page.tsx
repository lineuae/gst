"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
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

export default function StockPage() {
  const ready = useAuthGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, string>>({});
  const [noteByProduct, setNoteByProduct] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les produits");
      }
      const data = await res.json();
      setProducts(data);
      // Charger le stock initial pour chaque produit
      data.forEach((p: Product) => {
        fetchCurrentStock(p._id);
      });
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async (productId: string) => {
    if (!token || !productId) return;
    try {
      const res = await fetch(`${API_BASE}/stock/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger le stock");
      }
      const data = await res.json();
      const value = typeof data === "number" ? data : Number(data);
      setStockByProduct((prev) => ({ ...prev, [productId]: value }));
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  useEffect(() => {
    if (ready) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleAdjust = async (e: FormEvent, productId: string) => {
    e.preventDefault();
    if (!token) return;
    const quantity = quantityByProduct[productId];
    const note = noteByProduct[productId];
    if (!quantity) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/stock/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'ajustement du stock");
      }
      setQuantityByProduct((prev) => ({ ...prev, [productId]: "" }));
      setNoteByProduct((prev) => ({ ...prev, [productId]: "" }));
      await fetchCurrentStock(productId);
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
            <h1 className="text-xl font-semibold text-slate-900">Stock</h1>
            <p className="text-sm text-slate-500">
              Ajustez manuellement le stock des produits.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Tableau de bord
          </button>
        </header>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Produits et stock
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement des produits...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun produit trouvé. Créez d'abord un produit.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((p) => {
                const quantity = quantityByProduct[p._id] ?? "";
                const note = noteByProduct[p._id] ?? "";
                const currentStock = stockByProduct[p._id];
                return (
                  <div
                    key={p._id}
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
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.price.toFixed(2)} FCFA
                          </p>
                        </div>
                        <div className="text-xs text-slate-700">
                          Stock :{" "}
                          {currentStock === undefined ? (
                            <span className="italic text-slate-400">...</span>
                          ) : (
                            <span className="font-semibold">{currentStock}</span>
                          )}
                        </div>
                      </div>
                      <form
                        onSubmit={(e) => handleAdjust(e, p._id)}
                        className="grid gap-2 md:grid-cols-3 md:items-end"
                      >
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-700">
                            Quantité (+ entrée, - sortie)
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                              setQuantityByProduct((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-[10px] font-medium text-slate-700">
                            Note (optionnel)
                          </label>
                          <input
                            value={note}
                            onChange={(e) =>
                              setNoteByProduct((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="mt-1 inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 md:mt-0"
                        >
                          Valider
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
