"""Catalog storage.

`seed` loads committed JSON from backend/data at startup — enough for six
read-only products and the fastest path to an integrated demo. `postgres` is
the optional managed-database path; until it is implemented it fails honestly
rather than pretending to work (handoff section 4: a configured database
failure must produce an honest error).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel

from app.config import Settings, get_settings
from app.schemas import (
    Category,
    IngredientRef,
    IngredientResponse,
    Nutrients,
    Source,
    StoreItem,
)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

AssortmentStatus = Literal["in_demo_assortment", "out_of_demo_assortment", "unknown"]


class RawProduct(BaseModel):
    """A product as stored in seed data: raw label inputs only.

    Derived fields (per_100g, per_reference, ranking) are computed at request
    time by the services, never stored.
    """

    id: str
    name: str
    brand: str
    category: Category
    barcode: Optional[str] = None
    package_size: Optional[str] = None
    image_url: Optional[str] = None
    image_credit: Optional[str] = None
    image_source_url: Optional[str] = None
    label_status: Literal["verified", "unverified", "synthetic"]
    label_verified_at: Optional[str] = None
    label_source_id: Optional[str] = None
    serving_g: Optional[float] = None
    nutrition_per_serving: Nutrients
    first_grain_is_whole: Optional[bool] = None
    ingredients_text: Optional[str] = None
    ingredient_refs: list[IngredientRef] = []
    sources: list[Source] = []
    # store_id -> assortment status. A store not listed is treated as unknown.
    store_assortment: dict[str, AssortmentStatus] = {}

    def availability_for(self, store_id: str) -> AssortmentStatus:
        return self.store_assortment.get(store_id, "unknown")


class StorageUnavailableError(RuntimeError):
    """Raised when the configured storage backend cannot serve data."""


class CatalogStore:
    def storage_mode(self) -> str:
        raise NotImplementedError

    def contains_synthetic_labels(self) -> bool:
        raise NotImplementedError

    def stores(self) -> list[StoreItem]:
        raise NotImplementedError

    def products(self) -> list[RawProduct]:
        raise NotImplementedError

    def ingredient(self, ingredient_id: str) -> Optional[IngredientResponse]:
        raise NotImplementedError

    def ingredients(self) -> list[IngredientResponse]:
        raise NotImplementedError

    def store_exists(self, store_id: str) -> bool:
        return any(s.id == store_id for s in self.stores())


def _load_json(name: str):
    path = DATA_DIR / name
    if not path.exists():
        raise StorageUnavailableError(f"seed file missing: {name}")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


class SeedCatalogStore(CatalogStore):
    def __init__(self, catalog_version: str):
        self._catalog_version = catalog_version
        self._stores = [StoreItem(**s) for s in _load_json("stores.json")]
        self._products = [RawProduct(**p) for p in _load_json("products.json")]
        self._ingredients = {
            item["id"]: IngredientResponse(**item) for item in _load_json("ingredients.json")
        }

    def storage_mode(self) -> str:
        return "seed"

    def contains_synthetic_labels(self) -> bool:
        return any(p.label_status == "synthetic" for p in self._products)

    def stores(self) -> list[StoreItem]:
        return self._stores

    def products(self) -> list[RawProduct]:
        return self._products

    def ingredient(self, ingredient_id: str) -> Optional[IngredientResponse]:
        return self._ingredients.get(ingredient_id)

    def ingredients(self) -> list[IngredientResponse]:
        return list(self._ingredients.values())


class PostgresCatalogStore(CatalogStore):
    """Placeholder for the optional managed-Postgres path (D1 stretch).

    Not implemented yet. It fails loudly so a misconfigured deployment surfaces
    a 503 instead of silently serving nothing or faking success.
    """

    def __init__(self, settings: Settings):
        if not settings.database_url:
            raise StorageUnavailableError(
                "CATALOG_STORAGE=postgres but DATABASE_URL is not set"
            )
        raise StorageUnavailableError(
            "postgres storage is not implemented yet; use CATALOG_STORAGE=seed"
        )


@lru_cache(maxsize=1)
def get_store() -> CatalogStore:
    settings = get_settings()
    if settings.catalog_storage == "postgres":
        return PostgresCatalogStore(settings)
    # "seed" and "fixture" both load committed JSON.
    return SeedCatalogStore(settings.catalog_version)
