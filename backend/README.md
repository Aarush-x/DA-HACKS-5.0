# ShelfSense backend

FastAPI service for the grocery comparison MVP. Implements the v1 contract in
[`../contracts/API_CONTRACT.md`](../contracts/API_CONTRACT.md). The backend owns
all normalization and ranking; the frontend only renders what it returns.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Liveness: `{"status":"ok","api_version":"1"}` |
| GET | `/api/v1/stores` | The two simulated demo branches |
| GET | `/api/v1/products` | Ranked catalog for a store/category/query/priority |
| GET | `/api/v1/ingredients/{ingredient_id}` | One ingredient explanation |

### `/api/v1/products` query parameters

- `store_id` **(required)** — `demo-store-a` or `demo-store-b`
- `category` *(optional)* — `bread` or `cereal`
- `q` *(optional)* — case-insensitive search over category/name/brand, max 100 chars
- `priority` *(optional)* — `balanced` (default), `fiber`, or `sodium`

An invalid enum or over-long `q` returns `422`; an unknown well-formed
`store_id` returns `404`; all errors use the shared envelope
`{"error":{"code","message","request_id"}}`.

## Run locally

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/healthz
- Interactive docs: http://localhost:8000/docs
- Example: http://localhost:8000/api/v1/products?store_id=demo-store-a&priority=fiber

## Tests

```bash
cd backend
source .venv/bin/activate
pytest -q
```

Tests cover normalization and units, null/missing handling (including added
sugar), ranking monotonicity and tie-breaks, category/store filtering, response
shapes, and the error envelope.

## Data and storage

- `CATALOG_STORAGE=seed` (default) loads committed JSON from `data/`:
  `stores.json`, `products.json`, `ingredients.json`.
- The current `data/` records are **synthetic development data** (fictional
  brands, `label_status: "synthetic"`, empty sources). They exercise the full
  flow and a real fiber-vs-sodium tradeoff. Real verified product labels and
  sourced ingredient content are added in milestone B2.
- `CATALOG_STORAGE=postgres` is reserved for the optional managed-database path
  and currently fails fast with a 503 rather than pretending to work.

## Deploy (Render, prepared in D1)

- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/healthz`
- Set `CORS_ORIGINS` to a JSON array including the real Vercel origin.
