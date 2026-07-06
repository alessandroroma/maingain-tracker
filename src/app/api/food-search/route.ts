import { NextResponse } from "next/server";

interface OffNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal_100g"?: number;
  proteins_serving?: number;
  proteins_100g?: number;
  carbohydrates_serving?: number;
  carbohydrates_100g?: number;
  fat_serving?: number;
  fat_100g?: number;
}

interface OffProduct {
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  nutriments?: OffNutriments;
}

const UA = { "User-Agent": "MaingainTracker/1.0 (personal recomp tracker)" };
const FIELDS = "product_name,brands,serving_size,nutriments";

async function fetchProducts(q: string): Promise<OffProduct[]> {
  // Primary: search-a-licious (fast, reliable)
  try {
    const res = await fetch(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=12&fields=${FIELDS}`,
      { headers: UA, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.hits)) return data.hits;
    }
  } catch {
    // fall through to legacy endpoint
  }

  // Fallback: legacy search API
  const res = await fetch(
    "https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1" +
      `&search_terms=${encodeURIComponent(q)}&page_size=12&fields=${FIELDS}`,
    { headers: UA, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Food database returned ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const products = await fetchProducts(q);

    const results = products
      .map((p) => {
        const n = p.nutriments || {};
        // Prefer per-serving values; fall back to per-100g
        const perServing = n["energy-kcal_serving"] != null;
        const calories = perServing ? n["energy-kcal_serving"] : n["energy-kcal_100g"];
        const protein = (perServing ? n.proteins_serving : n.proteins_100g) ?? 0;
        const carbs = (perServing ? n.carbohydrates_serving : n.carbohydrates_100g) ?? 0;
        const fat = (perServing ? n.fat_serving : n.fat_100g) ?? 0;
        const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(",")[0];

        return {
          name: [p.product_name, brand].filter(Boolean).join(" — "),
          calories: calories != null ? Math.round(calories) : null,
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fat: Math.round(fat),
          basis: perServing ? (p.serving_size ? `per ${p.serving_size}` : "per serving") : "per 100g",
        };
      })
      .filter((p) => p.name && p.calories != null)
      .slice(0, 8);

    return NextResponse.json(results);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
