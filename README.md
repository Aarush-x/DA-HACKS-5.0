# barelabel

Compare grocery products by what matters to you, at the same weight.

barelabel lets shoppers search bread and cereal, pick a priority (balanced, more fiber, less sodium, high protein, low calorie, low sugar, or low saturated fat), and see products ranked side by side at an equal weight. Every ranking comes with plain reasons, every ingredient has a short sourced explanation, and data quality is always visible.

Built for DA Hacks 5.0 by Aarush and Marc.

**Live site:** https://barelabel.vercel.app
**API:** https://shelfsense-api-oxkg.onrender.com (docs at `/docs`)

## Features

- **Search and filter** 24 real US products (12 bread, 12 cereal) across two demo stores.
- **Seven priority modes** that actually re-rank results, so the recommendation changes with your goal.
- **Equal-weight comparison** at 50 g for bread and 40 g for cereal, with calories, protein, fiber, sugars, saturated fat, and sodium, plus %DV context from FDA Daily Values.
- **Transparent ranking** with reasons and tradeoffs, never a single "percent healthy" score.
- **Ingredient explanations** for 70 ingredients, each with a one line summary, an evidence level, and links to sources such as the FDA, NIH, USDA, and EFSA.
- **Honest data labels** showing whether a product label is verified, unverified, or sample data.
- **Search on Walmart** link for each product.

## Tech stack

**Frontend**
- React 19 with TypeScript
- Vite 7
- GSAP with `@gsap/react` for restrained motion
- Vitest and Testing Library for tests
- Hosted on Vercel

**Backend**
- Python 3.12
- FastAPI and Uvicorn
- Pydantic v2 and pydantic-settings
- pytest for tests
- Hosted on Render

**Data**
- Seed catalog stored as JSON in `backend/data/` (products, stores, ingredients)
- Product data sourced from manufacturer pages, SmartLabel, and Open Food Facts
- Ingredient explanations sourced from FDA, USDA Dietary Guidelines, NIH, the Code of Federal Regulations, and EFSA

## How it works

```
Browser  ->  React app (Vercel)  ->  FastAPI (Render)  ->  seed JSON catalog
                                         |
                                         +-- normalize nutrients to equal weight
                                         +-- rank within each category by priority
                                         +-- return products, reasons, and sources
```

The backend owns all nutrition math and ranking. The frontend only displays what the API returns. Both sides follow the shared API contract in `contracts/API_CONTRACT.md`.

## Project structure

```
frontend/     React app (UI, API client, mock data, tests)
backend/      FastAPI service (ranking, normalization, seed data, tests)
contracts/    Shared API contract and example fixtures
docs/         Ingredient glossary with sources
```

## Run locally

**Backend** (http://localhost:8000)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:5173)

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_DATA_MODE=api` in `frontend/.env` to use the local backend, or keep `mock` to use bundled sample data.

## Tests

```bash
cd backend && source .venv/bin/activate && pytest -q
```

```bash
cd frontend && npm test
```

## API overview

| Endpoint | Purpose |
|---|---|
| `GET /healthz` | Health check |
| `GET /api/v1/stores` | The two demo stores |
| `GET /api/v1/products?store_id=...&category=...&q=...&priority=...` | Ranked products for a store and priority |
| `GET /api/v1/ingredients` | All ingredient explanations |
| `GET /api/v1/ingredients/{id}` | One ingredient explanation |

## Data notes

- Store availability is simulated. barelabel does not show live stock or prices, and no affiliation with Walmart is implied.
- Product labels are marked `unverified` until checked against the physical package. Labels can change when a product is reformulated.
- Missing values are shown as "Not provided", never as zero.
- Rankings reflect the selected priority, not a medical or universal health rating.

## Team

- **Aarush:** frontend, design, and Vercel deployment
- **Marc:** backend, data, ranking, and Render deployment
