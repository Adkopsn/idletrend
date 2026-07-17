import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

const APP_ID = "3678970";
const PAGE_SIZE = 10;
const PAGE_DELAY_MS = 7_000;
const PAGE_DELAY_JITTER_MS = 2_000;
const MAX_RETRIES = 3;

const snapshotsDirectory = path.resolve(
  "poc",
  "snapshots"
);

const sleep = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

function getPageDelay() {
  return (
    PAGE_DELAY_MS +
    Math.floor(Math.random() * PAGE_DELAY_JITTER_MS)
  );
}

function createSnapshotFilename(date) {
  const timestamp = date
    .toISOString()
    .replaceAll(":", "-");

  return `steam-items-${timestamp}.json`;
}

function normalizeItem(result, fetchedAt) {
  const description = result.asset_description ?? {};

  return {
    hashName:
      result.hash_name ??
      result.name ??
      description.market_hash_name ??
      description.name ??
      "Unknown Item",

    name:
      result.name ??
      description.name ??
      result.hash_name ??
      "Unknown Item",

    type: description.type ?? null,

    classId:
      description.classid != null
        ? String(description.classid)
        : null,

    iconUrl:
      description.icon_url_large ??
      description.icon_url ??
      null,

    nameColor:
      description.name_color ?? null,

    tradable:
      description.tradable == null
        ? null
        : Boolean(Number(description.tradable)),

    priceCents:
      Number.isFinite(Number(result.sell_price))
        ? Number(result.sell_price)
        : 0,

    priceText:
      result.sell_price_text ?? null,

    salePriceText:
      result.sale_price_text ?? null,

    listings:
      Number.isFinite(Number(result.sell_listings))
        ? Number(result.sell_listings)
        : 0,

    fetchedAt: fetchedAt.toISOString(),
  };
}

async function fetchPage(start) {
  const params = new URLSearchParams({
    query: "",
    start: String(start),
    count: String(PAGE_SIZE),
    search_descriptions: "0",
    sort_column: "name",
    sort_dir: "asc",
    appid: APP_ID,
    norender: "1",
  });

  const url =
    `https://steamcommunity.com/market/search/render/?${params.toString()}`;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt += 1
  ) {
    try {
      const startedAt = performance.now();

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 IdleTrend Market Tracker",
        },
        signal: AbortSignal.timeout(20_000),
      });

      const elapsedMs = Math.round(
        performance.now() - startedAt
      );

      const responseText = await response.text();

      console.log(
        `Sayfa start=${start} | HTTP ${response.status} | ` +
          `${elapsedMs} ms | Deneme ${attempt}/${MAX_RETRIES}`
      );

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) {
          throw new Error(
            "Steam rate limit uyguladı. HTTP 429. " +
              "Tüm yeniden denemeler başarısız."
          );
        }

        const retryDelays = [
          2 * 60_000,
          5 * 60_000,
        ];

        const retryDelay =
          retryDelays[attempt - 1] ??
          5 * 60_000;

        console.warn(
          `Steam rate limit uyguladı. ${
            retryDelay / 60_000
          } dakika beklenecek...`
        );

        await sleep(retryDelay);
        continue;
      }

      if (response.status === 403) {
        throw new Error(
          "Steam erişimi engelledi. HTTP 403. " +
            "İşlem durduruldu."
        );
      }

      const retryableStatuses = [
        500,
        502,
        503,
        504,
      ];

      if (
        retryableStatuses.includes(response.status)
      ) {
        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Steam geçici sunucu hatası verdi. ` +
              `HTTP ${response.status}.`
          );
        }

        const retryDelay = attempt * 30_000;

        console.warn(
          `Geçici sunucu hatası. ${
            retryDelay / 1000
          } saniye sonra tekrar denenecek...`
        );

        await sleep(retryDelay);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Steam başarılı yanıt vermedi. ` +
            `HTTP ${response.status}: ` +
            responseText.slice(0, 300)
        );
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Steam yanıtı geçerli JSON değil."
        );
      }

      if (data.success !== true) {
        throw new Error(
          "Steam yanıtı başarısız olarak işaretlendi."
        );
      }

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const accessBlocked =
        message.includes("HTTP 403");

      const rateLimitFinished =
        message.includes(
          "Tüm yeniden denemeler başarısız"
        );

      if (
        accessBlocked ||
        rateLimitFinished ||
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      const retryDelay = attempt * 30_000;

      console.warn(`İstek hatası: ${message}`);

      console.warn(
        `${retryDelay / 1000} saniye sonra tekrar denenecek...`
      );

      await sleep(retryDelay);
    }
  }

  throw new Error("Sayfa çekilemedi.");
}

async function main() {
  const fetchedAt = new Date();

  await mkdir(snapshotsDirectory, {
    recursive: true,
  });

  console.log("Steam Market verisi çekiliyor...");
  console.log(`App ID: ${APP_ID}`);

  const firstPage = await fetchPage(0);

  const totalCount = Number(
    firstPage.total_count ?? 0
  );

  if (!totalCount) {
    throw new Error(
      "Steam toplam item sayısını döndürmedi."
    );
  }

  console.log(
    `Toplam ${totalCount} item bulundu.`
  );

  const allResults = [
    ...(firstPage.results ?? []),
  ];

  const totalPages = Math.ceil(
    totalCount / PAGE_SIZE
  );

  console.log(
    `Toplam ${totalPages} sayfa çekilecek.`
  );

  for (
    let start = PAGE_SIZE;
    start < totalCount;
    start += PAGE_SIZE
  ) {
    const pageDelay = getPageDelay();

    console.log(
      `Sonraki istek için yaklaşık ${
        pageDelay / 1000
      } saniye bekleniyor...`
    );

    await sleep(pageDelay);

    const page = await fetchPage(start);

    if (Array.isArray(page.results)) {
      allResults.push(...page.results);
    }

    const currentPage =
      Math.floor(start / PAGE_SIZE) + 1;

    console.log(
      `İlerleme: ${currentPage}/${totalPages} sayfa | ` +
        `${allResults.length}/${totalCount} item`
    );
  }

  const uniqueItems = new Map();

  for (const result of allResults) {
    const item = normalizeItem(
      result,
      fetchedAt
    );

    uniqueItems.set(item.hashName, item);
  }

  const items = [...uniqueItems.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name, "en")
  );

  if (items.length === 0) {
    throw new Error(
      "Steam sonucundan item oluşturulamadı."
    );
  }

  const snapshotFilename =
    createSnapshotFilename(fetchedAt);

  const snapshotPath = path.join(
    snapshotsDirectory,
    snapshotFilename
  );

  const fullJsonPath = path.resolve(
    "poc",
    "steam-items-full.json"
  );

  const jsonContent = JSON.stringify(
    items,
    null,
    2
  );

  await writeFile(
    snapshotPath,
    jsonContent,
    "utf8"
  );

  await writeFile(
    fullJsonPath,
    jsonContent,
    "utf8"
  );

  console.log("");
  console.log(
    `${items.length} benzersiz item kaydedildi.`
  );

  console.log(
    `Yeni snapshot: ${snapshotPath}`
  );

  console.log(
    `Güncel tam veri: ${fullJsonPath}`
  );
}

main().catch((error) => {
  console.error("");

  console.error(
    "Steam Market veri çekme hatası:",
    error
  );

  process.exitCode = 1;
});