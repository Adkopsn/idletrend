"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  translations,
  type Language,
} from "../../translations";

type HistoryRecord = {
  priceCents: number;
  priceText: string | null;
  listings: number;
  fetchedAt: string;
};

type ItemDetail = {
  id: number;
  name: string;
  type: string | null;
  iconUrl: string | null;
  tradable: boolean | null;
  history: HistoryRecord[];
};

type TooltipPayloadItem = {
  name?: string;
  value?: number;
  dataKey?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  language: Language;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://idletrend-api.onrender.com";

function ChartTooltip({
  active,
  label,
  payload,
  language,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const text = translations[language];
  const locale =
    language === "tr" ? "tr-TR" : "en-US";

  const price = payload.find(
    (item) => item.dataKey === "price"
  )?.value;

  const listings = payload.find(
    (item) => item.dataKey === "listings"
  )?.value;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm text-zinc-400">
        {label}
      </p>

      <p className="text-sm">
        {text.price}:{" "}
        <span className="font-semibold text-emerald-400">
          {typeof price === "number"
            ? `$${price.toFixed(2)}`
            : "-"}
        </span>
      </p>

      <p className="mt-1 text-sm">
        {text.listings}:{" "}
        <span className="font-semibold text-sky-400">
          {typeof listings === "number"
            ? listings.toLocaleString(locale)
            : "-"}
        </span>
      </p>
    </div>
  );
}

export default function ItemDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [language, setLanguage] =
    useState<Language>("tr");

  const [item, setItem] =
    useState<ItemDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");

    fetch(`${API_URL}/api/items/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Item details could not be retrieved."
          );
        }

        return response.json();
      })
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((fetchError) => {
        console.error(
          "Item details error:",
          fetchError
        );

        setError("item-load-error");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-zinc-400">
            {text.loading}
          </p>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {text.backHome}
            </Link>

            <LanguageSelector
              language={language}
              onChange={changeLanguage}
            />
          </div>

          <p className="mt-8 text-red-400">
            {error
              ? text.itemLoadError
              : text.itemNotFound}
          </p>
        </div>
      </main>
    );
  }

  const latest = item.history[0] ?? null;
  const previous = item.history[1] ?? null;

  const priceChangeCents =
    latest && previous
      ? latest.priceCents -
        previous.priceCents
      : 0;

  const priceChangePercent =
    previous && previous.priceCents > 0
      ? (priceChangeCents /
          previous.priceCents) *
        100
      : 0;

  const chartData = [...item.history]
    .reverse()
    .map((record) => ({
      date: new Date(
        record.fetchedAt
      ).toLocaleString(locale, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: record.priceCents / 100,
      listings: record.listings,
    }));

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            {text.backHome}
          </Link>

          <LanguageSelector
            language={language}
            onChange={changeLanguage}
          />
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-44 w-full items-center justify-center rounded-xl bg-zinc-950 sm:w-44">
              {item.iconUrl ? (
                <img
                  src={`https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/256fx256f`}
                  alt={item.name}
                  className="h-36 w-36 object-contain"
                />
              ) : (
                <div className="h-32 w-32 rounded-lg bg-zinc-800" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {item.name}
              </h1>

              <p className="mt-2 text-zinc-400">
                {item.type ??
                  text.noTypeInformation}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">
                    {text.currentPrice}
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {latest?.priceText ?? "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">
                    {text.currentListings}
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {latest
                      ? latest.listings.toLocaleString(
                          locale
                        )
                      : "-"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">
                    {text.latestChange}
                  </p>

                  <p
                    className={`mt-1 text-xl font-semibold ${
                      priceChangePercent > 0
                        ? "text-emerald-400"
                        : priceChangePercent < 0
                          ? "text-red-400"
                          : "text-zinc-300"
                    }`}
                  >
                    {priceChangePercent > 0
                      ? "+"
                      : ""}
                    {priceChangePercent.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-400">
                {text.tradeStatus}:{" "}
                <span className="font-medium text-zinc-200">
                  {item.tradable
                    ? text.tradable
                    : text.notTradable}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {text.priceAndListingHistory}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {text.snapshotRecords}
            </p>
          </div>

          {chartData.length < 2 ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-zinc-950 px-5 text-center text-zinc-400">
              {text.insufficientHistory}
            </div>
          ) : (
            <div className="h-80 w-full sm:h-96">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    stroke="#3f3f46"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#a1a1aa"
                    tick={{
                      fill: "#a1a1aa",
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />

                  <YAxis
                    yAxisId="price"
                    stroke="#34d399"
                    tick={{
                      fill: "#a1a1aa",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `$${Number(value).toFixed(
                        2
                      )}`
                    }
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />

                  <YAxis
                    yAxisId="listings"
                    orientation="right"
                    stroke="#38bdf8"
                    tick={{
                      fill: "#a1a1aa",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      Number(
                        value
                      ).toLocaleString(locale)
                    }
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />

                  <Tooltip
                    content={
                      <ChartTooltip
                        language={language}
                      />
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      paddingTop: "16px",
                    }}
                  />

                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    name={text.price}
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#34d399",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                    connectNulls
                  />

                  <Line
                    yAxisId="listings"
                    type="monotone"
                    dataKey="listings"
                    name={text.listings}
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#38bdf8",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="bg-zinc-900 px-5 py-4">
            <h2 className="text-lg font-semibold">
              {text.historyRecords}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-5 py-3 text-sm text-zinc-400">
                    {text.date}
                  </th>

                  <th className="px-5 py-3 text-sm text-zinc-400">
                    {text.price}
                  </th>

                  <th className="px-5 py-3 text-sm text-zinc-400">
                    {text.listings}
                  </th>

                  <th className="px-5 py-3 text-sm text-zinc-400">
                    {text.change}
                  </th>
                </tr>
              </thead>

              <tbody>
                {item.history.map(
                  (record, index) => {
                    const olderRecord =
                      item.history[
                        index + 1
                      ] ?? null;

                    const change =
                      olderRecord &&
                      olderRecord.priceCents >
                        0
                        ? ((record.priceCents -
                            olderRecord.priceCents) /
                            olderRecord.priceCents) *
                          100
                        : 0;

                    return (
                      <tr
                        key={`${record.fetchedAt}-${record.priceCents}-${record.listings}`}
                        className="border-t border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900"
                      >
                        <td className="px-5 py-4 text-sm text-zinc-400">
                          {new Date(
                            record.fetchedAt
                          ).toLocaleString(
                            locale
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {record.priceText ??
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          {record.listings.toLocaleString(
                            locale
                          )}
                        </td>

                        <td
                          className={`px-5 py-4 font-medium ${
                            change > 0
                              ? "text-emerald-400"
                              : change < 0
                                ? "text-red-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {olderRecord
                            ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
                            : "-"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

type LanguageSelectorProps = {
  language: Language;
  onChange: (language: Language) => void;
};

function LanguageSelector({
  language,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div
      className="flex w-fit rounded-lg border border-zinc-800 bg-zinc-900 p-1"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => onChange("tr")}
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
        onClick={() => onChange("en")}
        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
          language === "en"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
