"""Nutrient normalization.

For every available nutrient:
    per_100g      = per_serving * 100 / serving_g
    per_reference = per_100g * reference_g / 100

Rules (handoff section 6):
- Invalid or missing serving mass => all normalized fields are null.
- A null input nutrient stays null; an explicit zero stays zero.
- Full precision is retained; rounding is a display concern, not done here.
- reference_g is 50 g for bread, 40 g for cereal.
"""
from __future__ import annotations

from typing import Optional

from app.schemas import Category, Nutrients

REFERENCE_G_BY_CATEGORY: dict[Category, float] = {"bread": 50.0, "cereal": 40.0}

NUTRIENT_FIELDS = (
    "calories_kcal",
    "fiber_g",
    "protein_g",
    "added_sugar_g",
    "total_sugar_g",
    "sodium_mg",
    "saturated_fat_g",
)


def reference_g_for(category: Category) -> float:
    return REFERENCE_G_BY_CATEGORY[category]


def _scale(value: Optional[float], factor: float) -> Optional[float]:
    if value is None:
        return None
    return value * factor


def _null_nutrients() -> Nutrients:
    return Nutrients(**{field: None for field in NUTRIENT_FIELDS})


def to_per_100g(per_serving: Nutrients, serving_g: Optional[float]) -> Nutrients:
    """Scale per-serving values to a 100 g basis.

    A missing or non-positive serving mass yields all-null normalized values;
    we never guess grams from a slice or a cup.
    """
    if serving_g is None or serving_g <= 0:
        return _null_nutrients()
    factor = 100.0 / serving_g
    return Nutrients(
        **{field: _scale(getattr(per_serving, field), factor) for field in NUTRIENT_FIELDS}
    )


def to_per_reference(per_100g: Nutrients, reference_g: float) -> Nutrients:
    factor = reference_g / 100.0
    return Nutrients(
        **{field: _scale(getattr(per_100g, field), factor) for field in NUTRIENT_FIELDS}
    )


def normalize(
    per_serving: Nutrients, serving_g: Optional[float], category: Category
) -> tuple[Nutrients, Nutrients, float]:
    """Return (per_100g, per_reference, reference_g) for a product."""
    reference_g = reference_g_for(category)
    per_100g = to_per_100g(per_serving, serving_g)
    per_reference = to_per_reference(per_100g, reference_g)
    return per_100g, per_reference, reference_g
