import { writeFile } from "node:fs/promises";
const APP_ID = "3678970";
const PAGE_SIZE = 10;
const TOTAL_ITEMS = 742;
const PAGE_STARTS = Array.from(
  { length: Math.ceil(TOTAL_ITEMS / PAGE_SIZE) },
  (_, i) => i * PAGE_SIZE
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelayMs() {
  const min = 5000;
  const max = 8000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

  const startedAt = performance.now();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const responseText = await response.text();

  console.log(
    `Sayfa start=${start} | HTTP ${response.status} | ${elapsedMs} ms`
  );

  if (response.status === 429 || response.status === 403) {
    throw new Error(
      `Steam erişimi sınırladı. HTTP ${response.status}. Test durduruldu.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Steam başarılı yanıt vermedi. HTTP ${response.status}: ` +
        responseText.slice(0, 300)
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Yanıt JSON formatında değil: ${responseText.slice(0, 300)}`
    );
  }

  return data;
}

async function runTest() {
  console.log(
  `IdleTrend tam tarama başlıyor: ${PAGE_STARTS.length} sayfa...\n`
);

  const seenNames = new Set();
  const allItems = [];

  for (let i = 0; i < PAGE_STARTS.length; i += 1) {
    const start = PAGE_STARTS[i];

    try {
      const data = await fetchPage(start);
      const results = data.results ?? [];

      console.log(
        `Başlangıç: ${data.start} | ` +
          `Sayfa boyutu: ${data.pagesize} | ` +
          `Toplam: ${data.total_count} | ` +
          `Gelen: ${results.length}`
      );

      for (const item of results) {
        const uniqueKey = item.hash_name ?? item.name;

        if (seenNames.has(uniqueKey)) {
          console.warn(`Tekrarlanan item bulundu: ${uniqueKey}`);
        }

        seenNames.add(uniqueKey);
        allItems.push({
    name: item.name,
    hashName: item.hash_name,
    listings: item.sell_listings,
    priceCents: item.sell_price,
    priceText: item.sell_price_text,
    salePriceText: item.sale_price_text,
    classId: item.asset_description?.classid,
    type: item.asset_description?.type,
    nameColor: item.asset_description?.name_color,
    iconUrl: item.asset_description?.icon_url,
    tradable: item.asset_description?.tradable === 1,
    });
      }
      await writeFile(
  "./poc/steam-items-progress.json",
  JSON.stringify(allItems, null, 2),
  "utf8"
);

console.log(
  `Ara kayıt yazıldı: ${allItems.length} item`
);
      console.log(
        "İlk 3 item:",
        results.slice(0, 3).map((item) => ({
          isim: item.name,
          fiyat: item.sell_price_text,
          ilan: item.sell_listings,
        }))
      );

      if (i < PAGE_STARTS.length - 1) {
        const delay = randomDelayMs();
        console.log(
          `Sonraki istekten önce ${(delay / 1000).toFixed(1)} saniye bekleniyor...\n`
        );
        await sleep(delay);
      }
    } catch (error) {
      console.error("\nTest durduruldu:");
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
  }

  console.log("\n--- Test Özeti ---");
  console.log(`Toplam çekilen kayıt: ${allItems.length}`);
  console.log(`Benzersiz item sayısı: ${seenNames.size}`);

 if (
  allItems.length === TOTAL_ITEMS &&
  seenNames.size === TOTAL_ITEMS
) {
  console.log(
    `Başarılı: ${TOTAL_ITEMS} item tekrarsız şekilde çekildi.`
  );
} else {
  console.warn(
    `Beklenmeyen sonuç: ${allItems.length} kayıt çekildi, ` +
      `${seenNames.size} benzersiz item bulundu.`
  );
}

await writeFile(
  "./poc/steam-items-full.json",
  JSON.stringify(allItems, null, 2),
  "utf8"
);

console.log("JSON dosyası oluşturuldu: poc/steam-items-full.json");
}
await runTest();
