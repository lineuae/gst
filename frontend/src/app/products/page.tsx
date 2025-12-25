"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  categoryId?: string;
  isActive: boolean;
};

type ProductCategory = {
  _id: string;
  name: string;
  color?: string;
  isActive: boolean;
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

export default function ProductsPage() {
  const ready = useAuthGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: "",
    categoryId: "",
    isActive: true,
  });

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les produits");
      }
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/product-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les catégories");
      }
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      // On ne bloque pas la page produits si les catégories échouent
      console.error(err);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchProducts();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      let imageUrl: string | undefined = undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });
        if (!uploadRes.ok) {
          throw new Error("Erreur lors de l'upload de l'image");
        }
        const uploadData = await uploadRes.json();
        imageUrl = `${API_BASE}${uploadData.imagePath}`;
      }
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          imageUrl,
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la création du produit");
      }
      setForm({ name: "", price: "", description: "", categoryId: "" });
      setImageFile(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Erreur inconnue");
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      imageUrl: product.imageUrl || "",
      description: product.description || "",
       categoryId: product.categoryId || "",
      isActive: product.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (product: Product) => {
    if (!token) return;
    setError(null);
    try {
      let imageUrl: string | undefined = product.imageUrl;
      if (editImageFile) {
        const fd = new FormData();
        fd.append("file", editImageFile);
        const uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });
        if (!uploadRes.ok) {
          throw new Error("Erreur lors de l'upload de la nouvelle image");
        }
        const uploadData = await uploadRes.json();
        imageUrl = `${API_BASE}${uploadData.imagePath}`;
      }
      const res = await fetch(`${API_BASE}/products/${product._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          price: Number(editForm.price),
          imageUrl,
          description: editForm.description || undefined,
          categoryId: editForm.categoryId || undefined,
          isActive: editForm.isActive,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du produit");
      }
      setEditingId(null);
      setEditImageFile(null);
      await fetchProducts();
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
            <h1 className="text-xl font-semibold text-slate-900">
              Produits
            </h1>
            <p className="text-sm text-slate-500">
              Gérez le catalogue de la boutique.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Tableau de bord
          </button>
        </header>

        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Ajouter un produit
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 md:grid-cols-4 md:items-end"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nom
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Prix
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Catégorie (optionnel)
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">Aucune</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Photo du produit (optionnel)
              </label>
              <input
                id="product-image-file"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(
                    e.target.files && e.target.files[0]
                      ? e.target.files[0]
                      : null,
                  )
                }
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(
                    "product-image-file",
                  ) as HTMLInputElement | null;
                  input?.click();
                }}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Choisir une image…
              </button>
              <p className="mt-1 text-xs text-slate-500">
                {imageFile
                  ? `Fichier sélectionné : ${imageFile.name}`
                  : "Aucun fichier sélectionné"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Formats acceptés : JPG, PNG – max 5 Mo.
              </p>
            </div>
            <div className="md:col-span-2">
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
              Ajouter
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
            Liste des produits
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun produit pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2">Prix</th>
                    <th className="px-3 py-2">Actif</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-slate-800">
                        <div className="flex items-center gap-3">
                          {p.imageUrl && (
                            <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            {editingId === p._id ? (
                              <input
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, name: e.target.value })
                                }
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                              />
                            ) : (
                              <span>{p.name}</span>
                            )}
                            {!editingId &&
                              p.categoryId &&
                              (() => {
                                const cat = categories.find(
                                  (c) => c._id === p.categoryId,
                                );
                                if (!cat) return null;
                                return (
                                  <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                    {cat.name}
                                  </span>
                                );
                              })()}
                            {editingId === p._id && (
                              <select
                                value={editForm.categoryId}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    categoryId: e.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                              >
                                <option value="">Aucune catégorie</option>
                                {categories.map((c) => (
                                  <option key={c._id} value={c._id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            )}
                            {editingId === p._id && (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setEditImageFile(
                                    e.target.files && e.target.files[0]
                                      ? e.target.files[0]
                                      : null,
                                  )
                                }
                                className="mt-1 w-full text-xs text-slate-700"
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === p._id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({ ...editForm, price: e.target.value })
                            }
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          />
                        ) : (
                          <span>{p.price.toFixed(2)} FCFA</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingId === p._id ? (
                          <select
                            value={editForm.isActive ? "true" : "false"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                isActive: e.target.value === "true",
                              })
                            }
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          >
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        ) : p.isActive ? (
                          "Oui"
                        ) : (
                          "Non"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === p._id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(p)}
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startEdit(p)}
                              className="text-xs font-medium text-brand hover:underline"
                            >
                              Modifier
                            </button>
                            {isManager && (
                              <button
                                onClick={() => handleDelete(p._id)}
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
