export type Language = "tr" | "en";

export const translations = {
  tr: {
    siteSubtitle: "Steam Market item fiyatları ve ilan bilgileri",
    searchPlaceholder: "Tüm itemlerde ara...",

    sortByName: "İsme göre",
    sortPriceAsc: "Fiyat: düşükten yükseğe",
    sortPriceDesc: "Fiyat: yüksekten düşüğe",
    sortListingsDesc: "İlan: çoktan aza",
    sortListingsAsc: "İlan: azdan çoğa",

    topGainers: "En Çok Yükselenler",
    topLosers: "En Çok Düşenler",
    noGainers: "Şu an fiyatı yükselen item yok.",
    noLosers: "Şu an fiyatı düşen item yok.",

    image: "Görsel",
    item: "Item",
    type: "Tür",
    price: "Fiyat",
    listings: "İlan",

    loading: "Veriler yükleniyor...",
    previous: "← Önceki",
    next: "Sonraki →",
    page: "Sayfa",
    total: "Toplam",
    items: "item",

    backHome: "← Ana sayfaya dön",
    itemNotFound: "Item bulunamadı.",
    itemLoadError: "Item detayı yüklenemedi.",
    noTypeInformation: "Tür bilgisi yok",

    currentPrice: "Güncel fiyat",
    currentListings: "Güncel ilan",
    latestChange: "Son değişim",

    tradeStatus: "Takas durumu",
    tradable: "Takas edilebilir",
    notTradable: "Takas edilemez",

    priceAndListingHistory: "Fiyat ve İlan Geçmişi",
    snapshotRecords: "Steam Market snapshot kayıtları",
    insufficientHistory:
      "Grafik için yeterli geçmiş verisi yok.",

    historyRecords: "Geçmiş Kayıtlar",
    date: "Tarih",
    change: "Değişim",
  },

  en: {
    siteSubtitle: "Steam Market item prices and listing data",
    searchPlaceholder: "Search all items...",

    sortByName: "Sort by name",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    sortListingsDesc: "Listings: high to low",
    sortListingsAsc: "Listings: low to high",

    topGainers: "Top Gainers",
    topLosers: "Top Losers",
    noGainers: "No items are currently gaining in price.",
    noLosers: "No items are currently dropping in price.",

    image: "Image",
    item: "Item",
    type: "Type",
    price: "Price",
    listings: "Listings",

    loading: "Loading data...",
    previous: "← Previous",
    next: "Next →",
    page: "Page",
    total: "Total",
    items: "items",

    backHome: "← Back to home",
    itemNotFound: "Item not found.",
    itemLoadError: "Item details could not be loaded.",
    noTypeInformation: "No type information",

    currentPrice: "Current price",
    currentListings: "Current listings",
    latestChange: "Latest change",

    tradeStatus: "Trade status",
    tradable: "Tradable",
    notTradable: "Not tradable",

    priceAndListingHistory: "Price and Listing History",
    snapshotRecords: "Steam Market snapshot records",
    insufficientHistory:
      "There is not enough historical data for the chart.",

    historyRecords: "Historical Records",
    date: "Date",
    change: "Change",
  },
} as const;