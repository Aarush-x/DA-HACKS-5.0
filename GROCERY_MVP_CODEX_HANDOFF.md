# Grocery Comparison MVP — Codex + Claude Handoff

Prepared for **Aarush and Marc** | DA Hacks 5.0 | October 16, 2026

**GitHub repository:** [Aarush-x/DA-HACKS-5.0](https://github.com/Aarush-x/DA-HACKS-5.0)  
**Clone URL:** `https://github.com/Aarush-x/DA-HACKS-5.0.git`  
**Default branch:** `main`  
**Aarush owns:** frontend, GSAP/UI design, Vercel, and coordinated integration.  
**Marc owns:** backend, product data, ranking, database, and Render.  
**Aarush's environment:** Codex desktop on Mac, existing local project named **DA hacks**, using the Mac folder already selected for that project.  
**Marc's environment:** Claude, working with his own local checkout of the same GitHub repository.

This is the project brief, proposed API contract, team workflow, deployment guide, and copy-paste prompt pack. It does not contain an implemented application. The working project name is **ShelfSense**; rename it later if needed. Name availability has not been checked.

## 1. Start here: move this project into Codex

Aarush is using the **Codex desktop app directly**, with an existing project named **DA hacks** and an existing local folder on his Mac. No separate editor or IDE extension is required. Marc uses **Claude**, not Codex. Shared Git files and the API contract connect the two workflows; the assistants do not share chat memory.

1. Download this updated file into the **existing Mac folder attached to DA hacks**, keeping the filename `GROCERY_MVP_CODEX_HANDOFF.md`. Do not create another project folder or a nested clone. The absolute Mac path has not been supplied here, so use the actual folder selected in Codex rather than guessing a path.
2. Open **DA hacks** in Codex and use its local working context. Confirm that its primary project folder is the intended Mac folder. A project name alone does not establish which filesystem folder is selected.
3. Aarush runs **Prompt L0** below to inspect the current directory, initialize/connect Git if needed, and verify `origin` points to `https://github.com/Aarush-x/DA-HACKS-5.0.git`. Work directly in that folder; do not choose a separate worktree or cloud checkout for this initial workflow.
4. Aarush runs **Prompt 0** once. It creates the shared planning files and fixtures, checks them, then commits/pushes that baseline to GitHub using the rules below.
5. If Marc does not already have collaborator access, Aarush adds him using Marc's actual GitHub username. Marc's username is not supplied here; do not guess it or send an invitation automatically.
6. Marc clones/pulls the same repository on his computer, then opens it in his chosen Claude coding environment. He explicitly asks Claude to read this handoff, `AGENTS.md`, `CLAUDE.md`, and the shared contract before running backend prompts. If his Claude setup has no local file/terminal tools, Marc applies/runs the generated changes locally himself; do not assume a chat-only session can edit or push a checkout.
7. Aarush uses Codex for **F1, F2, then F3**. Marc uses Claude for **B1, then B2**. Aarush can build F1/F2 while Marc builds B1/B2; F3 waits until Marc has a reachable API. Marc's `localhost:8000` is on Marc's computer: Aarush needs to run the pulled backend locally, use Marc's deployed Render origin, or another deliberately configured reachable development address. Do not paste Marc's localhost URL into Aarush's browser and assume it reaches Marc.
8. Each assistant commits and pushes successful milestones to its owner's branch when its local tools and GitHub authentication permit. Merge through small pull requests. **Aarush alone runs I1** for coordinated integration after telling Marc which files are involved. Marc uses Claude for **D1**; Aarush uses Codex for **D2**.

Aarush uses one prompt at a time in Codex; Marc uses one prompt at a time in Claude. Review results and acceptance checks before moving to the next. If either starts a new chat, use the resume prompt. The backend prompts are ordinary instructions and do not require Marc to install or use Codex.

**Local files and GitHub are separate steps:** Codex writes code into the selected Mac folder. Git records a commit and pushes it to the repository. File saving is not automatic GitHub synchronization. This handoff authorizes milestone commits/pushes; it does not install a file watcher, change account permissions, or guarantee Git authentication is already configured. Codex's Git controls or its available terminal can perform those operations. If authentication is blocked, report the exact next sign-in step without requesting credentials in chat or claiming the push succeeded.

### Exactly which prompts each person runs

| Prompt | Who runs it | When and why |
| --- | --- | --- |
| **L0** | **Aarush in Codex, once** | Connect the existing Mac project folder to the existing GitHub repository |
| **0** | **Aarush in Codex, once** | Establish contract, fixtures, and shared instructions; commit/push before splitting work |
| **F1** | **Aarush** | Build frontend using fixtures while Marc starts B1 |
| **F2** | **Aarush** | Review and refine frontend design, GSAP motion, and responsiveness |
| **B1** | **Marc** | Build backend, ranking, and initial data/storage layer after pulling the shared baseline |
| **B2** | **Marc** | Verify the six real products and ingredient content after B1 |
| **F3** | **Aarush** | Connect to the local or Render API origin supplied by Marc; initially use the local API |
| **I1** | **Aarush only** | Verify and fix integration after both branches are merged; coordinate cross-folder edits with Marc |
| **D1** | **Marc** | Prepare Render backend settings after local integration works |
| **D2** | **Aarush** | Prepare Vercel frontend settings using Marc's real Render origin |
| **F4** | **Aarush, only if needed** | Apply the refined visual direction to a frontend already started; skip if F1/F2 already implement it |
| **Release prompt** | **Marc for Render; Aarush for Vercel** | Use only when the relevant owner is ready to deploy the reviewed commit to the explicitly identified service/environment |
| **Resume prompt** | **Either person** | Start a fresh chat with role `frontend` for Aarush or `backend` for Marc. Aarush uses `integration` only for the coordinated integration task |

**Aarush's normal path in Codex:** L0 → 0 → F1 → F2 → F3 → I1 → D2.  
**Marc's normal path in Claude:** pull baseline → B1 → B2 → D1.  
The two paths overlap. Marc's deployed Render origin is needed for D2; Aarush's actual Vercel origin is needed for Marc's final CORS update. Deployment uses the release prompt or the documented dashboard steps; D1/D2 are preparation tasks. After deployment, Aarush repeats I1 against the actual hosted URLs to verify browser-to-API behavior.

Do not both run Prompt 0, I1, or the same deployment task simultaneously. F4 is an optional refinement, not another mandatory application build. For an existing implementation, inspect current progress first and skip already completed stages.

## 2. Product and scope: the decisions already made

### The problem

Shoppers should be able to search a grocery category, compare similar products, and understand the nutritional tradeoffs without scanning each package or manually interpreting every label.

### The demo we are building

**Two working searches: bread and cereal. Three products per category. Six products total.** This means two food categories, not an extensive retailer catalog. Salsa is a possible third category only after everything else works; it is outside the committed scope.

The complete flow is:

1. Select one of two explicitly simulated Walmart demo branches.
2. Search `bread` or `cereal`, or choose a category chip.
3. See three or fewer matching products from that demo assortment, ordered for the selected priority.
4. Compare two products at equal weight.
5. Switch between **Balanced**, **More fiber**, and **Less sodium**.
6. Inspect an ingredient explanation with sources and uncertainty.
7. Optionally add a choice to a local shopping list.

The memorable interaction: one option has more fiber but also more sodium. Changing the priority changes the recommendation and explains the tradeoff.

### What is real and what is simulated

- The final six products should have real, manually verified US nutrition labels and ingredients.
- Walmart branch availability is **simulated**. This must be visible throughout the flow, not hidden in a footer.
- Start with `demo-store-a` and `demo-store-b`, named `Walmart demo branch A` and `Walmart demo branch B`. Do not invent a real branch address or claim actual local stock.
- The backend can be a real working API while its inventory remains simulated. The word `api` does not mean live retailer data.
- Frontend development fixtures may be fully synthetic. Label those as sample data and use fictional product names. Never attach fabricated nutrition to a real brand.
- Do not show a live price, aisle, stock quantity, inventory timestamp, or verified badge unless it has a real source.
- No affiliation with or endorsement by Walmart is implied.

### Why this is not pitched as a new Yuka

Yuka already offers detailed evaluations, healthier alternatives, and premium product search without scanning. EWG, Fooducate, and other shopping tools cover related ground. Search and ingredient definitions alone are not unique.

Our focus is **clear side-by-side tradeoffs, consistent comparison quantities, visible data quality, and recommendations that respond to a shopper's chosen priority**. This is a useful demo focus, not a proven startup moat.

### Features we are cutting

No accounts, authentication, user profiles, checkout, payment, barcode scanning, OCR, chatbot, LLM scoring, dynamically generated medical claims, extensive dietary personalization, scraping, or runtime Walmart integration. No native mobile app. No user shopping-list table is needed; local storage is enough if the optional list is included.

## 3. Team roles and repository workflow

| Area | Owner | Responsibility |
| --- | --- | --- |
| `frontend/` | Aarush + his Codex session | React UI, API client, mock adapter, comparisons, accessibility, frontend checks, Vercel config |
| `backend/` | Marc + Claude | FastAPI, data verification, ranking, ingredient content, seed data, optional managed Postgres, backend checks |
| `contracts/` | Aarush creates baseline; changes agreed by both | API specification, fixed fixtures, version/change notes |
| `GROCERY_MVP_CODEX_HANDOFF.md` | Shared reference | Approved product scope and initial design |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, root deployment config | Coordinate before edits | Setup instructions, ownership rules, shared deployment concerns |

Use `frontend/aarush-mvp` for Aarush and `backend/marc-mvp` for Marc, or retain existing equivalent branches. Aarush's checkout stays in the existing Mac folder attached to DA hacks. Marc uses his own local checkout. Confirm that `origin` points to `https://github.com/Aarush-x/DA-HACKS-5.0.git` before pushing. Commit small working changes. Pull or merge the current `main` before integrating. Never reset, overwrite, or force-push the other person's work.

### Authorized milestone commit/push policy

- Prompt L0 sets up/inspects Git without staging or committing unrelated files. Prompt 0 creates the shared baseline. If the remote has no commits, the baseline can be the initial commit on `main`; if the remote already has history, preserve it and use a bootstrap branch/pull request when appropriate.
- After the baseline, Aarush pushes `frontend/aarush-mvp` and Marc pushes `backend/marc-mvp`. Pushing directly to GitHub means ordinary Git pushes to these branches, not both assistants overwriting `main`.
- At the end of an implementation milestone, inspect the diff, run relevant checks, stage only intended task files by explicit paths, commit with a descriptive message, and push to the verified owner branch. This is authorized; do not stop merely to ask again whether to commit/push normal task changes.
- Exclude secrets, local environment files, dependency caches, generated build output, and unrelated edits. Do not use indiscriminate staging when unrelated changes exist.
- If checks fail, fix routine failures first. If the task remains blocked, report it and do not present the milestone as completed. A deliberate work-in-progress push should be identified as such.
- Handle a rejected non-fast-forward push by fetching and inspecting remote changes, then integrating without dropping either person's work. Never force-push, erase remote history, or create unrelated parallel history as a shortcut.
- If repository authentication or branch policy prevents pushing, report the error and the required user action. A local commit is not a successful push. Do not create or change access tokens, permissions, branch protections, or paid services as part of Git setup.
- Report current branch, commit SHA, and whether the push actually succeeded. Cloud deployment remains a separate step governed by the release prompt.

The normal frontend task must not edit backend files. The normal backend task must not edit frontend files. Shared contract changes require a short agreement between the two humans, an update to the contract and fixtures, and a matching update on both sides. This is coordination, not a reason to pause unrelated work.

The bootstrap step happens once before parallel work. Do not have two Codex sessions independently generate incompatible API contracts.

Suggested repository layout after development begins:

```text
<Aarush's existing Mac project folder>/
  GROCERY_MVP_CODEX_HANDOFF.md
  AGENTS.md
  CLAUDE.md
  README.md
  contracts/
    API_CONTRACT.md
    fixtures/
      stores.json
      products-balanced.json
      products-fiber.json
      products-sodium.json
      ingredient.json
  frontend/
    package.json
    package-lock.json
    src/
      components/
      lib/api/
      mocks/
      types/
    public/
    .env.example
    vercel.json
  backend/
    requirements.txt
    app/
      main.py
      schemas.py
      services/
    data/
    tests/
    .env.example
```

Do not add a monorepo build framework, shared runtime package, or Docker unless an observed need justifies it. Each deployable folder should build independently. Contract fixtures are development references; copy needed assets into the deployable app instead of relying on files outside its configured root at runtime.

## 4. Architecture and deployment decisions

The previous research favored a static app for speed. The user's current decision is a separate frontend and backend, with Vercel and Render respectively. Follow this decision.

| Layer | Decision |
| --- | --- |
| Frontend | React + Vite + TypeScript; deliberate custom styling following section 7 |
| Motion | GSAP + `@gsap/react` + ScrollTrigger; restrained scroll reveals and interaction transitions |
| Frontend host | Vercel, project root `frontend/` |
| Backend | Python + FastAPI + Pydantic |
| Backend host | Render Web Service, service root `backend/` |
| Persistent database, if used | Managed Render Postgres; backend access only |
| Database access | SQLAlchemy + a compatible PostgreSQL driver; keep schema small |
| Initial dataset | Six manually reviewed product records and a few ingredient explanations |
| Ranking owner | Backend only; frontend displays the returned ordering and explanations |
| External food APIs | Optional data-collection tools, not required during judging |
| Frontend fallback | Explicit mock/sample mode with a persistent notice |

For six read-only products, a database is optional. The backend can initially load committed seed JSON. If Marc builds Postgres, use explicit `CATALOG_STORAGE=postgres` or `CATALOG_STORAGE=seed` configuration and expose the selected mode in metadata. A configured database failure must produce an honest error, not silently pretend the database is working.

Do not rely on a runtime SQLite file for durable Render storage. Render's default service filesystem is ephemeral. Committed seed JSON can be reloaded after restart; runtime changes to a local database are a different matter.

## 5. Shared API contract — proposed v1

Agree on this before either application is built. Prompt 0 turns this section into `contracts/API_CONTRACT.md`. The versioned HTTP base path is `/api/v1`. Do not rename fields independently.

### Endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /healthz` | Basic service liveness; no credentials or sensitive configuration |
| `GET /api/v1/stores` | Return the two demo branches |
| `GET /api/v1/products` | Filter the catalog for a store/category/query and return backend-ranked products |
| `GET /api/v1/ingredients/{ingredient_id}` | Return an ingredient explanation |

No compare endpoint is necessary. Each product response includes the metrics needed to compare two rows. The frontend can subtract corresponding values for display; it must not create a second authoritative health-ranking algorithm.

### Product query parameters

| Parameter | Rules |
| --- | --- |
| `store_id` | Required. `demo-store-a` or `demo-store-b` |
| `category` | Optional. `bread` or `cereal` |
| `q` | Optional. Trimmed case-insensitive search across category, product name, and brand. Maximum 100 characters |
| `priority` | Optional. `balanced`, `fiber`, or `sodium`; defaults to `balanced` |

`q=bread` must match bread products through their category even if their names do not contain the word. If both category and query are supplied, apply both filters. If both are absent, return both categories, ordered in separate category groups with category-local ranks. Never compare a cereal score to a bread score.

Only include products marked `in_demo_assortment` for the selected store. Unsupported free-text queries return an empty result with supported categories in metadata. An invalid enum or malformed query returns 422. An unknown well-formed store ID returns 404. Use stable IDs as the final tie-breaker.

### Shared data shapes

The following type notation specifies JSON shapes; these are planning definitions, not application source files. Use snake_case for HTTP fields. Every listed field is present; unavailable values use `null`, not omitted fields, invented zeroes, or the string `N/A`.

```typescript
type Category = "bread" | "cereal";
type Priority = "balanced" | "fiber" | "sodium";
type LabelStatus = "verified" | "unverified" | "synthetic";

type Source = {
  id: string;
  title: string;
  url: string;
  accessed_at: string; // ISO date, YYYY-MM-DD
};

type Nutrients = {
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
- Place products lacking the selected mode's required data after ranked products, with null ranks and an explanation. For secondary tie-breaks, unknown values follow known values.
- In all modes, return concrete strengths and tradeoffs derived from the record and current same-category comparison. If no valid comparator exists, state factual metrics instead of claiming an improvement.
- UI copy uses `Recommended for your selected priority` or `More fiber at the same weight`, not universal claims about the healthiest food.

### Ingredient explanations

Prepare approximately four to six cards for ingredients that actually appear in the chosen products. Explain what it is, its function, evidence, uncertainty, practical context, and sources. Ordinary ingredients may be explained too; there is no need to populate a list of supposedly bad chemicals.

No blanket penalties for preservatives, long ingredient lists, unfamiliar names, seed oils, or absence of organic certification. Additive explanations do not change the MVP nutrition index. Distinguish established evidence from limited human research, animal findings, or associations. Regulatory permission does not mean a substance was individually pre-approved by FDA in every context; avoid blanket approval claims.

Allergy-related text must not guarantee safety or absence of cross-contact. An ingredient card's evidence label describes its specific summary, not a universal risk classification.

## 7. Frontend experience and visual direction

### Design brief: minimal, modern, and deliberately art-directed

**User requirement:** the interface must not look like a generic AI-generated template. Aim for the typography, composition, spacing, and execution associated with excellent Awwwards sites, while keeping this a fast, simple grocery tool. This is a quality reference, not a claim of an award or a request for an elaborate showcase site.

**No gradients anywhere.** Use solid colors for backgrounds, buttons, typography, borders, skeletons, and charts. Do not use gradients inside text, decorative overlays, fades, or loading shimmers either.

The visual personality should come from a precise grid, generous but useful whitespace, confident typography, restrained contrast, and well-presented product images. It should feel designed by a person with a clear point of view. Motion supports the interface; it does not become the main attraction.

### Concrete design system

| Element | Direction |
| --- | --- |
| Canvas | Warm off-white `#F7F6F2`; solid white `#FFFFFF` for selected surfaces |
| Main text | Deep charcoal `#1C211D` |
| Secondary text | Muted dark gray `#5B645D`; retain readable contrast |
| Borders | Fine neutral rule `#DADFD7`; subtle structure rather than heavy containers |
| Accent | One muted forest green `#31533B`, mainly for active controls and primary actions |
| Typography | A deliberate UI family such as Manrope; optionally Newsreader for one short editorial heading or wordmark. Use reliable fallbacks and at most two font families |
| Numeric data | Consistent tabular figures, aligned decimals where useful, clear units |
| Spacing | A consistent 4/8 px rhythm; generous section spacing without forcing unnecessary scrolling |
| Corners | Restrained 6–12 px radii; avoid turning every surface into an oversized pill |
| Depth | Mostly flat; only a very subtle shadow where a floating drawer or control needs separation |

These tokens are a concrete starting direction, not permission to sacrifice contrast or responsive fit. Establish CSS variables and reuse them. Check the actual font is available for permitted use; bundle appropriate font assets or keep the fallback rather than blocking the demo on external font loading.

- Give the page one distinctive, compact editorial heading. Keep search and category choices visible in the first viewport on an ordinary phone.
- Use a clear desktop grid and a single-column mobile flow. Three product cards may sit side by side on wide screens, with consistent comparison rows and strong alignment. Make the selected product or active comparison legible without extra decorative panels.
- Product photography/packaging, typography, and nutritional facts are the visual content. Do not invent nutrition infographics or generated decorative food art to fill space.
- Customize any component primitives. Do not ship an untouched component-library demo with its default spacing, colors, icons, and radii.
- Keep labels and copy direct. Avoid marketing filler such as `revolutionize`, `AI-powered`, or unsupported accuracy/safety claims.

### Visual patterns to avoid

No gradients, neon glows, glassmorphism, blurred color blobs, floating decorative shapes, ubiquitous sparkle icons, emoji section headings, stock SaaS hero compositions, arbitrary bento grids, oversized rounded cards, or large decorative dashboards. Avoid stacked pill badges for every attribute; use quiet labels and concise disclosure text. Do not put a large hero, testimonial section, or feature-marketing grid in front of the actual tool.

No custom cursor, hover-following objects, autoplay background video, 3D/WebGL scene, spinning product showcase, dramatic parallax, scroll-jacked storytelling, horizontal-scroll sections, or preloader that delays the search interface. Do not add visual features merely to resemble an awards site.

### Motion specification: GSAP, smooth and restrained

Use **GSAP with `@gsap/react` and ScrollTrigger** for a small, coherent motion system. ScrollTrigger triggers animations as sections enter the viewport; it does not itself smooth the browser's scroll position. Keep native wheel, touch, keyboard, and browser scrolling. Do not introduce a separate scrolling engine, scroll interception, or a permanently pinned full-screen sequence.

| Interaction | Proposed motion | Guardrail |
| --- | --- | --- |
| Initial heading/search | One subtle 12–16 px upward reveal with opacity over about 450–600 ms | Search remains immediately usable; no preloader or full-page delay |
| Results entering the viewport | ScrollTrigger reveal, 8–16 px offset, roughly 400–550 ms, 40–60 ms stagger for at most three cards | Reveal once per content set; do not replay on every scroll or keystroke |
| Priority/category changes | Short opacity/position transition, about 150–220 ms | New state and ordering must be correct immediately; no long animated sorting spectacle |
| Ingredient drawer | Controlled translate/opacity transition, about 240–320 ms | Focus management works during opening/closing; respect Escape and backdrop actions |
| Buttons and selection | Small color/border transition; at most 1–2 px movement where useful | No magnetic buttons, bounce, constant pulsing, or scaling the whole interface |

Use simple easing such as `power2.out`; avoid elastic/bounce effects. Prefer transform and opacity; do not repeatedly animate expensive blur/filter effects or layout properties while scrolling. CSS transitions are sufficient for ordinary hover/focus states; do not add another animation framework.

Implementation expectations:

- Use `useGSAP` with scoped refs and proper cleanup. Handle dependency changes and late interaction callbacks safely so effects do not duplicate in React Strict Mode or continue after unmount.
- Use `gsap.matchMedia()` or an equivalent explicit preference check to honor `prefers-reduced-motion`. Disable travel, staggering, and animated scrolling in reduced-motion mode; show final content and keep all controls working.
- Content must remain visible if animation initialization fails. Never leave results permanently at opacity zero or dependent on scrolling to become usable.
- Refresh ScrollTrigger only when real layout changes require it, such as image loading or a new result set. Do not attach competing listeners/tweens to every scroll event or trigger a refresh on every render.
- Avoid recreating the entire results region solely to replay animation. Use stable product IDs, preserve keyboard focus, and cancel outdated transitions when state changes quickly.
- If an explicit in-page action scrolls to comparison, preserve focus semantics, account for any sticky header, and use an accessible motion-aware approach. Do not automatically scroll the user on every query or priority change.
- Keep mobile scroll natural. A smooth, quiet interface is the goal; constant animation is not.

### Product behavior remains the priority

- Build the useful search/results interface immediately. Do not spend the first screen on a large marketing hero.
- Top bar: working project name, demo store selector, data-mode indicator.
- Search with bread/cereal chips. Results show category, equal-weight metrics, recommendation reasons, and data quality.
- Balanced / More fiber / Less sodium controls must work, not merely animate.
- Comparison is limited to two products in one category, using `reference_g` and `nutrition_per_reference` from the response. State `per 50 g` or `per 40 g dry cereal` clearly.
- Show missing as `Not provided`. Never fill nulls with zero for chart bars, sorting, or arithmetic.
- Ingredient drawer supports keyboard use, visible focus, Escape to close, and proper focus return. Empty source lists show `Sources not yet reviewed`, not fabricated links.
- Status badges distinguish verified label, incomplete/unverified label, sample label, and simulated inventory. Never use API connectivity as a label-verification signal.
- Include loading, timeout/error, retry, empty results, missing image, and ingredient-not-found states.
- Use regular browser text/links for evidence. No decorative medical risk gauges or fear-based red warnings.
- Basic local shopping-list persistence is optional and must not delay integration.

### Visual acceptance checks

- No gradient CSS functions or gradient SVG fills are introduced by our UI; real product-label artwork may naturally contain gradients and does not need editing.
- Review at approximately 375 px, 768 px, and 1440 px viewport widths. Verify no horizontal overflow, clipped controls, or giant unused gaps.
- Search and the main product choice remain easy to find. Nutrition data is readable without waiting for an animation.
- Check ordinary and reduced-motion modes, keyboard focus, touch scrolling, and rapid filter/priority changes. No hidden cards, duplicate tweens, scroll jumps, or flashing/replaying text.
- Verify the interface feels coherent with motion turned off. Good composition and typography must carry the design.
- Save local screenshots for review if tooling supports it, and report what was actually inspected. No redesign of backend data or expansion beyond two categories is justified by visual polish.

## 8. Deployment runbook

These are steps for the team to perform after implementation and verification. No service has been provisioned and no costs have been approved by this file.

### Render backend

1. Marc pushes the reviewed backend to https://github.com/Aarush-x/DA-HACKS-5.0 and creates a Render Web Service linked to the intended branch.
2. Root Directory: `backend`.
3. Runtime: Python. Select a currently supported Python version compatible with the installed dependencies and pin it using Render's supported mechanism.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command for this planned module path: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Health Check Path: `/healthz`.
7. Set `CATALOG_STORAGE=seed` initially, or configure `postgres` with `DATABASE_URL` after the persistent path is tested.
8. Set `CORS_ORIGINS` as a JSON array of exact origins: initially `["http://localhost:5173"]`, later add the actual Vercel deployment origin. The backend must parse this as JSON.
9. If using Postgres: create the schema and seed data using an explicit documented command. Seed by stable IDs so rerunning it does not duplicate rows or reset unrelated data. Run migrations/seeding as a controlled release step, not an uncontrolled destructive operation on every HTTP request.
10. Verify health, catalog, ingredient, and error responses over HTTPS. `/docs` is useful for the team, but browser-origin integration still needs separate verification.

`DATABASE_URL` and optional food API keys belong only in backend environment configuration. No secrets in Git, `VITE_*`, screenshots, or logs. Use Render's appropriate internal database connection when available, and configure the driver/URL correctly.

Render's documented free web services spin down after idle time and can take about a minute to start again. Test the cold-start path. Before judging, open the app and make a normal request; keep the explicit sample fallback available. Check current plan details before choosing a paid option.

### Vercel frontend

1. Aarush imports https://github.com/Aarush-x/DA-HACKS-5.0 as a Vercel project.
2. Root Directory: `frontend`. Framework preset: Vite.
3. Build Command: `npm run build`. Output Directory: `dist`. Commit the package lockfile; use reproducible installation (`npm ci`) when configuring the install step.
4. Set `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com` for the intended environment. The example URL is a placeholder, not a deployed service.
5. Deploy, then give the exact frontend origin to the backend owner for CORS. A preview URL and the production domain are different origins. Add the specific preview used for judging; do not broadly allow unrelated `*.vercel.app` sites.
6. If using path-based client routing, add the Vercel SPA fallback in `frontend/vercel.json` and verify refreshing a nested route. A one-page state-based UI does not require new routes.
7. Vite public environment variables are build-time values. Rebuild/redeploy after changing the API URL or mode.
8. Verify from the actual deployed frontend in a browser. A successful direct API request alone does not prove CORS works.

### CORS and integration requirements

Use FastAPI CORSMiddleware with the configured exact origins. No cookies or auth are needed, so use `allow_credentials=False`; allow the required GET/OPTIONS flow and headers. Avoid unnecessary custom headers on public GET requests. CORS is browser access policy, not authentication.

Make sure the frontend uses HTTPS to call the HTTPS Render API. Avoid accidental `/api/v1/api/v1` prefixes or slash redirects that complicate requests. Never use `mode: no-cors` as a fix; it would prevent reading the response.

## 9. Two-person execution schedule and acceptance criteria

| Time | Aarush | Marc | Shared checkpoint |
| --- | --- | --- | --- |
| 0–1 h | Run bootstrap; agree contract and fixtures | Review API/data shapes | Shared baseline committed |
| 1–4 h | Build mock-backed search/results/comparison | Build endpoints with seed data and ranking | Both implement the same contract |
| 4–6 h | Switch local frontend to API | Resolve response/CORS issues | First integrated bread demo |
| 6–10 h | Polish phone layout, explanations, errors | Verify all six labels and ingredient evidence; finish persistence if used | Two categories work with sourced data |
| 10–14 h | Prepare Vercel preview | Deploy Render and validate database/seed mode | Public browser-to-API flow |
| 14–18 h | Fix observed UX bugs | Fix observed data/ranking bugs | Feature freeze at hour 18 |
| 18–24 h | Rehearse and record demo; submission | Verify deployment, cold start, fallback | Stable submitted project |

Use time remaining before the actual submission deadline, not a fresh 24-hour clock if work begins later. The researched event deadline was October 17, 2026 at 2 PM Pacific; confirm organizer updates.

Minimum acceptance checks:

- Search bread returns only bread; cereal returns only cereal; unsupported query is handled honestly.
- Changing store filters the simulated assortment and clears stale selections.
- Changing priority changes ordering as specified; no cross-category rank comparison.
- Nutrition comparisons use equal quantities and correct units; null is never zero.
- Missing added sugar cannot produce a complete balanced rank.
- At least one comparison displays a genuine tradeoff using the verified dataset. Do not alter real labels to manufacture a dramatic result; use the best authentic pair or explain an alternative interaction.
- Ingredient drawer opens, closes, and shows actual references or an explicit missing-source state.
- API mode is tested against the real backend, including network errors. Mock mode is visibly identified.
- Frontend build/typecheck passes. Backend checks validate normalization, missingness, ranking monotonicity, category/store filtering, response shape, and errors.
- Frontend interaction checks cover search/priority/compare and the API failure state. Avoid large test suites that merely repeat markup.
- Frontend visual review meets section 7: no UI gradients, coherent typography/spacing, restrained GSAP motion, natural mobile scrolling, and a usable reduced-motion mode.
- Vercel-to-Render requests work from the actual demo URL; browser console has no relevant errors.
- Runtime secrets are absent from the frontend bundle and committed files.
- Final dataset is preserved across a backend restart or can be reloaded from committed seed data.
- Keep a short recorded demo and a local working copy as backups.

## 10. Copy-paste prompt pack — Codex for Aarush, Claude for Marc

Send Aarush's prompts to **Codex in the existing DA hacks local project**. Send Marc's prompts to **Claude with Marc's checkout available**. Both assistants must explicitly read the shared files; do not rely on shared chat memory or assume Claude automatically discovers `AGENTS.md`.

Prompts below authorize the named local implementation work and ordinary checked milestone commits/pushes under section 3. They do not authorize an unrelated rewrite, account provisioning, paid resources, or an unrequested production deployment. Keep work inside the specified ownership boundaries. Routine reversible edits, fixes, and authorized Git pushes should proceed without repeated confirmation.

### Prompt L0 — Aarush in Codex: use my existing Mac folder and connect GitHub

```text
I am using the Codex desktop app on my Mac in my existing local project named DA hacks. Work directly in the Mac folder already selected for this project. Do not require an IDE, create another project folder, clone into a nested folder, switch to a separate worktree/cloud checkout, or start building the app yet.

Read GROCERY_MVP_CODEX_HANDOFF.md from the current folder. First report the actual working directory and Git state so I can see that you are using the correct folder. Never invent the Mac folder's absolute path.

Connect this folder to the existing GitHub repository https://github.com/Aarush-x/DA-HACKS-5.0.git. Inspect existing files, Git history, branch, remotes, and remote history before changing Git configuration. If it is not already a Git repository, initialize Git in this same folder. Add origin only if it is absent. If origin points elsewhere, report the mismatch rather than replacing it without checking. Preserve existing local files and any remote commits. Do not reset, delete files, force-push, or create a second unrelated history to bypass a conflict.

If the remote has existing commits, align this checkout with its history without overwriting my files. If a material conflict requires my choice, explain the exact conflict; otherwise complete routine setup. If the remote is empty, prepare main for the shared baseline that Prompt 0 will create. Do not create an unnecessary empty initial commit.

No app code, dependencies, deployments, or paid services in this setup step. Do not commit unrelated existing files. If GitHub authentication blocks access, tell me the exact sign-in action needed and do not ask me to paste a token. End with the actual folder, origin URL, branch, remote-history status, and whether I can now run Prompt 0. Do not claim a commit/push happened when it did not.
```

### Prompt 0 — Aarush in Codex: shared baseline, once before splitting work

```text
Read GROCERY_MVP_CODEX_HANDOFF.md fully and inspect the current repository and any AGENTS.md instructions. I am Aarush using Codex in my existing DA hacks project folder on Mac; Marc uses Claude and owns backend. Keep code in this exact selected folder, connected to https://github.com/Aarush-x/DA-HACKS-5.0. Prompt L0 should already have verified Git setup. Do not create another folder/checkout or require a separate editor.

Create only our shared development baseline now:
1. contracts/API_CONTRACT.md containing the exact proposed v1 endpoint/query/JSON contract and all null, mode, ranking, error, and category semantics from the handoff.
2. contracts/fixtures with structurally valid example responses for stores, the three ranking priorities, and one ingredient. Use six fictional sample products across bread and cereal, clearly marked synthetic with no fake source URLs. Include at least one priority-changing tradeoff and one incomplete-data case. Use stable IDs. Explain fixture filtering and both demo store assortments. These fixtures demonstrate shape/behavior and are not the eventual verified catalog.
3. A concise root AGENTS.md recording the MVP scope, folder ownership, source-of-truth contract, no fabricated data, no silent API fallback, and validation expectations. Record the frontend requirements: minimal modern art direction, no UI gradients, restrained GSAP/ScrollTrigger motion, native scrolling, and reduced-motion support. It should tell future agents to read the handoff and contract before working. Do not copy the entire handoff into AGENTS.md.
4. A root README with team workflow and the planned local ports/frontend/backend folders.
5. A sensible root .gitignore for Node, Python, local env files, and local databases while allowing .env.example files.
6. A concise root CLAUDE.md pointing Marc's Claude session to AGENTS.md, this handoff, and contracts/API_CONTRACT.md. State that Marc owns backend/data/Render and Aarush owns frontend/GSAP/Vercel. Keep shared rules in AGENTS.md rather than duplicating them in two documents. Explain that both assistants commit/push checked milestones to their own branches under section 3.

Do not scaffold either app, install application dependencies, create cloud resources, deploy, or start a third category yet. Do not overwrite existing work or change the agreed scope. Validate fixture JSON and check the fixtures against the documented shapes and mode labels. If there is an internal inconsistency in the handoff, explain it and propose a minimal coordinated contract correction rather than silently selecting different shapes.

Validate the baseline, review the intended diff, and commit/push the shared baseline to the verified GitHub repository using section 3's Git policy. Use an initial main commit only if the remote is empty; preserve existing remote history and branch rules otherwise. This ordinary Git commit/push is authorized. Do not deploy or modify repository permissions. Report created files, checks, actual branch, commit SHA, and whether the push succeeded. If authentication is blocked, explain the next sign-in action without pretending it worked.
```

After Codex pushes Aarush's baseline to Aarush-x/DA-HACKS-5.0, Aarush reviews the result and Marc pulls/clones that same baseline. If the baseline was pushed to a bootstrap branch, merge it into the agreed shared base before splitting. Both confirm the contract and fixture commit before Aarush starts F1 in Codex and Marc starts B1 in Claude.

### Prompt F1 — Aarush: build the working frontend against fixtures

```text
Read AGENTS.md, GROCERY_MVP_CODEX_HANDOFF.md, contracts/API_CONTRACT.md, and the fixtures. I am Aarush and own frontend only. Marc is building the real FastAPI backend and database in backend/. Do not build or edit that backend or change the shared contract.

Implement the frontend in frontend/ with React, Vite, TypeScript, GSAP, @gsap/react, and ScrollTrigger. Use the project name ShelfSense for now. Follow section 7 of the handoff as a required design brief: minimal and modern, with the composition/typography/craft of a strong Awwwards site, while staying quiet and easy to use. No gradients anywhere in our UI. Use the specified solid off-white/charcoal/forest palette, deliberate typography, fine borders, a precise responsive grid, and restrained corner radii. Customize component primitives rather than shipping library defaults. No generic SaaS hero, glassmorphism, neon glows, decorative blobs, sparkle icons, excessive pills, bento filler, or oversized rounded cards. Put working search/results in the first viewport.

Implement the small GSAP motion system in section 7: subtle initial reveal, once-per-content-set ScrollTrigger result reveals, short state transitions, and a smooth ingredient drawer. Use scoped useGSAP cleanup, handle rapid state changes and React Strict Mode, respect prefers-reduced-motion, and preserve focus and content visibility. Keep native scrolling. No scroll hijacking, dramatic parallax, custom cursor, 3D, preloader, or extra animation framework. Animation must not delay searching or reading nutrition data. The interface must look good with motion disabled.

Implement the complete small flow: demo-store selection, bread/cereal search and category chips, priority controls (balanced/fiber/sodium), ranked product cards, two-product equal-weight comparison, and accessible sourced ingredient drawer. Add loading, missing values/images, empty results, ingredient 404, API error, timeout, and retry states. Clear compare selection on store/category changes. Keep comparison category-specific. Local shopping-list persistence is optional after the core works.

Use a typed data interface with mock and HTTP adapters. Follow the exact query/response/error shapes. Start with VITE_DATA_MODE=mock using frontend-owned copies of the shared fixtures. Mock behavior must respect store/category/query/priority and return the documented shapes; do not create another authoritative nutrition scoring system. The backend owns real ranking. Synthetic records must have a clear Sample product data banner. Store availability must always be marked simulated, including in API mode. Render null as Not provided and never as zero.

Implement VITE_API_BASE_URL as origin-only and append /api/v1 once. Add .env.example with mock mode and localhost:8000. No backend keys or database connections in frontend code. API errors must not silently become mock successes. Protect against stale asynchronous responses. Bundle fixtures/assets so frontend builds independently of files outside frontend/.

Create the app, install needed dependencies, and run the appropriate type/build checks. Add only focused checks for meaningful behavior. Do not deploy, edit backend/, change contract fields, add auth/chat/scanning, or leave controls as visual placeholders. Continue through routine fixes until the mock-backed happy path works. End with how to run it, what was tested, and any remaining integration needs.
```

### Prompt F2 — Aarush: review the interface after seeing it

```text
Read the frontend ownership rules and section 7's complete design/motion brief, then inspect the current frontend. Review the app around 375 px, 768 px, and 1440 px wide and improve the search/results/compare experience without expanding scope or modifying backend/ or the shared API contract.

Focus on useful information hierarchy, readable nutrition units and equal-weight labels, obvious recommendation tradeoffs, clear sample-versus-verified data labels, a persistent simulated-inventory notice, keyboard-accessible comparison/ingredient interactions, loading/error states, and consistent spacing. Remove placeholder UI that has no working action. Do not add new features, a marketing hero, fabricated data, or health-risk claims.

Apply a deliberate minimalist visual review: remove any UI gradients, component-library defaults, excessive badges/cards, decorative filler, heavy shadows, or generic AI-template styling. Improve typography, alignment, negative space, and the solid-color palette. Aim for Awwwards-level craft, not an elaborate effects demo. Use GSAP/ScrollTrigger only for the restrained reveal/transition system already specified. Keep native scrolling and ensure animation cleanup, content visibility, stable focus, and prefers-reduced-motion behavior.

Run the frontend build and the focused interaction checks. Test ordinary and reduced-motion modes, natural touch/keyboard scrolling, rapid priority changes, and drawer opening/closing. Report improvements and remaining observed problems. If browser verification is available, use it and inspect screenshots; otherwise state what could not be verified instead of claiming visual QA passed.
```

### Prompt F3 — Aarush: connect the real API

```text
Read the handoff, contract, and current frontend API adapter. Marc's backend is ready. Use the URL I provide below as the origin-only API base. If it is absent, prepare configuration and local checks but do not invent a deployed service or claim connection success.

BACKEND_ORIGIN: [paste actual localhost or Render origin]

Connect frontend API mode to the real endpoints. Preserve the mock adapter as an explicit sample mode. Check actual store and product response shapes, priority/category/query parameters, ingredient IDs, null handling, and simulation/data-quality labels. Remove any hardcoded mock ranking or explanations from the API rendering path. Cancel or ignore stale requests. Display useful HTTP/network/timeout errors with Retry. Never silently fall back to fixtures.

Use a real browser flow if available to verify search, priority switch, compare, and ingredient opening. A direct API request is not enough to establish browser CORS behavior. If backend behavior disagrees with the contract, report the exact mismatch for Marc; do not modify backend/ or independently rename shared fields. Continue any frontend-only fixes that do not depend on that mismatch. Run build/type checks and report whether the integration was actually verified.

Preserve section 7's minimalist styling and restrained GSAP motion during integration. API updates must not cause repeated scroll reveals, focus loss, or invisible results.
```

### Prompt F4 — Aarush: apply the updated design brief if building has already started

```text
I have updated GROCERY_MVP_CODEX_HANDOFF.md with a stronger visual direction. Read section 7 fully, inspect AGENTS.md and the current frontend, and apply this refinement to the existing app. Preserve working functionality and the shared API contract; do not restart the project or edit backend/.

Make the interface minimalist, modern, and deliberately art-directed, aiming for the typography, spacing, composition, and execution of a strong Awwwards site without an elaborate showcase. No gradients in our UI. Use the defined solid warm-neutral/charcoal/forest palette, a precise grid, deliberate typography, subtle borders, and restrained radii. Remove generic SaaS hero styling, glows, glassmorphism, decorative blobs, arbitrary bento layouts, excessive pills, and untouched component-library defaults. Search and product choices stay immediately accessible.

Use GSAP with @gsap/react and ScrollTrigger for subtle scroll-triggered reveals and short state/drawer transitions, following the motion budget in section 7. Keep native scrolling. No scroll hijacking, custom cursor, dramatic parallax, 3D, preloader, or extra animation framework. Scope and clean up animations, handle React Strict Mode and rapid filter changes, respect prefers-reduced-motion, and keep all content visible and keyboard-accessible. The layout must look complete without animation.

Review at phone, tablet, and desktop sizes; check for overflow and contrast, then test reduced-motion mode, scrolling, priority changes, and the ingredient drawer. Run the build/type checks and focused existing tests. Report what was improved and what you actually verified. Update frontend design guidance in an existing AGENTS.md if needed, preserving unrelated rules; do not alter backend ownership or invent new features.
```

### Prompt B1 — Marc in Claude: build the backend and data layer

```text
Read CLAUDE.md, AGENTS.md, GROCERY_MVP_CODEX_HANDOFF.md, contracts/API_CONTRACT.md, and the fixtures from my local checkout. I am Marc using Claude, the backend/data owner for https://github.com/Aarush-x/DA-HACKS-5.0. Aarush uses Codex for frontend/. Do not ask me to install Codex. If this Claude session lacks local file/terminal access, state that limitation and provide the concrete changes/commands for me to apply locally; do not claim edits or pushes you cannot perform. Implement only backend/ and coordinated backend documentation; do not edit frontend/ or independently change contract fields. Follow section 3's checked milestone commit/push policy on my backend branch when tools and authentication permit.

Build a small Python FastAPI backend with Pydantic models matching the agreed v1 contract. Implement GET /healthz, GET /api/v1/stores, GET /api/v1/products, and GET /api/v1/ingredients/{id}. Implement the exact store/category/query/priority filtering, category-local rankings, null handling, metadata, and error envelope, including normalized 422 errors. Unknown products/ingredients/stores must not become fabricated successes.

Implement deterministic normalization and ranking on the backend using the exact proposed heuristic and mode requirements in the handoff. Return per-serving, per-100g, and per-reference values, component contributions, concrete reasons/tradeoffs, and missing fields. The frontend must not need to calculate authoritative rankings. Do not rank across categories or treat total sugar as added sugar. No automatic penalties for preservatives, seed oils, ingredient count, or organic status.

Start with explicit CATALOG_STORAGE=seed using committed backend/data records so the first integrated flow is available quickly. Mark unverified or fictional development records honestly. Prepare a simple managed-Postgres storage path using SQLAlchemy and a compatible driver if time allows; this is the target persistence option, not a prerequisite to serving the first six rows. Use DATABASE_URL only in backend configuration. Never rely on an ephemeral SQLite file as durable Render persistence or silently hide database failure. If Postgres is implemented, provide an idempotent seed command and a documented schema initialization/migration step. Keep read-only catalog/ingredient/demo-store data only; no accounts or user-profile tables.

Configure CORS_ORIGINS as a JSON array of exact allowed origins, defaulting locally to http://localhost:5173. No credentialed requests are needed. Add .env.example, dependency pinning compatible with Render, a setup README, and the start command uvicorn app.main:app --host 0.0.0.0 --port $PORT. All deployable runtime data must be inside backend/ or the database.

Write focused checks for normalization/units, null and missing sugar, ranking monotonicity and tie behavior, filtering, response shapes, and errors. Start the local API and verify the first happy path. Do not scrape Walmart, invent citations/verified labels, add an LLM, edit frontend/, provision paid resources, or deploy yet. Report working endpoints, local commands, checks, storage status, and the response details Aarush needs.
```

### Prompt B2 — Marc in Claude: finish the six real products and ingredient content

```text
I am Marc using Claude. Read CLAUDE.md, AGENTS.md, the handoff, shared contract, and existing backend data in my Aarush-x/DA-HACKS-5.0 checkout. Finish the small demo catalog: three breads and three ready-to-eat cereals, with approximately four to six useful ingredient explanations. Follow the checked milestone commit/push policy on my backend branch; report actual tool limitations instead of claiming unperformed actions.

Use current exact US package/manufacturer/SmartLabel information and matching USDA/Open Food Facts records as needed. Keep nutrition and ingredients aligned to the same formulation and serving mass. Record source URLs and review dates. Do not scrape protected retailer pages, bypass protections, invent values, infer added sugar from total sugar, or mark a record verified without actually checking it. If access or data is missing, list the exact fields I need to supply manually and continue with independent work. Fictional fixtures stay synthetic and must not be relabelled as real branded products.

Create two explicitly simulated store assortments with enough variation to demonstrate filtering while retaining at least two comparable items in each supported category where possible. Do not invent physical branch stock or price. Produce ingredient explanations that state function, evidence, uncertainty, practical context, and references without fear-based blanket claims. Sources must support the specific text.

Run validation and ranking checks on the actual completed dataset. Identify a truthful demo comparison and show whether switching fiber/sodium priority changes a recommendation. Do not manipulate labels to force a result. Export an API-shaped reviewed snapshot for Aarush to use as an explicitly labelled offline demo if useful, coordinating the destination with him. Report unresolved fields, label/content verification status, and any restrictions on image reuse. Stay within backend ownership.
```

### Prompt I1 — Aarush only: integration after both branches are merged

```text
I am Aarush, coordinating integration for Aarush-x/DA-HACKS-5.0. Read the handoff, AGENTS.md, and shared API contract. The frontend and backend branches have been merged. Marc owns backend development; coordinate this integration task so we do not edit the same files simultaneously. I am authorizing integration fixes across frontend/ and backend/ for this task, while preserving the agreed public API contract and unrelated work.

Run the existing apps and verify the whole story: browser -> frontend API adapter -> FastAPI -> configured seed/database storage -> normalized/ranked response -> comparison and ingredient UI. Check bread/cereal queries, store changes, priority switching, missing data, unknown ingredients, error states, and explicit mock mode. Verify label and simulated-inventory indicators are accurate in both modes. Check for stale response races and frontend/backend contract drift. If Postgres is configured, verify it is actually used and that data survives a service restart or can be reloaded through the documented seed process.

Fix observed integration issues with the smallest coherent changes. Do not add features, silently relax the API contract, replace real data with mocks, or claim browser/database verification without doing it. Run frontend build/type checks and the meaningful backend tests. Report exactly what passed, what remains blocked, the active data/storage modes, and the steps required for the Vercel/Render deployment. Do not provision services or deploy from this prompt.
```

### Prompt D1 — Marc in Claude: prepare Render deployment

```text
I am Marc using Claude and own the Render backend deployment. Read CLAUDE.md, AGENTS.md, and the deployment section of GROCERY_MVP_CODEX_HANDOFF.md; inspect the tested backend in my Aarush-x/DA-HACKS-5.0 checkout. Prepare it for a Render Web Service using root directory backend/, health path /healthz, build pip install -r requirements.txt, and start uvicorn app.main:app --host 0.0.0.0 --port $PORT. Verify these commands match the actual implemented module structure and compatible Python/dependency versions. Commit/push checked preparation files to my backend branch under section 3; this does not itself authorize a cloud deployment.

Document the exact environment variable names, CORS_ORIGINS JSON format, storage selection, database setup/seed steps if used, and smoke checks. Check that all runtime files are available within the configured service root. Explain any free-tier cold-start or persistence constraints that affect the demo using current official Render documentation.

Prepare configuration and commands now, but do not create paid resources, publish, or deploy without my separate deployment instruction. Do not print secret values. End with the exact Render dashboard settings I should enter and the final HTTPS origin I need to send Aarush once I deploy.
```

### Prompt D2 — Aarush: prepare Vercel deployment

```text
I am Aarush and own the Vercel frontend deployment. Read the handoff deployment section and inspect the tested frontend in Aarush-x/DA-HACKS-5.0. Prepare a Vercel Vite deployment from root directory frontend/, build npm run build, output dist, using the committed lockfile. Configure an SPA fallback only if the app's implemented path-based routing requires one, then verify nested route refresh behavior if applicable.

Use VITE_DATA_MODE=api and VITE_API_BASE_URL set to the actual Render origin I provide below. These are public build-time variables; no database secrets or API keys belong here. Keep explicit sample mode available. Do not invent a live backend URL.

BACKEND_ORIGIN: [paste actual Render origin]

Run a production build. Document Vercel dashboard settings, environment variables for the intended preview/production environment, and the exact deployed frontend origin that Marc must add to Render CORS. Explain that changing Vite env values requires a new build. Do not edit backend configuration or mask CORS errors with no-cors requests.

Prepare everything locally now, but do not create paid resources or deploy without my separate deployment instruction. Report build results, any remaining blockers, and the exact dashboard steps.
```

### Optional release prompt — only after you have reviewed the result

```text
Deploy the reviewed commit using the Vercel/Render project and environment I explicitly identify below. Reuse the prepared settings and existing resources. Do not create paid resources or modify unrelated projects. If the necessary service/account access is unavailable, give me the exact remaining dashboard steps instead of claiming success.

TARGET_SERVICE_AND_ENVIRONMENT: [identify frontend/backend, exact existing project/service, and preview/production]
REVIEWED_COMMIT: [commit SHA]

After deployment, verify the actual URL, data mode, inventory disclosure, and relevant happy path. For frontend integration, test the browser-origin connection to Render rather than only curling the API. Report the deployed commit, URL, observed status, checks performed, and any limitation. A recording or mock flow alone does not establish a successful live backend integration.
```

### Resume prompt — use when opening a fresh Codex chat

```text
Read AGENTS.md, GROCERY_MVP_CODEX_HANDOFF.md, contracts/API_CONTRACT.md, the current README, and recent relevant Git changes. Inspect the current implementation before editing; do not start over or assume every planned feature exists.

I am [Aarush using Codex in my existing DA hacks Mac folder / Marc using Claude in my own local checkout]. If using Claude, also read CLAUDE.md explicitly. Keep work in the current intended folder and use the existing GitHub remote. Follow section 3's checked milestone commit/push policy; report the branch, commit SHA, and actual push result. Do not claim access to another computer's folder or assume the assistants share memory.

My role is [frontend/backend/integration]. Continue only within that role's ownership unless I explicitly authorize a coordinated integration change. The committed scope is two categories and six products, with real reviewed product facts where available and visibly simulated store availability. The frontend deploys to Vercel; backend to Render.

For frontend work, follow section 7: minimal modern art direction, no UI gradients, restrained GSAP/ScrollTrigger motion, native scrolling, and reduced-motion support. Preserve the existing functional app instead of restarting it.

Current next task: [describe one concrete remaining task].

Identify the relevant state briefly, then complete that task, run appropriate checks, preserve unrelated work, and report actual results and blockers. Do not invent previous progress, sources, credentials, or deployed URLs.
```

## 11. What Aarush sends Marc now

Send Marc this handoff, the existing repository URL **https://github.com/Aarush-x/DA-HACKS-5.0**, and the bootstrap commit after Codex pushes Aarush's baseline. Marc should pull that commit into his own checkout, give Claude the shared files including CLAUDE.md, read the ownership table in section 1, and run B1 in Claude on his backend branch. Marc does not need Codex or the same app as Aarush. Agree on the contract before splitting implementation.

Marc's first backend handoff to Aarush should contain: endpoint origin, example catalog response, supported IDs/priority values, storage mode, label verification status, and remaining missing data. Aarush's frontend handoff to Marc should contain: demo origin, exact CORS origin, active data mode, and any concrete response mismatch.

Keep source-of-truth docs in Git. A chat summary is helpful but should not override the current committed contract or verified dataset.

## 12. Reference links

These support setup and the research context. Platform behavior can change; check the official documentation when deploying.

- Codex local environments and built-in commit/push controls: https://learn.chatgpt.com/docs/environments/local-environment
- Local project folders and primary Git root: https://learn.chatgpt.com/docs/projects?surface=app
- Vite deployment on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Vercel monorepos: https://vercel.com/docs/monorepos
- Vite environment variables: https://vite.dev/guide/env-and-mode
- GSAP with React and useGSAP cleanup: https://gsap.com/resources/React/
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP responsive/reduced-motion setup: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/
- FastAPI deployment on Render: https://render.com/docs/deploy-fastapi
- Render monorepo support: https://render.com/docs/monorepo-support
- Render deployment/persistence behavior: https://render.com/docs/deploys
- Render free-service limitations: https://render.com/docs/free
- FastAPI CORS: https://fastapi.tiangolo.com/tutorial/cors/
- Walmart Marketplace item search: https://developer.walmart.com/us-marketplace/reference/getsearchresult
- Walmart I/O: https://walmart.io/
- Restricted Scintilla access: https://developer.walmartdataventures.com/apis/docs/nrt-getting-started
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide/
- Open Food Facts API: https://openfoodfacts.github.io/openfoodfacts-server/api/
- SmartLabel: https://smartlabel.org/product-search/
- FDA ingredient functions: https://www.fda.gov/food/food-additives-and-gras-ingredients-information-consumers/types-food-ingredients
- FDA label comparison guidance: https://www.fda.gov/food/nutrition-facts-label/lows-and-highs-percent-daily-value-nutrition-facts-label
- Yuka capabilities: https://yuka.io/en/app/
- Official event judging: https://guide.deanzahacks.com/judging

Research context: Walmart has documented localized grocery services, but this team has not established working authorized branch-level access. The event's retrieved judging rubric allocated 25% each to functionality, creativity/originality, theme fit, and presentation. The supplied theme is Modern Life / Nature Life; the exact theme wording was not independently established from the retrievable official themes page. Present this project primarily through its everyday Modern Life use. No app or deployment has been created by producing this handoff.
