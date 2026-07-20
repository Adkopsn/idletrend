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
  },
} as const;