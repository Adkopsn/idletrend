-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "hashName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "classId" TEXT,
    "iconUrl" TEXT,
    "nameColor" TEXT,
    "tradable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" SERIAL NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketRecord" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "priceText" TEXT,
    "salePriceText" TEXT,
    "listings" INTEGER NOT NULL,

    CONSTRAINT "MarketRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_hashName_key" ON "Item"("hashName");

-- CreateIndex
CREATE UNIQUE INDEX "MarketRecord_itemId_snapshotId_key" ON "MarketRecord"("itemId", "snapshotId");

-- AddForeignKey
ALTER TABLE "MarketRecord" ADD CONSTRAINT "MarketRecord_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketRecord" ADD CONSTRAINT "MarketRecord_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
