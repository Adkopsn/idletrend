"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: number;
  name: string;
  type: string | null;
  iconUrl: string | null;
  latestPriceCents: number | null;
  latestPriceText: string | null;
  latestListings: number | null;
};

type Mover = {
  id: number;
  name: string;
  iconUrl: string | null;
  latestPriceText: string | null;
  previousPriceText: string | null;
  priceChangeCents: number;
  priceChangePercent: number;
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });

  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch(
      `http://localhost:3001/api/items?page=${page}&limit=25&search=${encodeURIComponent(
        debouncedSearch
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Item verileri alınamadı.");
        }

        return response.json();
      })
      .then((data) => {
        setItems(data.items ?? []);
        setPagination(
          data.pagination ?? {
            page: 1,
            limit: 25,
            totalItems: 0,
            totalPages: 1,
          }
        );
        setLoading(false);
      })
      .catch((error) => {
        console.error("Veriler alınamadı:", error);
        setItems([]);
        setLoading(false);
      });
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetch("http://localhost:3001/api/movers")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Hareket verileri alınamadı.");
        }

        return response.json();
      })
      .then((data) => {
        setGainers(data.gainers ?? []);
        setLosers(data.losers ?? []);
      })
      .catch((error) => {
        console.error("Yükselen ve düşenler alınamadı:", error);
      });
  }, []);

  const filteredItems = [...items]
    .filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "price-asc") {
        return (
          (a.latestPriceCents ?? 0) -
          (b.latestPriceCents ?? 0)
        );
      }

      if (sort === "price-desc") {
        return (
          (b.latestPriceCents ?? 0) -
          (a.latestPriceCents ?? 0)
        );
      }

      if (sort === "listings-desc") {
        return (
          (b.latestListings ?? 0) -
          (a.latestListings ?? 0)
        );
      }

      if (sort === "listings-asc") {
        return (
          (a.latestListings ?? 0) -
          (b.latestListings ?? 0)
        );
      }

      return a.name.localeCompare(b.name);
    });

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">IdleTrend</h1>

        <p className="mt-2 text-zinc-400">
          Steam Market item fiyatları ve ilan bilgileri
        </p>

        <input
          type="text"
          placeholder="Tüm itemlerde ara..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-6 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
        >
          <option value="name">İsme göre</option>
          <option value="price-asc">
            Fiyat: düşükten yükseğe
          </option>
          <option value="price-desc">
            Fiyat: yüksekten düşüğe
          </option>
          <option value="listings-desc">
            İlan: çoktan aza
          </option>
          <option value="listings-asc">
            İlan: azdan çoğa
          </option>
        </select>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">
              En Çok Yükselenler
            </h2>

            {gainers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                Şu an fiyatı yükselen item yok.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {gainers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.id}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      {item.iconUrl ? (
                        <img
                          src={`https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/64fx64f`}
                          alt={item.name}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-800" />
                      )}

                      <div>
                        <p className="font-medium">{item.name}</p>

                        <p className="text-sm text-zinc-400">
                          {item.previousPriceText ?? "-"} →{" "}
                          {item.latestPriceText ?? "-"}
                        </p>
                      </div>
                    </div>

                    <span className="font-semibold text-green-400">
                      +{item.priceChangePercent.toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">
              En Çok Düşenler
            </h2>

            {losers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                Şu an fiyatı düşen item yok.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {losers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.id}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      {item.iconUrl ? (
                        <img
                          src={`https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/64fx64f`}
                          alt={item.name}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-800" />
                      )}

                      <div>
                        <p className="font-medium">{item.name}</p>

                        <p className="text-sm text-zinc-400">
                          {item.previousPriceText ?? "-"} →{" "}
                          {item.latestPriceText ?? "-"}
                        </p>
                      </div>
                    </div>

                    <span className="font-semibold text-red-400">
                      {item.priceChangePercent.toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="mt-10">Veriler yükleniyor...</p>
        ) : (
          <>
            <div className="mt-10 overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-left">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3">Görsel</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Tür</th>
                    <th className="px-4 py-3">Fiyat</th>
                    <th className="px-4 py-3">İlan</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-800 hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3">
                        {item.iconUrl ? (
                          <img
                            src={`https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/64fx64f`}
                            alt={item.name}
                            className="h-12 w-12 rounded-md object-contain"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-zinc-800" />
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/item/${item.id}`}
                          className="hover:text-blue-400"
                        >
                          {item.name}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-zinc-400">
                        {item.type ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        {item.latestPriceText ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        {item.latestListings ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(currentPage - 1, 1)
                  )
                }
                disabled={page <= 1}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Önceki
              </button>

              <p className="text-center text-sm text-zinc-400">
                Sayfa {pagination.page} / {pagination.totalPages}
                {" · "}
                Toplam {pagination.totalItems} item
              </p>

              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(
                      currentPage + 1,
                      pagination.totalPages
                    )
                  )
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}