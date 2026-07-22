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

type AccumulatingItem = {
  id: number;
  name: string;
  type: string | null;
  iconUrl: string | null;
  latestPriceText: string | null;
  previousPriceText: string | null;
  latestListings: number;
  previousListings: number;
  listingChange: number;
  listingChangePercent: number;
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
  const [typeFilter, setTypeFilter] = useState("");
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
  const [accumulating, setAccumulating] = useState<
    AccumulatingItem[]
  >([]);

  const text = translations[language];
  const locale =
    language === "tr" ? "tr-TR" : "en-US";

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(
        "idletrend-language"
      );

    if (
      savedLanguage === "tr" ||
      savedLanguage === "en"
    ) {
      setLanguage(savedLanguage);
      document.documentElement.lang =
        savedLanguage;
      return;
    }

    const browserLanguage =
      window.navigator.language.toLowerCase();

    const initialLanguage: Language =
      browserLanguage.startsWith("tr")
        ? "tr"
        : "en";

    setLanguage(initialLanguage);
    document.documentElement.lang =
      initialLanguage;
  }, []);

  function changeLanguage(
    newLanguage: Language
  ) {
    setLanguage(newLanguage);

    window.localStorage.setItem(
      "idletrend-language",
      newLanguage
    );

    document.documentElement.lang =
      newLanguage;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () =>
      window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);

    fetch(
    `${API_URL}/api/items?page=${page}&limit=25&search=${encodeURIComponent(
  debouncedSearch
)}&sort=${encodeURIComponent(
  sort
)}&type=${encodeURIComponent(typeFilter)}`
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
        console.error(
          "Item data error:",
          error
        );

        setItems([]);
        setLoading(false);
      });
  }, [page, debouncedSearch, sort, typeFilter]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/movers`).then(
        (response) => {
          if (!response.ok) {
            throw new Error(
              "Market movement data could not be retrieved."
            );
          }

          return response.json();
        }
      ),
      fetch(
        `${API_URL}/api/accumulating?limit=5`
      ).then((response) => {
        if (!response.ok) {
          throw new Error(
            "Accumulating item data could not be retrieved."
          );
        }

        return response.json();
      }),
    ])
      .then(
        ([moversData, accumulatingData]) => {
          setGainers(
            moversData.gainers ?? []
          );

          setLosers(
            moversData.losers ?? []
          );

          setAccumulating(
            accumulatingData.accumulating ??
              []
          );
        }
      )
      .catch((error) => {
        console.error(
          "Market overview error:",
          error
        );
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
              onClick={() =>
                changeLanguage("tr")
              }
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
              onClick={() =>
                changeLanguage("en")
              }
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
          placeholder={
            text.searchPlaceholder
          }
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
        <select
  value={typeFilter}
  onChange={(event) => {
    setTypeFilter(event.target.value);
    setPage(1);
  }}
  className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
>
  <option value="">
    {language === "tr" ? "Tüm türler" : "All types"}
  </option>

  <option value="Ring">
    {language === "tr" ? "Yüzükler" : "Rings"}
  </option>

  <option value="Earring">
    {language === "tr" ? "Küpeler" : "Earrings"}
  </option>

  <option value="Amulet">
    {language === "tr" ? "Muskalar" : "Amulets"}
  </option>

  <option value="Gloves">
    {language === "tr" ? "Eldivenler" : "Gloves"}
  </option>

  <option value="Boots">
    {language === "tr" ? "Botlar" : "Boots"}
  </option>

  <option value="Axe">
    {language === "tr" ? "Baltalar" : "Axes"}
  </option>

  <option value="Sword">
    {language === "tr" ? "Kılıçlar" : "Swords"}
  </option>

  <option value="Crossbow">
    {language === "tr" ? "Arbaletler" : "Crossbows"}
  </option>

  <option value="Decoration Material">
    {language === "tr"
      ? "Dekorasyon Malzemeleri"
      : "Decoration Materials"}
  </option>
</select>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <MarketCard
            title={text.topGainers}
            emptyText={text.noGainers}
          >
            {gainers.map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 transition hover:bg-zinc-800"
              >
                <ItemIdentity
                  name={item.name}
                  iconUrl={item.iconUrl}
                  subtitle={`${item.previousPriceText ?? "-"} → ${
                    item.latestPriceText ?? "-"
                  }`}
                />

                <span className="font-semibold text-emerald-400">
                  +
                  {item.priceChangePercent.toFixed(
                    1
                  )}
                  %
                </span>
              </Link>
            ))}
          </MarketCard>

          <MarketCard
            title={text.topLosers}
            emptyText={text.noLosers}
          >
            {losers.map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 transition hover:bg-zinc-800"
              >
                <ItemIdentity
                  name={item.name}
                  iconUrl={item.iconUrl}
                  subtitle={`${item.previousPriceText ?? "-"} → ${
                    item.latestPriceText ?? "-"
                  }`}
                />

                <span className="font-semibold text-red-400">
                  {item.priceChangePercent.toFixed(
                    1
                  )}
                  %
                </span>
              </Link>
            ))}
          </MarketCard>

          <MarketCard
            title={text.topAccumulating}
            emptyText={text.noAccumulating}
          >
            {accumulating.map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-950 p-3 transition hover:bg-zinc-800"
              >
                <ItemIdentity
                  name={item.name}
                  iconUrl={item.iconUrl}
                  subtitle={`${item.previousListings.toLocaleString(
                    locale
                  )} → ${item.latestListings.toLocaleString(
                    locale
                  )} ${text.listings.toLowerCase()}`}
                />

                <div className="text-right">
                  <span className="block font-semibold text-sky-400">
                    {item.listingChangePercent.toFixed(
                      1
                    )}
                    %
                  </span>

                  <span className="text-xs text-zinc-500">
                    {text.listingDrop}
                  </span>
                </div>
              </Link>
            ))}
          </MarketCard>
        </div>

        {loading ? (
          <p className="mt-10">
            {text.loading}
          </p>
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
                        {item.latestPriceText ??
                          "-"}
                      </td>

                      <td className="px-4 py-3">
                        {item.latestListings?.toLocaleString(
                          locale
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
                    Math.max(
                      currentPage - 1,
                      1
                    )
                  )
                }
                disabled={page <= 1}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {text.previous}
              </button>

              <p className="text-center text-sm text-zinc-400">
                {text.page}{" "}
                {pagination.page} /{" "}
                {pagination.totalPages}
                {" · "}
                {text.total}{" "}
                {pagination.totalItems.toLocaleString(
                  locale
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
                  page >=
                  pagination.totalPages
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

type MarketCardProps = {
  title: string;
  emptyText: string;
  children: React.ReactNode;
};

function MarketCard({
  title,
  emptyText,
  children,
}: MarketCardProps) {
  const hasChildren =
    Array.isArray(children)
      ? children.length > 0
      : Boolean(children);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      {hasChildren ? (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">
          {emptyText}
        </p>
      )}
    </section>
  );
}

type ItemIdentityProps = {
  name: string;
  iconUrl: string | null;
  subtitle: string;
};

function ItemIdentity({
  name,
  iconUrl,
  subtitle,
}: ItemIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {iconUrl ? (
        <img
          src={`https://community.cloudflare.steamstatic.com/economy/image/${iconUrl}/64fx64f`}
          alt={name}
          className="h-10 w-10 shrink-0 object-contain"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded bg-zinc-800" />
      )}

      <div className="min-w-0">
        <p className="truncate font-medium">
          {name}
        </p>

        <p className="text-sm text-zinc-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}