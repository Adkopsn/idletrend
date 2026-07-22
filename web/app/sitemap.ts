import type { MetadataRoute } from "next";

type ApiItem = {
  id: number;
};

type ItemsResponse = {
  items: ApiItem[];
  pagination: {
    page: number;
    totalPages: number;
  };
};

const SITE_URL = "https://idletrend.com";
const API_URL =
  process.env.SITEMAP_API_URL ??
  "https://idletrend-api.onrender.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const itemPages: MetadataRoute.Sitemap = [];

  try {
    let page = 1;
    let totalPages = 1;

    do {
      const response = await fetch(
        `${API_URL}/api/items?page=${page}&limit=100&search=&sort=name`,
        {
          next: {
            revalidate: 21600,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Item listesi alınamadı: HTTP ${response.status}`
        );
      }

      const data = (await response.json()) as ItemsResponse;

      for (const item of data.items ?? []) {
        itemPages.push({
          url: `${SITE_URL}/item/${item.id}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        });
      }

      totalPages = data.pagination?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages);
  } catch (error) {
    console.error("Sitemap itemleri oluşturulamadı:", error);
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...itemPages,
  ];
}