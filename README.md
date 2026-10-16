# ShelfSense — DA Hacks 5.0

Shared planning baseline only; neither application is scaffolded or deployed.

Read [the handoff](GROCERY_MVP_CODEX_HANDOFF.md), [shared rules](AGENTS.md), and [API contract](contracts/API_CONTRACT.md). [Fixtures](contracts/fixtures/README.md) contain fictional sample data, not verified food labels. Store availability is always simulated; no Walmart affiliation is implied.

## Team workflow

Confirm this baseline together before splitting work. Aarush uses Codex on `frontend/aarush-mvp` for F1 → F2 → F3; Marc uses Claude on `backend/marc-mvp` for B1 → B2. Marc also reads CLAUDE.md. Create owner branches from the shared main baseline in each person's checkout. Submit small PRs; Aarush coordinates I1 after merging. Marc prepares Render (D1); Aarush prepares Vercel (D2). Deployment is a separate authorized step. See handoff section 3 for checked commit/push policy.

Repository: https://github.com/Aarush-x/DA-HACKS-5.0.git. Aarush works in the existing DA hacks folder; never create a nested clone. Marc uses his own checkout. Assistants share committed files, not chat memory.

## Planned local layout

- `frontend/`: React + Vite + TypeScript, GSAP; localhost:5173; Vercel root frontend.
- `backend/`: FastAPI + Pydantic; localhost:8000; Render root backend. Begin with committed seed data; Postgres optional.
- `contracts/`: shared API and fixed development fixtures. Runtime apps must bundle their own needed assets inside their deployment root.

No install/start commands exist yet. Default frontend development will use explicit mock mode. API mode uses an origin-only VITE_API_BASE_URL and never silently falls back. Marc's localhost is not reachable as Aarush's localhost; run the pulled backend locally or use an explicitly supplied reachable origin.

Scope: two categories, six products, equal-weight comparisons, priority tradeoffs, ingredient explanations. Final real labels require manual verification by Marc. No secrets in VITE_* or Git.
