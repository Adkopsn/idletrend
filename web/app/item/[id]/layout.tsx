import type { Metadata } from "next";
import type { ReactNode } from "react";

type ItemSeoData = {
  id: number;
  name: string;
  type: string | null;
  iconUrl: string | null;
  history?: Array<{
    priceText: string | null;
  }>;
};

const API_URL =
  process.env.SITEMAP_API_URL ??
  "https://idletrend-api.onrender.com";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

async function getItem(id: string): Promise<ItemSeoData | null> {
  try {
    const response = await fetch(`${API_URL}/api/items/${id}`, {
      next: {
        revalidate: 21600,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ItemSeoData;
  } catch (error) {
    console.error("Item SEO verisi alınamadı:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    return {
      title: "Item Not Found",
      description:
        "The requested Taskbar Hero Steam Market item could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const currentPrice = item.history?.[0]?.priceText ?? null;

  const title = `${item.name} Price & Market History`;

  const description = currentPrice
    ? `View the current Steam Market price of ${item.name} (${currentPrice}), listing count, price history, and Taskbar Hero market trends on IdleTrend.`
    : `View the Steam Market price, listing count, price history, and Taskbar Hero market trends for ${item.name} on IdleTrend.`;

  const imageUrl = item.iconUrl
    ? `https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/360fx360f`
    : undefined;

  return {
    title,
    description,

    alternates: {
      canonical: `/item/${item.id}`,
    },

    openGraph: {
      type: "website",
      url: `https://idletrend.com/item/${item.id}`,
      title: `${title} | IdleTrend`,
      description,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: item.name,
            },
          ]
        : undefined,
    },

    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${title} | IdleTrend`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ItemLayout({
  children,
}: LayoutProps) {
  return children;
}