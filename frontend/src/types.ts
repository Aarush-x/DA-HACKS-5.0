export type Category = "bread" | "cereal";
export type Priority = "balanced" | "fiber" | "sodium" | "protein" | "low_calorie" | "low_sugar" | "low_sat_fat";
export type LabelStatus = "verified" | "unverified" | "synthetic";

export type Source = {
  id: string;
  title: string;
  url: string;
  accessed_at: string; // ISO date, YYYY-MM-DD
};

export type Nutrients = {
  calories_kcal: number | null;
  fiber_g: number | null;
  protein_g: number | null;
  added_sugar_g: number | null;
  total_sugar_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  barcode: string | null; // preserve leading zeroes
  package_size: string | null;
  image_url: string | null;
  image_credit: string | null;
  image_source_url: string | null;
  label_status: LabelStatus;
  label_verified_at: string | null; // only set after manual verification
  label_source_id: string | null; // points into sources
  serving_g: number | null;
  nutrition_per_serving: Nutrients;
  nutrition_per_100g: Nutrients;
  reference_g: number; // 50 for bread; 40 for cereal
  nutrition_per_reference: Nutrients;
  first_grain_is_whole: boolean | null;
  ingredients_text: string | null;
  ingredient_refs: { id: string; label: string }[];
  sources: Source[];
  retailer_search_url: string | null;
  availability: {
    store_id: string;
    status: "in_demo_assortment" | "out_of_demo_assortment" | "unknown";
    mode: "simulated";
  };
  ranking: {
    priority: Priority;
    status: "ranked" | "insufficient_data";
    rank: number | null; // category-local, starts at 1
    internal_index: number | null; // heuristic; never display as percent healthy
    reasons: { kind: "strength" | "tradeoff" | "note"; text: string }[];
    missing_fields: string[];
    components: { key: string; contribution: number | null }[];
  };
};

export type CatalogResponse = {
  meta: {
    api_version: "1";
    catalog_version: string;
    inventory_mode: "simulated";
    storage_mode: "seed" | "postgres" | "fixture";
    contains_synthetic_labels: boolean;
    supported_categories: Category[];
    reference_g_by_category: { bread: 50; cereal: 40 };
    fda_daily_values: {
      calories_kcal: number;
      fiber_g: number;
      protein_g: number;
      added_sugar_g: number;
      sodium_mg: number;
      saturated_fat_g: number;
    };
    priority: Priority;
    store_id: string;
    total: number;
  };
  products: Product[];
};

export type StoresResponse = {
  meta: { api_version: "1"; inventory_mode: "simulated" };
  stores: { id: string; name: string; inventory_mode: "simulated" }[];
};

export type IngredientResponse = {
  id: string;
  name: string;
  aliases: string[];
  what_it_is: string;
  why_used: string;
  evidence_summary: string;
  practical_guidance: string;
  evidence_level: "established" | "limited" | "mixed" | "not_assessed";
  uncertainty: string;
  reviewed_at: string | null;
  sources: Source[];
  content_status: "reviewed" | "draft" | "synthetic";
};

export type IngredientListResponse = {
  ingredients: IngredientResponse[];
};

export type ErrorResponse = {
  error: { code: string; message: string; request_id: string };
};
