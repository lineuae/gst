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

type PaymentMethod = "cash" | "wave" | "card";

type Sale = {
  _id: string;
  totalAmount: number;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  username?: string;
  items?: {
    product?: {
      name?: string;
      price?: number;
    };
    quantity: number;
    unitPrice: number;
  }[];
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
  const [salesPeriod, setSalesPeriod] = useState<PeriodKey>("today");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

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
          paymentMethod,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement de la vente");
      }
      setItems([]);
      setPaymentMethod("cash");
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

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatPaymentMethodLabel(method?: PaymentMethod): string {
  if (method === "wave") return "Wave";
  if (method === "card") return "Carte bancaire";
  return "Espèces";
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

  const handleExportSalesCsv = () => {
    if (filteredSales.length === 0) return;
    const headers = ["Date", "Montant total (FCFA)", "Mode de paiement"];
    const dataRows = filteredSales.map((s) => [
      new Date(s.createdAt).toLocaleString(),
      s.totalAmount.toFixed(2),
      s.paymentMethod === "wave"
        ? "Wave"
        : s.paymentMethod === "card"
        ? "Carte bancaire"
        : "Espèces",
    ]);
    downloadCsv("ventes.csv", [headers, ...dataRows]);
  };

  const filteredSalesTotal = filteredSales.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="sales-page-main mx-auto max-w-5xl px-4 py-6">
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
                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="rounded-lg bg-emerald-50 px-4 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                      Total de la vente
                    </p>
                    <p className="text-lg font-bold text-emerald-800">
                      {total.toFixed(2)} FCFA
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-slate-700">
                    <span className="font-medium">Mode de paiement</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`rounded-full px-3 py-1 border text-xs font-medium transition-colors ${
                          paymentMethod === "cash"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Espèces
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wave")}
                        className={`rounded-full px-3 py-1 border text-xs font-medium transition-colors ${
                          paymentMethod === "wave"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Wave
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`rounded-full px-3 py-1 border text-xs font-medium transition-colors ${
                          paymentMethod === "card"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Carte bancaire
                      </button>
                    </div>
                  </div>
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Historique des ventes
            </h2>
            {filteredSales.length > 0 && (
              <button
                onClick={handleExportSalesCsv}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Exporter CSV
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {SALES_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSalesPeriod(opt.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  salesPeriod === opt.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filteredSales.length > 0 && (
            <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-medium text-slate-800">
                {filteredSales.length} vente
                {filteredSales.length > 1 ? "s" : ""}
              </span>{" "}
              sur la période sélectionnée –
              <span className="ml-1 font-semibold text-emerald-700">
                {filteredSalesTotal.toFixed(2)} FCFA
              </span>
              .
            </div>
          )}

          {loadingSales ? (
            <p className="text-sm text-slate-500">Chargement des ventes...</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune vente enregistrée pour le moment.
            </p>
          ) : filteredSales.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune vente pour cette période.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Utilisateur</th>
                    <th className="px-3 py-2">Montant total</th>
                    <th className="px-3 py-2">Mode de paiement</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s, index) => (
                    <tr
                      key={s._id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                            {index + 1}
                          </span>
                          <span>{new Date(s.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {s.username || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-emerald-700">
                        {s.totalAmount.toFixed(2)} FCFA
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {formatPaymentMethodLabel(s.paymentMethod)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReceiptSale(s)}
                            className="text-xs font-medium text-slate-700 hover:underline"
                          >
                            Reçu
                          </button>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteSale(s._id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {receiptSale && (
        <>
          <style jsx global>{`
            @media print {
              @page {
                size: 80mm 210mm;
                margin: 2mm;
              }
              html,
              body {
                margin: 0;
                padding: 0;
                height: auto;
              }
              .min-h-screen {
                min-height: auto !important;
              }
              .sales-page-main {
                display: none !important;
              }
              .receipt-overlay {
                position: static !important;
                inset: auto !important;
                background: transparent !important;
                padding: 0 !important;
                display: block !important;
                align-items: flex-start !important;
                justify-content: flex-start !important;
              }
              .receipt-print {
                position: static !important;
                inset: auto !important;
                max-width: 80mm !important;
                width: 80mm !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                border: 1px solid #000 !important;
                padding: 4mm 3mm 5mm 3mm !important;
                page-break-before: avoid;
                page-break-after: auto;
              }
              .receipt-actions {
                display: none !important;
              }
            }
          `}</style>
          <div className="receipt-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="receipt-print w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="border-b px-4 py-3 text-center">
              <div className="mx-auto mb-1 flex items-center justify-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white">
                  <img
                    src="/logo-fk-pack-events.jpg"
                    alt="FK Pack Event's"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold tracking-wide text-slate-900">
                    FK Pack Event&apos;s
                  </h2>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Reçu de vente
                  </p>
                </div>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-700">
                Dakar HLM 6 nimzatt et Saint-Louis HLM Léona 2 N°312
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-700">
                Tél : 00 221 78 600 05 25 • NINEA : 011397347
              </p>
            </div>
            <div className="px-4 py-3 text-xs text-slate-800">
              <div className="flex justify-between">
                <span className="font-semibold">Date :</span>
                <span className="font-medium">
                  {new Date(receiptSale.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="font-semibold">Vendu par :</span>
                <span className="font-semibold">
                  {receiptSale.username || "-"}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="font-semibold">Mode de paiement :</span>
                <span className="font-semibold">
                  {formatPaymentMethodLabel(receiptSale.paymentMethod)}
                </span>
              </div>
            </div>
            <div className="mx-6 my-2 border-t" />
            <div className="px-4 pb-3 pt-1 text-xs text-slate-800">
              {receiptSale.items && receiptSale.items.length > 0 ? (
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b bg-slate-50 text-[10px] uppercase text-slate-600">
                    <tr>
                      <th className="px-1 py-1 font-semibold">Article</th>
                      <th className="px-1 py-1 text-right font-semibold">Qté</th>
                      <th className="px-1 py-1 text-right font-semibold">PU</th>
                      <th className="px-1 py-1 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptSale.items.map((item, idx) => {
                      const name = item.product?.name || `Article ${idx + 1}`;
                      const unit = item.unitPrice ?? item.product?.price ?? 0;
                      const line = unit * item.quantity;
                      return (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-1 py-1 pr-2 align-top font-medium text-slate-900">
                            {name}
                          </td>
                          <td className="px-1 py-1 text-right font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-1 py-1 text-right font-medium">
                            {unit.toFixed(2)}
                          </td>
                          <td className="px-1 py-1 text-right font-semibold">
                            {line.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Détails de la vente non disponibles.
                </p>
              )}
              <div className="mt-3 border-t pt-2 text-xs">
                <div className="flex justify-between text-slate-900">
                  <span className="font-bold">Total TTC</span>
                  <span className="font-bold">{receiptSale.totalAmount.toFixed(2)} FCFA</span>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-500">
                Merci pour votre confiance et à très bientôt chez FK Pack Event&apos;s.
              </p>
            </div>
            <div className="receipt-actions flex justify-end gap-2 border-t bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={() => setReceiptSale(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Imprimer
              </button>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
