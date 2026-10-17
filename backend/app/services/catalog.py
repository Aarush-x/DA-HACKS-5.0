"""Catalog query handling: filter -> normalize -> rank -> assemble.

Ties the storage layer, normalization, and ranking together into the
CatalogResponse shape. All authoritative ranking happens here; the frontend
only renders the result.
"""
from __future__ import annotations

from typing import Optional
from urllib.parse import quote_plus

from app.errors import NotFoundError, StorageUnavailableError
from app.schemas import (
    Category,
    CatalogMeta,
    CatalogResponse,
    Priority,
    Product,
    StoresResponse,
)
from app.services import normalize
from app.services.ranking import RankInput, rank
from app.services.storage import (
    CatalogStore,
    RawProduct,
    StorageUnavailableError as StorageLayerError,
)

SUPPORTED_CATEGORIES: list[Category] = ["bread", "cereal"]
# Category display/group order when a query spans both.
CATEGORY_ORDER = {category: index for index, category in enumerate(SUPPORTED_CATEGORIES)}


def get_stores(store: CatalogStore) -> StoresResponse:
    return StoresResponse(stores=store.stores())


def _matches_query(product: RawProduct, q: str) -> bool:
    needle = q.strip().lower()
    if not needle:
        return True
    haystacks = [product.category, product.name, product.brand]
    return any(needle in field.lower() for field in haystacks)


def get_catalog(
    store: CatalogStore,
    store_id: str,
    category: Optional[Category],
    q: Optional[str],
    priority: Priority,
) -> CatalogResponse:
    if not store.store_exists(store_id):
        raise NotFoundError(f"Unknown store_id: {store_id}")

    try:
        all_products = store.products()
    except StorageLayerError as exc:  # pragma: no cover - defensive
        raise StorageUnavailableError(str(exc)) from exc

    # 1. Only products in this store's simulated assortment.
    selected = [
        p for p in all_products if p.availability_for(store_id) == "in_demo_assortment"
    ]

    # 2. Category filter (optional).
    if category is not None:
        selected = [p for p in selected if p.category == category]

    # 3. Free-text query (optional). An unsupported query simply returns empty.
    if q is not None and q.strip():
        selected = [p for p in selected if _matches_query(p, q)]

    # 4. Normalize every selected product.
    normalized: dict[str, tuple] = {}
    rank_inputs: list[RankInput] = []
    for product in selected:
        per_100g, per_reference, reference_g = normalize.normalize(
            product.nutrition_per_serving, product.serving_g, product.category
        )
        normalized[product.id] = (per_100g, per_reference, reference_g)
        rank_inputs.append(
            RankInput(
                id=product.id,
                category=product.category,
                per_reference=per_reference,
                first_grain_is_whole=product.first_grain_is_whole,
                serving_g=product.serving_g,
            )
        )

    # 5. Category-local ranking under the chosen priority.
    rankings = rank(rank_inputs, priority)

    # 6. Assemble Product responses.
    products: list[Product] = []
    for product in selected:
        per_100g, per_reference, reference_g = normalized[product.id]
        products.append(
            Product(
                id=product.id,
                name=product.name,
                brand=product.brand,
                category=product.category,
                barcode=product.barcode,
                package_size=product.package_size,
                image_url=product.image_url,
                image_credit=product.image_credit,
                image_source_url=product.image_source_url,
                label_status=product.label_status,
                label_verified_at=product.label_verified_at,
                label_source_id=product.label_source_id,
                serving_g=product.serving_g,
                nutrition_per_serving=product.nutrition_per_serving,
                nutrition_per_100g=per_100g,
                reference_g=reference_g,
                nutrition_per_reference=per_reference,
                first_grain_is_whole=product.first_grain_is_whole,
                ingredients_text=product.ingredients_text,
                ingredient_refs=product.ingredient_refs,
                sources=product.sources,
                retailer_search_url=_walmart_search_url(product),
                availability=_availability(product, store_id),
                ranking=rankings[product.id],
            )
        )

    # 7. Order: grouped by category, ranked first (rank asc), unranked last,
    #    stable id as the final tie-breaker.
    products.sort(
        key=lambda p: (
            CATEGORY_ORDER.get(p.category, 99),
            p.ranking.rank if p.ranking.rank is not None else float("inf"),
            p.id,
        )
    )

    meta = CatalogMeta(
        catalog_version=_catalog_version(store),
        storage_mode=store.storage_mode(),  # type: ignore[arg-type]
        contains_synthetic_labels=store.contains_synthetic_labels(),
        supported_categories=SUPPORTED_CATEGORIES,
        priority=priority,
        store_id=store_id,
        total=len(products),
    )
    return CatalogResponse(meta=meta, products=products)


def _walmart_search_url(product: RawProduct) -> str:
    """A Walmart SEARCH link built from the product name (and brand when the
    name does not already include it). A search, never a stock or price claim."""
    name = product.name
    if product.brand and product.brand.lower() not in name.lower():
        query = f"{product.brand} {name}"
    else:
        query = name
    return f"https://www.walmart.com/search?q={quote_plus(query)}"


def _availability(product: RawProduct, store_id: str):
    from app.schemas import Availability

    return Availability(
        store_id=store_id,
        status=product.availability_for(store_id),
        mode="simulated",
    )


def _catalog_version(store: CatalogStore) -> str:
    from app.config import get_settings

    return get_settings().catalog_version
