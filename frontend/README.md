# barelabel frontend

F1 mock-backed React/Vite/TypeScript app. Aarush owns this folder; Marc owns the separate backend. No backend or deployment is included here.

## Run locally

Use Node 22.12+ (validated with Node 26.0.0) and npm. From this folder:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). For future API mode, use http://localhost:5173 in the browser to match Marc's planned local CORS origin, or explicitly coordinate the exact origin.

```sh
npm test
npm run build
npm run preview
```

`npm run build` runs strict TypeScript checks and creates `dist/`. The frontend builds independently; its fixture copies are under `src/mocks/`.

## Data modes

- `VITE_DATA_MODE=mock` is the default. Six fictional products, both simulated assortments, precomputed priority order, and a synthetic ingredient card. The sample banner stays visible.
- `VITE_DATA_MODE=api` uses the HTTP adapter. Set `VITE_API_BASE_URL` to the actual backend origin only (local example: `http://localhost:8000`). No path, credentials, query or hash. `/api/v1` is appended once. No keys or database settings belong in frontend variables.
- To use Marc's current Render service, copy `api.env.example` to `.env.local`, run `npm run dev -- --host localhost --port 5173`, and open `http://localhost:5173`. The backend's CORS configuration currently allows that exact browser origin.
- Restart Vite after changing environment settings; rebuild for production. No implicit API-to-mock fallback. Errors and 30-second timeouts have explicit Retry actions.
- Production deployment is not part of F1. Explicitly choose the data mode for a public build.

Search is submitted with Enter or Search. Bread/cereal searches select the matching category; other queries intersect the current category. Category chips clear search and comparison. Store changes clear comparison. Select up to two visible products in one category. Null values remain “Not provided”. Ingredient sources remain visibly unreviewed when empty.

The mock adapter filters frontend-owned copies of the shared snapshots and renumbers category-local ranks. It does not calculate a nutrition score. Fixture changes must be coordinated with the shared contract. API mode displays the backend's rankings and reasons.

## Verification

Focused tests cover filtering, store assortments, ranking snapshots, missingness, query validation, ingredient 404, HTTP errors/timeouts/cancellation, stale responses, comparison selection, search, and drawer focus return. Unit interaction tests stub motion; real-browser checks are needed for native dialog focus trapping and GSAP visuals. The interface uses native scrolling, scoped GSAP cleanup, and reduced-motion preferences.

API mode validates successful store, catalog, and ingredient responses before rendering them. A malformed success response appears as a contract error instead of partially rendering unsafe assumptions.

### F1 verification record

- Strict TypeScript and Vite production build passed.
- 13 focused tests passed; dependency audit reported zero vulnerabilities after updating Vitest.
- Browser inspected at 375, 768 and 1440 px: no document horizontal overflow. Verified priority switching (including rapid changes), store filtering, equal-weight comparison, ingredient content, Escape dismissal and focus return to the opener. No browser warnings/errors were observed in that session.
- Reduced-motion branches are implemented and the nonanimated close path is exercised by interaction tests. Full browser reduced-motion emulation and physical touch-device testing were not performed. Live backend/CORS integration remains F3.

### F2 review and verification

- Compacted the phone header and controls: at 375×812 the first product starts near 630 px instead of 770 px. Buttons have a 44 px minimum height; mobile text inputs/selects use 16 px text. The simulated-inventory disclosure stays visible while scrolling.
- Product columns adapt to the result count and available width. A two-product store assortment fills the tablet row. Tradeoff copy has a quiet rule for emphasis; no gradients or decorative imagery were added.
- A comparison shortcut appears after selection and moves focus to the existing comparison heading only when activated. Priority updates preserve keyed product cards, disable stale card actions while pending, and do not repeat an already-seen content set's entrance reveal. Drawer cleanup restores focus without an extra scroll request.
- 15 focused tests, strict TypeScript, and the production build pass. Browser screenshots were inspected at 375, 768, and 1440 px, with no document horizontal overflow. Browser checks covered rapid priority changes, store filtering, comparison navigation, native keyboard scrolling, drawer opening/closing/Escape/focus return, and deliberate API failure/retry without mock fallback.
- Development-only browser scenarios are available at `/tests/visual.html?motion=reduce` and `/tests/visual.html?scenario=error` while Vite runs. They are excluded from `dist/`. The motion scenario simulates the JavaScript media preference before loading the app; card transforms were absent and the nonanimated drawer close path worked. It does not change OS preferences or emulate the browser's CSS media engine.
- Physical touch scrolling and native OS reduced-motion settings were not tested. Native scrolling is retained with no scroll interception. Live API/CORS verification remains F3; Kluster review was unavailable.

### F3 live API verification

- Connected API mode to `https://shelfsense-api-oxkg.onrender.com` through the committed `api.env.example`. Mock mode remains the default in `.env.example` and never activates automatically after an API error.
- The HTTP adapter now validates successful store, catalog, and ingredient responses against the v1 fields used by the frontend. Contract violations produce an explicit 502-style frontend error rather than partial rendering.
- Direct HTTPS checks passed for `/healthz`, stores, both categories, both store assortments, all three priorities, unsupported search, ingredient success, ingredient 404, unknown-store 404, and invalid-priority 422. Responses reported `storage_mode=seed`, simulated inventory, and unverified product labels.
- Browser-to-API checks passed from the exact allowed origin `http://localhost:5173`: CORS, bread/cereal switching, rapid priority changes, store B filtering, empty search, two-product equal-weight comparison, and ingredient loading. The production build made successful Render requests with no browser console messages.
- “Less sodium” changes the live cereal order: Original Cheerios, Frosted Flakes, then Honey Nut Cheerios. The bread order happens to be unchanged across the current priorities because its fiber and sodium values favor the same order.
- Fixed API-mode footer copy that incorrectly described live responses as fictional mock labels. The UI now keeps label verification separate from connectivity and continues to disclose simulated store availability.
- The Render catalog is still marked unverified. Ingredient cards are draft content with empty reference lists, so the UI truthfully shows “Sources not yet reviewed.” This integration does not establish manual label/content verification, PostgreSQL use, Vercel deployment, or production Vercel-to-Render CORS.
