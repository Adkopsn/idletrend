import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadı.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const snapshotsDirectory = path.resolve("poc", "snapshots");

try {
  const files = await readdir(snapshotsDirectory);

  const snapshotFiles = files
    .filter(
      (file) =>
        file.startsWith("steam-items-") &&
        file.endsWith(".json")
    )
    .sort();

  if (snapshotFiles.length < 2) {
    throw new Error(
      "Geçmiş oluşturmak için en az iki snapshot gerekli."
    );
  }

  console.log(
    `${snapshotFiles.length} snapshot dosyası bulundu.`
  );

  console.log("Eski piyasa kayıtları temizleniyor...");

  await prisma.marketRecord.deleteMany();
  await prisma.snapshot.deleteMany();

  for (const filename of snapshotFiles) {
    const fullPath = path.join(
      snapshotsDirectory,
      filename
    );

    const content = await readFile(fullPath, "utf8");
    const items = JSON.parse(content);

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`Atlandı: ${filename}`);
      continue;
    }

    const fetchedAt = items[0]?.fetchedAt
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

    console.log(`Aktarıldı: ${filename}`);
  }

  console.log("Snapshot geçmişi başarıyla yeniden kuruldu.");
} catch (error) {
  console.error("Geçmiş oluşturma hatası:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}