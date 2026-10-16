# ShelfSense frontend

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
- Restart Vite after changing environment settings; rebuild for production. No implicit API-to-mock fallback. Errors and 30-second timeouts have explicit Retry actions.
- Production deployment is not part of F1. Explicitly choose the data mode for a public build.

Search is submitted with Enter or Search. Bread/cereal searches select the matching category; other queries intersect the current category. Category chips clear search and comparison. Store changes clear comparison. Select up to two visible products in one category. Null values remain “Not provided”. Ingredient sources remain visibly unreviewed when empty.

The mock adapter filters frontend-owned copies of the shared snapshots and renumbers category-local ranks. It does not calculate a nutrition score. Fixture changes must be coordinated with the shared contract. API mode displays the backend's rankings and reasons.

## Verification

Focused tests cover filtering, store assortments, ranking snapshots, missingness, query validation, ingredient 404, HTTP errors/timeouts/cancellation, stale responses, comparison selection, search, and drawer focus return. Unit interaction tests stub motion; real-browser checks are needed for native dialog focus trapping and GSAP visuals. The interface uses native scrolling, scoped GSAP cleanup, and reduced-motion preferences.

F3 still requires Marc's reachable API, contract-compatible responses, and a browser-origin CORS check. Synthetic fixture success does not establish live API, verified label, database, or deployment success.

### F1 verification record

- Strict TypeScript and Vite production build passed.
- 13 focused tests passed; dependency audit reported zero vulnerabilities after updating Vitest.
- Browser inspected at 375, 768 and 1440 px: no document horizontal overflow. Verified priority switching (including rapid changes), store filtering, equal-weight comparison, ingredient content, Escape dismissal and focus return to the opener. No browser warnings/errors were observed in that session.
- Reduced-motion branches are implemented and the nonanimated close path is exercised by interaction tests. Full browser reduced-motion emulation and physical touch-device testing were not performed. Live backend/CORS integration remains F3.
