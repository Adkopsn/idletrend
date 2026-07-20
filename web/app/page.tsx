"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  translations,
  type Language,
} from "./translations";

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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://idletrend-api.onrender.com";

export default function Home() {
  const [language, setLanguage] =
    useState<Language>("tr");

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 25,
      totalItems: 0,
      totalPages: 1,
    });

  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);

  const text = translations[language];

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem("idletrend-language");

    if (
      savedLanguage === "tr" ||
      savedLanguage === "en"
    ) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
      return;
    }

    const browserLanguage =
      window.navigator.language.toLowerCase();

    const initialLanguage: Language =
      browserLanguage.startsWith("tr") ? "tr" : "en";

    setLanguage(initialLanguage);
    document.documentElement.lang = initialLanguage;
  }, []);

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);

    window.localStorage.setItem(
      "idletrend-language",
      newLanguage
    );

    document.documentElement.lang = newLanguage;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);

    fetch(
      `${API_URL}/api/items?page=${page}&limit=25&search=${encodeURIComponent(
        debouncedSearch
      )}&sort=${encodeURIComponent(sort)}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Item data could not be retrieved."
          );
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
        console.error("Item data error:", error);
        setItems([]);
        setLoading(false);
      });
  }, [page, debouncedSearch, sort]);

  useEffect(() => {
    fetch(`${API_URL}/api/movers`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Market movement data could not be retrieved."
          );
        }

        return response.json();
      })
      .then((data) => {
        setGainers(data.gainers ?? []);
        setLosers(data.losers ?? []);
      })
      .catch((error) => {
        console.error("Market movers error:", error);
      });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              IdleTrend
            </h1>

            <p className="mt-2 text-zinc-400">
              {text.siteSubtitle}
            </p>
          </div>

          <div
            className="flex w-fit rounded-lg border border-zinc-800 bg-zinc-900 p-1"
            aria-label="Language selector"
          >
            <button
              type="button"
              onClick={() => changeLanguage("tr")}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                language === "tr"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              TR
            </button>

            <button
              type="button"
              onClick={() => changeLanguage("en")}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                language === "en"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </header>

        <input
          type="text"
          placeholder={text.searchPlaceholder}
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="mt-6 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />

        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
        >
          <option value="name">
            {text.sortByName}
          </option>

          <option value="price-asc">
            {text.sortPriceAsc}
          </option>

          <option value="price-desc">
            {text.sortPriceDesc}
          </option>

          <option value="listings-desc">
            {text.sortListingsDesc}
          </option>

          <option value="listings-asc">
            {text.sortListingsAsc}
          </option>
        </select>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">
              {text.topGainers}
            </h2>

            {gainers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                {text.noGainers}
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
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {item.previousPriceText ?? "-"}{" "}
                          →{" "}
                          {item.latestPriceText ?? "-"}
                        </p>
                      </div>
                    </div>

                    <span className="font-semibold text-green-400">
                      +
                      {item.priceChangePercent.toFixed(
                        1
                      )}
                      %
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">
              {text.topLosers}
            </h2>

            {losers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                {text.noLosers}
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
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {item.previousPriceText ?? "-"}{" "}
                          →{" "}
                          {item.latestPriceText ?? "-"}
                        </p>
                      </div>
                    </div>

                    <span className="font-semibold text-red-400">
                      {item.priceChangePercent.toFixed(
                        1
                      )}
                      %
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="mt-10">{text.loading}</p>
        ) : (
          <>
            <div className="mt-10 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3">
                      {text.image}
                    </th>

                    <th className="px-4 py-3">
                      {text.item}
                    </th>

                    <th className="px-4 py-3">
                      {text.type}
                    </th>

                    <th className="px-4 py-3">
                      {text.price}
                    </th>

                    <th className="px-4 py-3">
                      {text.listings}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
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
                        {item.latestListings?.toLocaleString(
                          language === "tr"
                            ? "tr-TR"
                            : "en-US"
                        ) ?? "-"}
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
                {text.previous}
              </button>

              <p className="text-center text-sm text-zinc-400">
                {text.page} {pagination.page} /{" "}
                {pagination.totalPages}
                {" · "}
                {text.total}{" "}
                {pagination.totalItems.toLocaleString(
                  language === "tr"
                    ? "tr-TR"
                    : "en-US"
                )}{" "}
                {text.items}
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
                disabled={
                  page >= pagination.totalPages
                }
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {text.next}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}