# Product candidates for seed storage — review before we finalize

24 real products (12 bread + 12 cereal), researched 2026-10-16. Values are
**per labeled serving** (that's what goes in `nutrition_per_serving`; the backend
normalizes to per-100g and per-reference). All would be stored
`label_status: "unverified"` with their source until you eyeball a package.

Legend: `whole` = first grain is whole (T/F). `✓` solid across sources ·
`⚠` needs a quick confirm (see the list at the bottom). Sugar columns:
**add** = added, **tot** = total. Mass in g, sodium in mg.

## Bread  (reference 50 g)

| # | Product | Brand | serv g | fiber | prot | add | tot | Na | sat | whole | flag |
|---|---------|-------|------:|----:|---:|--:|--:|---:|---:|:---:|:--:|
| 1 | 100% Whole Wheat | Nature's Own | 26 | 2 | 4 | 0.5 | 0.5 | 110 | 0 | T | ✓ |
| 2 | Powerseed Organic | Dave's Killer Bread | 42 | 4 | 5 | 1 | 1 | 130 | 0 | T | ⚠ grams |
| 3 | Classic White | Sara Lee | 57 | 2 | 4 | 2 | 3 | 270 | 0 | F | ✓ |
| 4 | Classic White | Wonder | 57 | 3 | 5 | 5 | 5 | 180 | 0 | F | ✓ |
| 5 | Whole Grains 100% Whole Wheat | Arnold | 43 | 3 | 4 | 2 | 3 | 170 | 0 | T | ✓ |
| 6 | 21 Whole Grains & Seeds | Dave's Killer Bread | 45 | 4 | 6 | 4 | 4 | 170 | 0 | T | ⚠ grams+values |
| 7 | Honey Wheat | Nature's Own | 31 | <1 | 3 | 2 | 2 | 110 | 0 | F | ⚠ fiber <1g |
| 8 | White Bread | Great Value (Walmart) | 26 | 0 | 2 | 1 | 1 | 150 | 0 | F | ⚠ ingredients+Na |
| 9 | Farmhouse Hearty White | Pepperidge Farm | 49 | 1 | 4 | 4 | 4 | 230 | 0 | F | ✓ |
| 10 | Whole Grain White | Sara Lee | 57 | 3 | 5 | 2 | 3 | 290 | 0 | F | ✓ |
| 11 | Whole Grains 100% Whole Wheat | Oroweat/Brownberry | 43 | 3 | 4 | 3 | 3 | 160 | 0 | T | ✓ |
| 12 | Potato Bread | Martin's | 32 | 1 | 3 | 2 | 3 | 105 | 0 | F | ⚠ grams (no g on label) |

## Cereal  (reference 40 g)

| # | Product | Brand | serv g | fiber | prot | add | tot | Na | sat | whole | flag |
|---|---------|-------|------:|----:|---:|--:|--:|---:|---:|:---:|:--:|
| 1 | Original Cheerios | General Mills | 40 | 4 | 5 | 1 | 2 | 190 | 0.5 | T | ⚠ grams |
| 2 | Honey Nut Cheerios | General Mills | 37 | 3 | 3 | 12 | 12 | 210 | 0 | T | ✓ |
| 3 | Frosted Flakes | Kellogg's | 37 | 1 | 2 | 12 | 12 | 190 | 0 | F | ✓ |
| 4 | Corn Flakes | Kellogg's | 42 | 1 | 3 | 4 | 4 | 300 | 0 | F | ✓ |
| 5 | Special K Original | Kellogg's | 39 | <1 | 7 | 4 | 5 | 270 | 0 | F | ⚠ fiber <1g |
| 6 | Raisin Bran | Kellogg's | 59 | 7 | 5 | 9 | 18 | 210 | 0.5 | T | ⚠ sat fat |
| 7 | Honey Bunches of Oats, Honey Roasted | Post | 30 | 1 | 2 | 5 | 6 | 136 | 0.5 | F | ⚠ grams+sat |
| 8 | Cinnamon Toast Crunch | General Mills | 31 | 2 | 2 | 8 | 9 | 176 | 1 | T | ⚠ sat fat |
| 9 | Froot Loops | Kellogg's | 39 | 2 | 2 | 12 | 12 | 210 | 1 | T | ⚠ sat fat |
| 10 | Rice Krispies | Kellogg's | 40 | 0 | 3 | 4 | 4 | 200 | 0 | F | ✓ |
| 11 | Lucky Charms | General Mills | 36 | 2 | 3 | 12 | 12 | 220 | 0 | T | ⚠ grams |
| 12 | Grape-Nuts | Post | 58 | 7 | 6 | 0 | 5 | 270 | 0 | T | ✓ |

## Confirm fast (the whole gap list)

Everything below is a quick package glance. Anything you confirm lets that
record go from `unverified` → `verified`.

**Serving size in grams** (label shows a cup/slice count; want the g figure):
- Dave's Powerseed `42?`, Dave's 21 `45?`, Martin's Potato `32?` (its label has no g weight — grab it), Original Cheerios `40?`, Honey Bunches of Oats `30?`, Lucky Charms `36?`

**"<1 g" fiber decision** (per contract we don't treat `<1g` as exactly 0):
- Nature's Own Honey Wheat, Special K Original — use `1`, or leave `null` (unranked for fiber mode)? Your call.

**Saturated fat** (not split out in my sources; likely small):
- Raisin Bran `0.5?`, Honey Bunches of Oats `0.5?`, Cinnamon Toast Crunch `1?`, Froot Loops `1?`

**Other:**
- Dave's 21 Whole Grains: I used the 27 oz loaf label — confirm which loaf size we're listing.
- Great Value White: ingredient list is from a blog (likely enriched flour + HFCS); grab the real list, and confirm sodium (sources ranged 120–150 mg).
- Barcodes (UPC) are all blank — optional; add if we want them.

## Nice tradeoffs this set unlocks (for the demo)
- **Cereal, fiber vs sugar:** Raisin Bran (7 g fiber **but** 9 g added sugar) vs Grape-Nuts (7 g fiber, **0** added sugar) vs sugary flakes.
- **Cereal, fiber vs sodium:** Honey Nut Cheerios vs Frosted Flakes (the existing flip), plus Corn Flakes' high 300 mg sodium.
- **Bread, whole-grain vs refined:** Dave's / Arnold / Oroweat (whole, higher fiber) vs Wonder / Great Value / Pepperidge (refined, lower fiber, more sodium/sugar).
