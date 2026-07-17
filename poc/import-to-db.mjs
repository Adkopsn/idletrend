import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL .env dosyasında bulunamadı.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const snapshotsDirectory = path.resolve("poc", "snapshots");

async function findLatestSnapshot() {
  const files = await readdir(snapshotsDirectory);

  const snapshotFiles = files
    .filter(
      (file) =>
        file.startsWith("steam-items-") &&
        file.endsWith(".json")
    )
    .sort()
    .reverse();

  if (snapshotFiles.length === 0) {
    throw new Error("İçe aktarılacak snapshot bulunamadı.");
  }

  return path.join(snapshotsDirectory, snapshotFiles[0]);
}

try {
  const latestSnapshotPath = await findLatestSnapshot();

  console.log(
    `İçe aktarılan snapshot: ${path.basename(latestSnapshotPath)}`
  );

  const fileContent = await readFile(latestSnapshotPath, "utf8");
  const items = JSON.parse(fileContent);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Snapshot dosyasında item bulunamadı.");
  }

  const fetchedAt =
    items[0]?.fetchedAt
      ? new Date(items[0].fetchedAt)
      : new Date();

  const snapshot = await prisma.snapshot.create({
    data: {
      fetchedAt,
    },
  });

  for (const item of items) {
    const savedItem = await prisma.item.upsert({
      where: {
        hashName: item.hashName,
      },
      update: {
        name: item.name,
        type: item.type ?? null,
        classId: item.classId ?? null,
        iconUrl: item.iconUrl ?? null,
        nameColor: item.nameColor ?? null,
        tradable: item.tradable ?? null,
      },
      create: {
        hashName: item.hashName,
        name: item.name,
        type: item.type ?? null,
        classId: item.classId ?? null,
        iconUrl: item.iconUrl ?? null,
        nameColor: item.nameColor ?? null,
        tradable: item.tradable ?? null,
      },
    });

    await prisma.marketRecord.create({
      data: {
        itemId: savedItem.id,
        snapshotId: snapshot.id,
        priceCents: item.priceCents ?? 0,
        priceText: item.priceText ?? null,
        salePriceText: item.salePriceText ?? null,
        listings: item.listings ?? 0,
      },
    });
  }

  console.log(`${items.length} item veritabanına aktarıldı.`);
} catch (error) {
  console.error("Aktarım hatası:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}