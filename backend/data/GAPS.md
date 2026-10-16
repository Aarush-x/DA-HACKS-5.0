# B2 data gaps — fields to confirm from the physical packages

All six products are real and sourced, but marked `label_status: "unverified"`
until the data owner checks them against the package. Confirming the items below
lets us flip each record to `"verified"` and set `label_verified_at`.

Research sources used: manufacturer pages (cheerios.com, daveskillerbread.com),
SmartLabel (Kellogg's, labelinsight), and label reposts (MyFoodDiary, major
grocery retailers). Accessed 2026-10-16.

## Blocking (affects ranking)

1. **Dave's Killer Bread Powerseed — saturated fat (g).** Not readable (the
   manufacturer label is an image). Currently `null`, which correctly makes
   Dave's `insufficient_data` for the **balanced** priority (it still ranks under
   fiber/sodium). One number off the package unblocks its balanced rank.

## Confirm (values set, want a second look)

2. **Original Cheerios — serving size in grams.** Set to `40` g for the
   1½-cup serving; the manufacturer page lists only "1 1/2 cup". Confirm the gram
   weight on the box.
3. **Dave's Powerseed — serving size in grams.** Set to `42` g (1 slice) from an
   Amazon listing; confirm against the loaf.
4. **Sara Lee Classic White — sodium / protein.** Used SmartLabel (manufacturer):
   sodium `270` mg, protein `4` g per 57 g (2 slices). Retailer reposts show
   `290` mg / `5` g. Package wins.
5. **Honey Nut Cheerios — serving grams.** Set to `37` g (1 cup), the current
   retail listing; an older label used ¾ cup (28 g). Confirm.

## Optional / nice-to-have

6. **Barcodes (UPC).** All `null`. Add the 12-digit UPC from each package if we
   want them (string, preserve leading zeroes).
7. **Full ingredient tails.** Leading ingredients are captured and correct; the
   vitamin/mineral tails are summarized. Paste exact lists if we want them verbatim.
8. **Ingredient cards (`ingredients.json`).** Seven cards are written and factual
   but `content_status: "draft"` with empty `sources`. Add 1–2 references each to
   move them to `"reviewed"`.
9. **Product images.** None included (plain cards). Only add images with permitted
   use + attribution; otherwise the handoff allows plain cards.

## How to apply a confirmation

Edit `backend/data/products.json` for the product, then for a fully checked
record set `"label_status": "verified"` and `"label_verified_at": "2026-10-..."`.
Re-run `pytest -q` and the live check.
