# ShelfSense API contract v1

Baseline: 2026-10-16. Extracted unchanged from handoff sections 5 and 6. Changes require Aarush and Marc agreement and matching fixture updates.

## 5. Shared API contract — proposed v1

Agree on this before either application is built. Prompt 0 turns this section into `contracts/API_CONTRACT.md`. The versioned HTTP base path is `/api/v1`. Do not rename fields independently.

### Endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /healthz` | Basic service liveness; no credentials or sensitive configuration |
| `GET /api/v1/stores` | Return the two demo branches |
| `GET /api/v1/products` | Filter the catalog for a store/category/query and return backend-ranked products |
| `GET /api/v1/ingredients` | v2: return every ingredient explanation as `{ ingredients: IngredientResponse[] }`, so clients can match ingredient names against `name`/`aliases` locally |
| `GET /api/v1/ingredients/{ingredient_id}` | Return an ingredient explanation |

No compare endpoint is necessary. Each product response includes the metrics needed to compare two rows. The frontend can subtract corresponding values for display; it must not create a second authoritative health-ranking algorithm.

### Product query parameters

| Parameter | Rules |
| --- | --- |
| `store_id` | Required. `demo-store-a` or `demo-store-b` |
| `category` | Optional. `bread` or `cereal` |
| `q` | Optional. Trimmed case-insensitive search across category, product name, and brand. Maximum 100 characters |
| `priority` | Optional. `balanced`, `fiber`, `sodium`, `protein`, `low_calorie`, `low_sugar`, or `low_sat_fat`; defaults to `balanced` |

`q=bread` must match bread products through their category even if their names do not contain the word. If both category and query are supplied, apply both filters. If both are absent, return both categories, ordered in separate category groups with category-local ranks. Never compare a cereal score to a bread score.

Only include products marked `in_demo_assortment` for the selected store. Unsupported free-text queries return an empty result with supported categories in metadata. An invalid enum or malformed query returns 422. An unknown well-formed store ID returns 404. Use stable IDs as the final tie-breaker.

### Shared data shapes

The following type notation specifies JSON shapes; these are planning definitions, not application source files. Use snake_case for HTTP fields. Every listed field is present; unavailable values use `null`, not omitted fields, invented zeroes, or the string `N/A`.

```typescript
type Category = "bread" | "cereal";
type Priority =
  | "balanced"
  | "fiber"
  | "sodium"
  | "protein"      // v2: most protein at equal weight
  | "low_calorie"  // v2: fewest calories at equal weight
  | "low_sugar"    // v2: least added sugar at equal weight
  | "low_sat_fat"; // v2: least saturated fat at equal weight
type LabelStatus = "verified" | "unverified" | "synthetic";

type Source = {
  id: string;
  title: string;
  url: string;
  accessed_at: string; // ISO date, YYYY-MM-DD
};

type Nutrients = {
  calories_kcal: number | null; // v2
  fiber_g: number | null;
  protein_g: number | null;
  added_sugar_g: number | null;
  total_sugar_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
};

type Product = {
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
  retailer_search_url: string | null; // v2: Walmart SEARCH url; not a stock/price claim
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

type CatalogResponse = {
  meta: {
    api_version: "1";
    catalog_version: string;
    inventory_mode: "simulated";
    storage_mode: "seed" | "postgres" | "fixture";
    contains_synthetic_labels: boolean;
    supported_categories: Category[];
    reference_g_by_category: { bread: 50; cereal: 40 };
    // v2: general FDA reference amounts (2,000 kcal diet) for %DV context only —
    // a neutral reference, not personalized or medical advice.
    fda_daily_values: {
      calories_kcal: 2000; fiber_g: 28; protein_g: 50;
      added_sugar_g: 50; sodium_mg: 2300; saturated_fat_g: 20;
    };
    priority: Priority;
    store_id: string;
    total: number;
  };
  products: Product[];
};

type StoresResponse = {
  meta: { api_version: "1"; inventory_mode: "simulated" };
  stores: { id: string; name: string; inventory_mode: "simulated" }[];
};

type IngredientResponse = {
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

// v2: GET /api/v1/ingredients. `aliases` are lowercase label spellings; each
// alias maps to exactly one entry. `what_it_is` and `evidence_summary` are
// short (one line each) for compact display.
type IngredientListResponse = {
  ingredients: IngredientResponse[];
};

type ErrorResponse = {
  error: { code: string; message: string; request_id: string };
};
```

Health response: `{"status":"ok","api_version":"1"}`. Keep liveness separate from database readiness. A catalog query that requires an unavailable database returns 503 with the error envelope.

Ingredient 404 means the explanation is unavailable, not that an ingredient is dangerous. Normalize FastAPI validation and HTTP errors to the same error envelope, including 422 responses. Error bodies must not contain stack traces or database credentials.

Do not add price fields for this MVP. They can be introduced in a coordinated future contract version.

### Frontend data modes

Use one API-facing interface with methods `getStores`, `getProducts`, and `getIngredient`. Implement it with an HTTP adapter and a separate mock adapter.

- `VITE_DATA_MODE=mock`: use bundled fixtures; persistent `Sample product data` banner. Inventory remains explicitly simulated.
- `VITE_DATA_MODE=api`: call Render; show `Connected to demo API` plus the separate `Store availability is simulated` notice.
- `VITE_API_BASE_URL`: backend origin only, for example `http://localhost:8000` or `https://YOUR-SERVICE.onrender.com`. Append `/api/v1` in the client exactly once. The health endpoint is `/healthz`.
- Parse environment values as strings, validate allowed modes, and validate the API URL. Do not treat the string `false` as a Boolean.
- Default local development to mock mode. For a public build, explicitly set the desired mode.
- No silent switch from API to mocks when an API call fails. Show the error and Retry; optionally offer a clearly labelled `Open sample demo` action that changes the mode banner.
- Use request cancellation or request identity checks so an older search cannot overwrite a newer one. Clear comparison selections when category or store changes.
- An HTTP timeout around 30 seconds is reasonable; show a useful waiting state and manual Retry. Do not claim to know the service is waking unless that is established.

## 6. Data collection and ranking rules

### Six suggested real product candidates

These are candidates from the research, not a completed verified seed catalog:

| Bread | Cereal |
| --- | --- |
| Nature's Own 100% Whole Wheat | Original Cheerios |
| Sara Lee Sandwich White | Honey Nut Cheerios |
| Dave's Killer Bread Powerseed | Kellogg's Frosted Flakes Original |

Use exact US variants and package sizes. Replace any candidate whose full label cannot be verified quickly. Match barcode, brand, variety, package size, and label version. UPC is text. Do not merge data solely by similar names.

Source priority: actual current package/manufacturer/SmartLabel, then a matching USDA branded record or Open Food Facts record as a secondary source. An OFF or USDA record is not automatically current or manually verified. Keep ingredients and nutrition from the same formulation. A primary label source should cover the input nutrition and ingredients, with any conflicts resolved before the product is marked verified.

Manufacturer and retailer images require permitted use and attribution where applicable. Never have the app rely on a blocked hotlink. A plain product card is acceptable if a permitted image cannot be obtained.

The backend/data owner manually verifies the final values. No AI-generated nutrition. No fabricated scientific references. Synthetic development labels use fictional brands and empty source lists, not fake citations.

### Normalize and preserve missingness

For every available nutrient: `per_100g = per_serving * 100 / serving_g` and `per_reference = per_100g * reference_g / 100`.

- Bread reference quantity: **50 g**.
- Dry cereal reference quantity: **40 g**, without milk.
- These are app comparison portions, not official recommended servings.
- Invalid/missing serving mass means normalized fields are null. Never guess grams from a slice or cup.
- Preserve explicit label zeroes. Missing is null. Do not parse a label such as `<1 g` as exactly zero without a documented treatment; leave unresolved fields unranked for the demo.
- Retain full precision for calculations. Round only displayed values sensibly; do not present false precision.
- Added sugar is different from total sugar. Never substitute one for the other.

### Balanced prototype index

This is a transparent engineering heuristic, not a clinically validated score, disease predictor, or FDA-approved rating. The backend owns it. The UI displays rank and reasons, not a `percent healthy` score.

For nutrients at the reference quantity, define:

- `F = clamp(fiber_g / 5.6, 0, 1)`.
- `P = clamp(protein_g / 10, 0, 1)`.
- `A = 1 - clamp(added_sugar_g / 10, 0, 1)`.
- `N = 1 - clamp(sodium_mg / 460, 0, 1)`.
- `S = 1 - clamp(saturated_fat_g / 4, 0, 1)`.
- `W = 1` if the first grain ingredient is verified as whole grain, otherwise `0` when verified false. Unknown is null. This does not estimate whole-grain percentage.

These scaling anchors use 20% of the relevant daily reference amounts, including a 50 g protein reference. This cap is a deliberate prototype scaling choice, not a claim that each meal should provide those amounts.

| Component | Bread weight | Cereal weight |
| --- | ---: | ---: |
| F | 30 | 25 |
| P | 10 | 10 |
| W | 10 | 10 |
| A | 20 | 35 |
| N | 25 | 10 |
| S | 5 | 10 |

Index = sum of weighted components, giving a 0–100 internal range. A complete balanced record needs serving mass, fiber, protein, added sugar, sodium, saturated fat, and the whole-grain indicator. If any is missing, balanced rank/index are null and `missing_fields` explains why. Do not redistribute weights.

Only compare indices within the same category. Test modest weight changes and avoid describing a fragile winner as objectively healthiest. Ranking logic must be monotonic: more sodium alone cannot improve a balanced result; more fiber alone cannot worsen it. The caps intentionally stop extra credit or penalties beyond their anchors.

### Priority modes

- `fiber`: sort descending by fiber at equal weight; break ties by lower sodium when known, then stable ID. Require valid normalized fiber, not all balanced fields. Index can remain null; ranking status is ranked when this mode has its required data.
- `sodium`: sort ascending by sodium at equal weight; break ties by higher fiber when known, then stable ID. Require valid normalized sodium.
#### v2 single-metric modes

Same mechanics as `fiber`/`sodium` — sort on one normalized field at the
reference quantity, place products missing that field after ranked ones with a
null rank and an explanation, `internal_index` stays null, `components` is empty.

- `protein`: most protein first; ties -> lower sodium, then stable ID. Requires normalized protein.
- `low_calorie`: fewest calories first; ties -> more protein. Requires normalized calories.
- `low_sugar`: least added sugar first; ties -> more fiber. Requires normalized added sugar.
- `low_sat_fat`: least saturated fat first; ties -> more fiber. Requires normalized saturated fat.

- Place products lacking the selected mode's required data after ranked products, with null ranks and an explanation. For secondary tie-breaks, unknown values follow known values.
- In all modes, return concrete strengths and tradeoffs derived from the record and current same-category comparison. If no valid comparator exists, state factual metrics instead of claiming an improvement.
- UI copy uses `Recommended for your selected priority` or `More fiber at the same weight`, not universal claims about the healthiest food.

### Ingredient explanations

Prepare approximately four to six cards for ingredients that actually appear in the chosen products. Explain what it is, its function, evidence, uncertainty, practical context, and sources. Ordinary ingredients may be explained too; there is no need to populate a list of supposedly bad chemicals.

No blanket penalties for preservatives, long ingredient lists, unfamiliar names, seed oils, or absence of organic certification. Additive explanations do not change the MVP nutrition index. Distinguish established evidence from limited human research, animal findings, or associations. Regulatory permission does not mean a substance was individually pre-approved by FDA in every context; avoid blanket approval claims.

Allergy-related text must not guarantee safety or absence of cross-contact. An ingredient card's evidence label describes its specific summary, not a universal risk classification.
