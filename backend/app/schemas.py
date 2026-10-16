"""Pydantic models = the exact v1 API contract (contracts/API_CONTRACT.md).

HTTP field names are snake_case. Every listed field is always present; an
unavailable value is `null`, never an omitted field, an invented zero, or the
string "N/A".
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel

Category = Literal["bread", "cereal"]
Priority = Literal[
    "balanced",
    "fiber",
    "sodium",
    "protein",
    "low_calorie",
    "low_sugar",
    "low_sat_fat",
]
LabelStatus = Literal["verified", "unverified", "synthetic"]


class Source(BaseModel):
    id: str
    title: str
    url: str
    accessed_at: str  # ISO date YYYY-MM-DD


class Nutrients(BaseModel):
    calories_kcal: Optional[float]
    fiber_g: Optional[float]
    protein_g: Optional[float]
    added_sugar_g: Optional[float]
    total_sugar_g: Optional[float]
    sodium_mg: Optional[float]
    saturated_fat_g: Optional[float]


class IngredientRef(BaseModel):
    id: str
    label: str


class Availability(BaseModel):
    store_id: str
    status: Literal["in_demo_assortment", "out_of_demo_assortment", "unknown"]
    mode: Literal["simulated"] = "simulated"


class Reason(BaseModel):
    kind: Literal["strength", "tradeoff", "note"]
    text: str


class Component(BaseModel):
    key: str
    contribution: Optional[float]


class Ranking(BaseModel):
    priority: Priority
    status: Literal["ranked", "insufficient_data"]
    rank: Optional[int]  # category-local, starts at 1
    internal_index: Optional[float]  # heuristic; never shown as percent healthy
    reasons: List[Reason]
    missing_fields: List[str]
    components: List[Component]


class Product(BaseModel):
    id: str
    name: str
    brand: str
    category: Category
    barcode: Optional[str]  # preserve leading zeroes (string)
    package_size: Optional[str]
    image_url: Optional[str]
    image_credit: Optional[str]
    image_source_url: Optional[str]
    label_status: LabelStatus
    label_verified_at: Optional[str]
    label_source_id: Optional[str]
    serving_g: Optional[float]
    nutrition_per_serving: Nutrients
    nutrition_per_100g: Nutrients
    reference_g: float  # 50 for bread; 40 for cereal
    nutrition_per_reference: Nutrients
    first_grain_is_whole: Optional[bool]
    ingredients_text: Optional[str]
    ingredient_refs: List[IngredientRef]
    sources: List[Source]
    retailer_search_url: Optional[str]  # Walmart SEARCH url; not a stock/price claim
    availability: Availability
    ranking: Ranking


class ReferenceByCategory(BaseModel):
    bread: Literal[50] = 50
    cereal: Literal[40] = 40


class DailyValues(BaseModel):
    """General FDA reference amounts for a 2,000 kcal diet. These are a neutral
    reference for %DV context only — not personalized or medical advice."""

    calories_kcal: float = 2000
    fiber_g: float = 28
    protein_g: float = 50
    added_sugar_g: float = 50
    sodium_mg: float = 2300
    saturated_fat_g: float = 20


class CatalogMeta(BaseModel):
    api_version: Literal["1"] = "1"
    catalog_version: str
    inventory_mode: Literal["simulated"] = "simulated"
    storage_mode: Literal["seed", "postgres", "fixture"]
    contains_synthetic_labels: bool
    supported_categories: List[Category]
    reference_g_by_category: ReferenceByCategory = ReferenceByCategory()
    fda_daily_values: DailyValues = DailyValues()
    priority: Priority
    store_id: str
    total: int


class CatalogResponse(BaseModel):
    meta: CatalogMeta
    products: List[Product]


class StoreItem(BaseModel):
    id: str
    name: str
    inventory_mode: Literal["simulated"] = "simulated"


class StoresMeta(BaseModel):
    api_version: Literal["1"] = "1"
    inventory_mode: Literal["simulated"] = "simulated"


class StoresResponse(BaseModel):
    meta: StoresMeta = StoresMeta()
    stores: List[StoreItem]


class IngredientResponse(BaseModel):
    id: str
    name: str
    aliases: List[str]
    what_it_is: str
    why_used: str
    evidence_summary: str
    practical_guidance: str
    evidence_level: Literal["established", "limited", "mixed", "not_assessed"]
    uncertainty: str
    reviewed_at: Optional[str]
    sources: List[Source]
    content_status: Literal["reviewed", "draft", "synthetic"]


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorBody
