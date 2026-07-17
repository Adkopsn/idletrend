import { readdir, readFile, writeFile } from "node:fs/promises";

const SNAPSHOT_DIR = "./poc/snapshots";
const files = (await readdir(SNAPSHOT_DIR))
  .filter((file) => file.endsWith(".json"))
  .sort();

if (files.length < 2) {
  throw new Error("Karşılaştırmak için en az 2 snapshot gerekli.");
}

const latestTwo = files.slice(-2);

console.log("Karşılaştırılacak dosyalar:");
console.log(latestTwo);

const [olderFile, newerFile] = latestTwo;

const olderItems = JSON.parse(
  await readFile(`${SNAPSHOT_DIR}/${olderFile}`, "utf8")
);

const newerItems = JSON.parse(
  await readFile(`${SNAPSHOT_DIR}/${newerFile}`, "utf8")
);

console.log(`Eski snapshot: ${olderItems.length} item`);
console.log(`Yeni snapshot: ${newerItems.length} item`);

const olderByHashName = new Map(
  olderItems.map((item) => [item.hashName, item])
);
const changes = [];

for (const newerItem of newerItems) {
  const olderItem = olderByHashName.get(newerItem.hashName);

  if (!olderItem) {
    continue;
  }

  const priceChangeCents =
    newerItem.priceCents - olderItem.priceCents;
    const priceChangePercent =
  olderItem.priceCents === 0
    ? null
    : Number(
        (
          (priceChangeCents / olderItem.priceCents) *
          100
        ).toFixed(2)
      );

  const listingChange =
    newerItem.listings - olderItem.listings;

  changes.push({
    hashName: newerItem.hashName,
    oldPriceCents: olderItem.priceCents,
    newPriceCents: newerItem.priceCents,
    priceChangeCents,
    priceChangePercent,
    oldListings: olderItem.listings,
    newListings: newerItem.listings,
    listingChange,
  });
}

console.log(`Karşılaştırılan item sayısı: ${changes.length}`);

const changedItems = changes.filter(
  (item) =>
    item.priceChangeCents !== 0 ||
    item.listingChange !== 0
);

console.log(`Değişen item sayısı: ${changedItems.length}`);
const priceChangedItems = changes.filter(
  (item) => item.priceChangeCents !== 0
);

const listingChangedItems = changes.filter(
  (item) => item.listingChange !== 0
);

console.log(
  `Fiyatı değişen item sayısı: ${priceChangedItems.length}`
);

console.log(
  `İlan sayısı değişen item sayısı: ${listingChangedItems.length}`
);

const topPriceGainers = changedItems
  .filter((item) => item.priceChangeCents > 0)
  .sort((a, b) => b.priceChangeCents - a.priceChangeCents)
  .slice(0, 10);

console.log("\nEn çok fiyatı yükselen 10 item:");
console.table(topPriceGainers);
const topPriceLosers = changedItems
  .filter((item) => item.priceChangeCents < 0)
  .sort((a, b) => a.priceChangeCents - b.priceChangeCents)
  .slice(0, 10);

console.log("\nEn çok fiyatı düşen 10 item:");
console.table(topPriceLosers);

const topPercentGainers = changedItems
  .filter(
    (item) =>
      item.priceChangePercent !== null &&
      item.priceChangePercent > 0 &&
      item.oldPriceCents >= 10
  )
  .sort(
    (a, b) =>
      b.priceChangePercent - a.priceChangePercent
  )
  .slice(0, 10);

console.log("\nYüzde olarak en çok yükselen 10 item:");
console.table(topPercentGainers);

const topPercentLosers = changedItems
  .filter(
    (item) =>
      item.priceChangePercent !== null &&
      item.priceChangePercent < 0 &&
      item.oldPriceCents >= 10
  )
  .sort(
    (a, b) =>
      a.priceChangePercent - b.priceChangePercent
  )
  .slice(0, 10);

console.log("\nYüzde olarak en çok düşen 10 item:");
console.table(topPercentLosers);
const topListingGainers = listingChangedItems
  .filter((item) => item.listingChange > 0)
  .sort((a, b) => b.listingChange - a.listingChange)
  .slice(0, 10);

console.log("\nİlan sayısı en çok artan 10 item:");
console.table(topListingGainers);

const topListingLosers = listingChangedItems
  .filter((item) => item.listingChange < 0)
  .sort((a, b) => a.listingChange - b.listingChange)
  .slice(0, 10);

console.log("\nİlan sayısı en çok azalan 10 item:");
console.table(topListingLosers);

const comparisonResult = {
  olderSnapshot: olderFile,
  newerSnapshot: newerFile,
  comparedItemCount: changes.length,
  changedItemCount: changedItems.length,
  priceChangedItemCount: priceChangedItems.length,
  listingChangedItemCount: listingChangedItems.length,
  topPriceGainers,
  topPriceLosers,
  topPercentGainers,
  topPercentLosers,
  topListingGainers,
  topListingLosers,
};
await writeFile(
  "./poc/comparison-result.json",
  JSON.stringify(comparisonResult, null, 2),
  "utf8"
);

console.log(
  "Karşılaştırma sonucu oluşturuldu: poc/comparison-result.json"
);