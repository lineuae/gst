"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string; // image du produit
};

type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  productImageUrl?: string; // miniature pour l’UI
};

type Sale = {
  _id: string;
  totalAmount: number;
  createdAt: string;
};

type PeriodKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "all";

const SALES_PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "yesterday", label: "Hier" },
  { key: "this_week", label: "Cette semaine" },
  { key: "this_month", label: "Ce mois" },
  { key: "last_month", label: "Mois dernier" },
  { key: "last_3_months", label: "3 derniers mois" },
  { key: "this_year", label: "Cette année" },
  { key: "all", label: "Tout" },
];

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

export default function SalesPage() {
  const ready = useAuthGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<PeriodKey>("this_month");

  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [user, setUser] = useState<StoredUser | null>(null);

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
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0]._id);
        setUnitPrice(String(data[0].price));
      }
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    if (!token) return;
    setLoadingSales(true);
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les ventes");
      }
      const data = await res.json();
      setSales(data);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchProducts();
      fetchSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const p = products.find((p) => p._id === selectedProductId);
    if (p && !unitPrice) {
      setUnitPrice(String(p.price));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    const p = products.find((p) => p._id === selectedProductId);
    if (!p) return;

    const qty = Number(quantity);
    const price = Number(unitPrice || p.price);
    if (!qty || qty <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        productId: p._id,
        productName: p.name,
        quantity: qty,
        unitPrice: price,
        productImageUrl: (p as any).imageUrl,
      },
    ]);
    setQuantity("1");
    setUnitPrice(String(p.price));
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const handleSaveSale = async () => {
    if (!token || items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement de la vente");
      }
      setItems([]);
      alert("Vente enregistrée et stock mis à jour.");
      await fetchSales();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!token) return;
    if (!confirm("Supprimer cette vente ?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression de la vente");
      }
      await fetchSales();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  function getSalesPeriodRange(period: PeriodKey): { from?: Date; to?: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (period) {
    case "today":
      return { from: startOfToday, to: endOfToday };
    case "yesterday": {
      const y = new Date(startOfToday);
      y.setDate(y.getDate() - 1);
      const yEnd = new Date(endOfToday);
      yEnd.setDate(yEnd.getDate() - 1);
      return { from: y, to: yEnd };
    }
    case "this_week": {
      const day = startOfToday.getDay() || 7; // lundi = 1, dimanche = 7
      const monday = new Date(startOfToday);
      monday.setDate(monday.getDate() - (day - 1));
      return { from: monday, to: endOfToday };
    }
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { from, to };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      return { from, to };
    }
    case "last_3_months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const to = endOfToday;
      return { from, to };
    }
    case "this_year": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(
        now.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999,
      );
      return { from, to };
    }
    case "all":
    default:
      return {};
  }
}

function filterSalesByPeriod(sales: Sale[], period: PeriodKey): Sale[] {
  const range = getSalesPeriodRange(period);
  if (!range.from && !range.to) return sales;
  return sales.filter((s) => {
    const d = new Date(s.createdAt);
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const filteredSales = filterSalesByPeriod(sales, salesPeriod);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Ventes</h1>
            <p className="text-sm text-slate-500">
              Enregistrez les ventes et mettez à jour le stock automatiquement.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Tableau de bord
          </button>
        </header>

        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Ajouter des articles à la vente
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement des produits...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun produit trouvé. Créez d'abord des produits.
            </p>
          ) : (
            <form
              onSubmit={handleAddItem}
              className="grid gap-3 md:grid-cols-3 md:items-end"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Produit
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduct && (
                <div className="md:col-span-3 mt-1 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {(
                    (selectedProduct as any).imageUrl && (
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img
                          src={(selectedProduct as any).imageUrl}
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {selectedProduct.name}
                    </span>
                    <span className="text-xs text-slate-600">
                      Prix actuel : {selectedProduct.price.toFixed(2)} FCFA
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Quantité
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Prix unitaire
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 md:mt-0"
              >
                Ajouter à la vente
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Récapitulatif de la vente
          </h2>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun article ajouté pour l'instant.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Produit</th>
                      <th className="px-3 py-2">Quantité</th>
                      <th className="px-3 py-2">Prix unitaire</th>
                      <th className="px-3 py-2">Total ligne</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="px-3 py-2 text-slate-800">
                          <div className="flex items-center gap-3">
                            {item.productImageUrl && (
                              <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <span>{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            x{item.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                         <span className="font-semibold text-emerald-700">
                           {item.unitPrice.toFixed(2)} FCFA
                         </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                           <span className="font-semibold text-indigo-700">
                             {(item.quantity * item.unitPrice).toFixed(2)} FCFA
                           </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="rounded-lg bg-emerald-50 px-4 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Total de la vente
                  </p>
                  <p className="text-lg font-bold text-emerald-800">
                    {total.toFixed(2)} FCFA
                  </p>
                </div>
                <button
                  onClick={handleSaveSale}
                  disabled={saving}
                 className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer la vente"}
                </button>
              </div>
              
            </>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Historique des ventes
          </h2>
          {loadingSales ? (
            <p className="text-sm text-slate-500">Chargement des ventes...</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune vente enregistrée pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Montant total</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s._id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.totalAmount.toFixed(2)} FCFA
                      </td>
                      <td className="px-3 py-2">
                        {isManager && (
                          <button
                            onClick={() => handleDeleteSale(s._id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
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
