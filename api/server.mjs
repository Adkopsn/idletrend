import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL bulunamadı.");
}

const PORT = Number(process.env.PORT) || 3001;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      // Tarayıcı dışındaki isteklerde Origin başlığı olmayabilir.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      console.warn(
        `CORS tarafından reddedilen origin: ${origin}`
      );

      callback(
        new Error("Bu origin için CORS izni bulunmuyor.")
      );
    },
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    message: "IdleTrend API çalışıyor.",
  });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check hatası:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const requestedPage = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 25, 1),
      100
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : "name";

    const allowedSorts = new Set([
      "name",
      "price-asc",
      "price-desc",
      "listings-asc",
      "listings-desc",
    ]);

    const safeSort = allowedSorts.has(sort)
      ? sort
      : "name";

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              hashName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              type: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const items = await prisma.item.findMany({
      where,
      include: {
        records: {
          orderBy: {
            snapshot: {
              fetchedAt: "desc",
            },
          },
          take: 1,
          include: {
            snapshot: true,
          },
        },
      },
    });

    const result = items.map((item) => {
      const latestRecord = item.records[0] ?? null;

      return {
        id: item.id,
        hashName: item.hashName,
        name: item.name,
        type: item.type,
        classId: item.classId,
        iconUrl: item.iconUrl,
        nameColor: item.nameColor,
        tradable: item.tradable,
        latestPriceCents:
          latestRecord?.priceCents ?? null,
        latestPriceText:
          latestRecord?.priceText ?? null,
        latestListings:
          latestRecord?.listings ?? null,
        latestFetchedAt:
          latestRecord?.snapshot?.fetchedAt ?? null,
      };
    });

    result.sort((a, b) => {
      if (safeSort === "price-asc") {
        return (
          (a.latestPriceCents ?? 0) -
          (b.latestPriceCents ?? 0)
        );
      }

      if (safeSort === "price-desc") {
        return (
          (b.latestPriceCents ?? 0) -
          (a.latestPriceCents ?? 0)
        );
      }

      if (safeSort === "listings-asc") {
        return (
          (a.latestListings ?? 0) -
          (b.latestListings ?? 0)
        );
      }

      if (safeSort === "listings-desc") {
        return (
          (b.latestListings ?? 0) -
          (a.latestListings ?? 0)
        );
      }

      return a.name.localeCompare(b.name);
    });

    const totalItems = result.length;

    const totalPages = Math.max(
      Math.ceil(totalItems / limit),
      1
    );

    const page = Math.min(
      requestedPage,
      totalPages
    );

    const skip = (page - 1) * limit;

    const paginatedItems = result.slice(
      skip,
      skip + limit
    );

    res.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Item listeleme hatası:", error);

    res.status(500).json({
      error: "Itemler alınamadı.",
    });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Geçersiz item ID.",
      });
    }

    const item = await prisma.item.findUnique({
      where: {
        id,
      },
      include: {
        records: {
          orderBy: {
            snapshot: {
              fetchedAt: "desc",
            },
          },
          include: {
            snapshot: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        error: "Item bulunamadı.",
      });
    }

    res.json({
      id: item.id,
      hashName: item.hashName,
      name: item.name,
      type: item.type,
      classId: item.classId,
      iconUrl: item.iconUrl,
      nameColor: item.nameColor,
      tradable: item.tradable,
      history: item.records.map((record) => ({
        priceCents: record.priceCents,
        priceText: record.priceText,
        listings: record.listings,
        fetchedAt: record.snapshot.fetchedAt,
      })),
    });
  } catch (error) {
    console.error("Item detay hatası:", error);

    res.status(500).json({
      error: "Item detayı alınamadı.",
    });
  }
});

app.get("/api/movers", async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        records: {
          orderBy: {
            snapshot: {
              fetchedAt: "desc",
            },
          },
          take: 2,
          include: {
            snapshot: true,
          },
        },
      },
    });

    const movers = items
      .map((item) => {
        const latest = item.records[0];
        const previous = item.records[1];

        if (!latest || !previous) {
          return null;
        }

        const priceChangeCents =
          latest.priceCents -
          previous.priceCents;

        const priceChangePercent =
          previous.priceCents > 0
            ? (priceChangeCents /
                previous.priceCents) *
              100
            : 0;

        return {
          id: item.id,
          name: item.name,
          iconUrl: item.iconUrl,
          latestPriceText: latest.priceText,
          previousPriceText: previous.priceText,
          priceChangeCents,
          priceChangePercent,
        };
      })
      .filter((item) => item !== null);

    const gainers = [...movers]
      .filter(
        (item) => item.priceChangeCents > 0
      )
      .sort(
        (a, b) =>
          b.priceChangePercent -
          a.priceChangePercent
      )
      .slice(0, 5);

    const losers = [...movers]
      .filter(
        (item) => item.priceChangeCents < 0
      )
      .sort(
        (a, b) =>
          a.priceChangePercent -
          b.priceChangePercent
      )
      .slice(0, 5);

    res.json({
      gainers,
      losers,
    });
  } catch (error) {
    console.error("Movers hatası:", error);

    res.status(500).json({
      error:
        "Yükselen ve düşen itemler alınamadı.",
    });
  }
});

app.get("/api/accumulating", async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit) || 5;
    const limit = Math.min(
      Math.max(requestedLimit, 1),
      20
    );

    const items = await prisma.item.findMany({
      include: {
        records: {
          orderBy: {
            snapshot: {
              fetchedAt: "desc",
            },
          },
          take: 2,
          include: {
            snapshot: true,
          },
        },
      },
    });

    const accumulating = items
      .map((item) => {
        const latest = item.records[0];
        const previous = item.records[1];

        if (
          !latest ||
          !previous ||
          previous.listings <= 0
        ) {
          return null;
        }

        const listingChange =
          latest.listings - previous.listings;

        const listingChangePercent =
          (listingChange / previous.listings) * 100;

        const priceChangeCents =
          latest.priceCents - previous.priceCents;

        const priceChangePercent =
          previous.priceCents > 0
            ? (priceChangeCents /
                previous.priceCents) *
              100
            : 0;

        return {
          id: item.id,
          name: item.name,
          type: item.type,
          iconUrl: item.iconUrl,

          latestPriceCents: latest.priceCents,
          latestPriceText: latest.priceText,
          previousPriceCents: previous.priceCents,
          previousPriceText: previous.priceText,

          latestListings: latest.listings,
          previousListings: previous.listings,
          listingChange,
          listingChangePercent,

          priceChangeCents,
          priceChangePercent,

          latestFetchedAt:
            latest.snapshot.fetchedAt,
          previousFetchedAt:
            previous.snapshot.fetchedAt,
        };
      })
      .filter(
        (item) =>
          item !== null &&
          item.listingChange < 0 &&
          item.listingChangePercent <= -5
      )
      .sort((a, b) => {
        if (
          a.listingChangePercent !==
          b.listingChangePercent
        ) {
          return (
            a.listingChangePercent -
            b.listingChangePercent
          );
        }

        return (
          a.listingChange - b.listingChange
        );
      })
      .slice(0, limit);

    res.json({
      accumulating,
      count: accumulating.length,
      comparison:
        "latest_snapshot_vs_previous_snapshot",
    });
  } catch (error) {
    console.error(
      "Toplanan itemler hatası:",
      error
    );

    res.status(500).json({
      error: "Toplanan itemler alınamadı.",
    });
  }
});

app.use((error, req, res, next) => {
  if (error?.message?.includes("CORS")) {
    return res.status(403).json({
      error: "Bu kaynaktan API erişimine izin verilmiyor.",
    });
  }

  console.error("Beklenmeyen sunucu hatası:", error);

  res.status(500).json({
    error: "Beklenmeyen bir sunucu hatası oluştu.",
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `IdleTrend API çalışıyor: http://localhost:${PORT}`
  );

  console.log(
    `İzin verilen frontend adresleri: ${allowedOrigins.join(
      ", "
    )}`
  );
});

async function shutdown(signal) {
  console.log(
    `\n${signal} alındı. Sunucu kapatılıyor...`
  );

  server.close(async () => {
    await prisma.$disconnect();

    console.log("IdleTrend API kapatıldı.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Sunucu zamanında kapanamadı, zorla kapatılıyor."
    );

    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});