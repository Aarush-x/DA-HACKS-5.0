# Shared project rules

Read GROCERY_MVP_CODEX_HANDOFF.md and contracts/API_CONTRACT.md before working. The contract is the shared API source of truth; coordinate any changes with both humans and update fixtures together.

- MVP: bread and cereal, three products each, two visibly simulated Walmart demo branches. No accounts, checkout, scraping, runtime retailer integration, LLM scoring, or third category.
- Aarush uses Codex: owns frontend/, React/Vite/TypeScript, GSAP/UI, Vercel, and coordinated integration. Marc uses Claude: owns backend/, FastAPI, data, ranking, and Render. Do not edit the other owner's folder without explicit coordination. Root docs and contracts are shared.
- Never fabricate real product facts, sources, verified labels, stock, or prices. Fictional fixtures remain synthetic with empty sources. Null means missing, never zero. Rank within categories at equal weight; backend owns authoritative ranking.
- Mock mode must show Sample product data; all modes disclose simulated availability. Never silently fall back from API to mocks. Surface errors and Retry.
- Frontend: minimal modern art direction, no UI gradients, restrained GSAP/@gsap/react/ScrollTrigger motion, native scrolling, reduced-motion support, accessible keyboard/focus behavior. Follow handoff section 7.
- Validate JSON shapes, normalization, nulls, priority ordering, filtering and mode labels. Future apps require relevant build/type, backend and interaction checks. Report actual verification limits; no deployment claims from local checks.
- Follow handoff section 3: checked milestones use frontend/aarush-mvp or backend/marc-mvp after baseline. Inspect diffs, stage explicit task paths, commit and push to verified origin. Preserve unrelated work and remote history; no force pushes. Coordinate small PRs and integration; deployment requires separate authorization.
- Never commit secrets, local environments, caches or build outputs. No dependencies or app scaffolding in the shared baseline.
