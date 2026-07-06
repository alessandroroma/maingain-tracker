import { NextResponse } from "next/server";

interface FoodResult {
  name: string;
  calories: number | null;
  protein: number;
  carbs: number;
  fat: number;
  basis: string;
  source: "USDA" | "OFF";
}

const UA = { "User-Agent": "MaingainTracker/1.0 (personal recomp tracker)" };

// ---------- USDA FoodData Central (best for whole foods) ----------

interface UsdaNutrient {
  nutrientId: number;
  unitName?: string;
  value?: number;
}

interface UsdaFood {
  description?: string;
  foodNutrients?: UsdaNutrient[];
}

// FDC nutrient IDs: 1008 Energy (kcal), 2047/2048 Energy Atwater (Foundation),
// 1003 Protein, 1005 Carbohydrate by difference, 1004 Total fat
function usdaNutrient(f: UsdaFood, ids: number[], unit?: string): number | null {
  for (const id of ids) {
    const n = f.foodNutrients?.find(
      (x) => x.nutrientId === id && (!unit || x.unitName?.toUpperCase() === unit)
    );
    if (n?.value != null) return n.value;
  }
  return null;
}

async function fetchUsda(q: string): Promise<FoodResult[]> {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}` +
      `&query=${encodeURIComponent(q)}&pageSize=5&dataType=Foundation,SR%20Legacy`,
    { headers: UA, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`USDA returned ${res.status}`);
  const data = await res.json();

  return ((data.foods || []) as UsdaFood[]).map((f) => ({
    name: f.description || "",
    calories: (() => {
      const kcal = usdaNutrient(f, [1008, 2047, 2048], "KCAL");
      return kcal != null ? Math.round(kcal) : null;
    })(),
    protein: Math.round(usdaNutrient(f, [1003]) ?? 0),
    carbs: Math.round(usdaNutrient(f, [1005]) ?? 0),
    fat: Math.round(usdaNutrient(f, [1004]) ?? 0),
    basis: "per 100g",
    source: "USDA" as const,
  }));
}

// ---------- Open Food Facts (best for packaged/branded foods) ----------

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

const OFF_FIELDS = "product_name,brands,serving_size,nutriments";

async function fetchOffProducts(q: string): Promise<OffProduct[]> {
  // Primary: search-a-licious (fast, reliable)
  try {
    const res = await fetch(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=8&fields=${OFF_FIELDS}`,
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
      `&search_terms=${encodeURIComponent(q)}&page_size=8&fields=${OFF_FIELDS}`,
    { headers: UA, next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

async function fetchOff(q: string): Promise<FoodResult[]> {
  const products = await fetchOffProducts(q);
  return products.map((p) => {
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
      source: "OFF" as const,
    };
  });
}

// ---------- Route ----------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Query both sources in parallel; tolerate either one failing
    const [usda, off] = await Promise.allSettled([fetchUsda(q), fetchOff(q)]);
    const usdaResults = usda.status === "fulfilled" ? usda.value : [];
    const offResults = off.status === "fulfilled" ? off.value : [];

    if (usda.status === "rejected" && off.status === "rejected") {
      return NextResponse.json({ error: "Both food databases are unavailable right now" }, { status: 502 });
    }

    // USDA first (whole foods), then branded products from OFF
    const results = [...usdaResults, ...offResults]
      .filter((r) => r.name && r.calories != null)
      .slice(0, 10);

    return NextResponse.json(results);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
