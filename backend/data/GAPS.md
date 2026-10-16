# Data status — 24-product catalog

The seed now holds **24 real products** (12 bread + 12 cereal), each with a
source and access date, `label_status: "unverified"` until checked against a
physical package. Store A carries all 24; Store B carries 16 (8 + 8) to show
filtering.

## Owner-confirmed from packages (2026-10-16)
- Dave's Powerseed serving 42 g · Dave's 21 serving 45 g · Martin's Potato 32 g
- Original Cheerios serving 39 g · Honey Bunches of Oats 41 g / 190 mg sodium
- Lucky Charms serving 36 g
- Nature's Own Honey Wheat fiber 1 g · Special K fiber 0 g
- Raisin Bran sat fat 0 g · Cinnamon Toast Crunch sat fat 0 g · Froot Loops sat fat 0.5 g
- Great Value White ingredient list (no HFCS; enriched flour + sugar)

## Still optional (non-blocking)
- **Barcodes (UPC)** — all `null`; add 12-digit UPCs if we want them.
- **Saturated fat** on Honey Bunches of Oats is a best estimate (0.5 g) — confirm if handy.
- **Ingredient card sources** — the 11 cards in `ingredients.json` are factual
  but `content_status: "draft"` with empty `sources`; add references to mark `reviewed`.
- Flip each record `unverified` → `verified` (+ `label_verified_at`) as packages are checked.

## Provenance
Full per-product source URLs live in each record's `sources` array. A human-readable
candidate table (with per-field sourcing) is in `CANDIDATES.md`.
