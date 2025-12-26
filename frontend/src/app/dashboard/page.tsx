"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type StoredUser = {
  id: string;
  username: string;
  role?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
    } else {
      const stored =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
      setReady(true);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.replace("/login");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const role = user?.role;

  const isManager = role === "manager";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-brand bg-white">
                <Image
                  src="/logo-fk-pack-events.jpg"
                  alt="Logo Fk Pack Event's"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Fk Pack Event's
                </h1>
                <p className="text-xs text-slate-500">
                  Tableau de bord de gestion interne
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-3 text-sm text-slate-700">
              {isManager && (
                <>
                  <Link href="/products" className="hover:text-slate-900">
                    Produits
                  </Link>
                  <Link href="/stock" className="hover:text-slate-900">
                    Stock
                  </Link>
                  <Link href="/orders" className="hover:text-slate-900">
                    Commandes à faire
                  </Link>
                </>
              )}
              <Link href="/sales" className="hover:text-slate-900">
                Ventes
              </Link>
              {isManager && (
                <Link href="/finance" className="hover:text-slate-900">
                  Finances
                </Link>
              )}
              {isManager && (
                <>
                  <Link href="/categories" className="hover:text-slate-900">
                    Catégories
                  </Link>
                  <Link href="/admin-users" className="hover:text-slate-900">
                    Admins
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {user && (
                <span>
                  Connecté en tant que <span className="font-semibold">{user.username}</span>
                </span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          {isManager && (
            <>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Produits
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Gérez le catalogue (noms, prix, images) et activez/désactivez les
                  produits.
                </p>
                <Link
                  href="/products"
                  className="mt-3 inline-flex text-xs font-semibold text-slate-900 hover:underline"
                >
                  Accéder à la gestion des produits →
                </Link>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Stock
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Ajustez manuellement le stock et consultez les quantités
                  disponibles.
                </p>
                <Link
                  href="/stock"
                  className="mt-3 inline-flex text-xs font-semibold text-slate-900 hover:underline"
                >
                  Accéder à la gestion des stocks →
                </Link>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Commandes à faire
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Visualisez rapidement les produits en stock faible et préparez
                  vos commandes fournisseurs.
                </p>
                <Link
                  href="/orders"
                  className="mt-3 inline-flex text-xs font-semibold text-slate-900 hover:underline"
                >
                  Voir les produits à commander →
                </Link>
              </div>
            </>
          )}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              Ventes
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Saisissez les ventes et mettez à jour le stock automatiquement.
            </p>
            <Link
              href="/sales"
              className="mt-3 inline-flex text-xs font-semibold text-slate-900 hover:underline"
            >
              Accéder à la gestion des ventes →
            </Link>
          </div>
          {isManager && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-slate-500">
                Finances
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Suivi des ventes, revenus et mouvements financiers.
              </p>
              <Link
                href="/finance"
                className="mt-3 inline-flex text-xs font-semibold text-slate-900 hover:underline"
              >
                Ouvrir le tableau de bord financier →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
