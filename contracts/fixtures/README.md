# Synthetic fixture guide

All product names, the brand, nutrition, and ingredient content are fictional development samples. Show “Sample product data” and “Store availability is simulated”. Empty sources mean “Sources not yet reviewed”. These are not the eventual verified catalog.

Each products-*.json is the complete response for store_id=demo-store-a, the named priority, and no category/query. Bread and cereal are separate groups; ranks restart at 1. Six stable products are shared across all files. Serving and reference mass are 50 g bread and 40 g dry cereal. Fiber winners (*-01) have more sodium; sodium winners (*-02) have less fiber. cereal-03 lacks added sugar: balanced rank/index null, but fiber/sodium ranks remain valid. Components use the contract's F/P/W/A/N/S keys; priority-only modes leave components empty and index null. Whole-grain flags are synthetic inputs, never real verification claims.

## Simulated assortments and filtering

- demo-store-a: bread-01, bread-02, bread-03, cereal-01, cereal-02, cereal-03.
- demo-store-b: bread-01, bread-02, cereal-01, cereal-02. The *-03 products are out_of_demo_assortment and excluded from that store response.

A future mock adapter selects the requested priority snapshot, filters the store assortment, then applies category AND trimmed case-insensitive q across category/name/brand. q=bread matches category. Unsupported queries yield zero products and retain supported_categories. With no filters, retain category groups. Update meta.store_id, meta.total and each returned availability.store_id; keep fixture storage and synthetic/simulated labels. Reassign sequential category-local ranks among remaining ranked items; retain null ranks for insufficient data. Recompute comparative reasons for the remaining set or replace them with factual metrics when no comparator remains. Do not calculate a second health score in the frontend.

Reject invalid priority/category, missing store_id, malformed queries and q over 100 characters with the contract's 422 envelope. Unknown well-formed store IDs return 404. sample-grain resolves to ingredient.json; unknown ingredient IDs return 404, without implying danger. No endpoint is implemented by these files.
