"""Deterministic ranking (handoff section 6).

This is a transparent engineering heuristic, not a clinical score. The backend
owns it; the frontend only displays the returned rank and reasons. Rankings are
category-local — a bread index is never compared to a cereal index.

Component values at the reference quantity, each clamped to [0, 1]:
    F = clamp(fiber_g / 5.6)
    P = clamp(protein_g / 10)
    A = 1 - clamp(added_sugar_g / 10)
    N = 1 - clamp(sodium_mg / 460)
    S = 1 - clamp(saturated_fat_g / 4)
    W = 1 if first grain is verified whole, 0 if verified not, null if unknown

Index = sum(component_value * weight); weights per category sum to 100, so the
index lies in [0, 100]. Monotonic by construction: more sodium alone cannot
raise a balanced result, more fiber alone cannot lower it, and the clamps stop
credit/penalty past each anchor.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.schemas import Category, Component, Nutrients, Priority, Ranking, Reason

# Anchors = 20% of the relevant daily reference amount (deliberate prototype
# scaling, not a per-meal recommendation).
ANCHORS = {
    "fiber_g": 5.6,
    "protein_g": 10.0,
    "added_sugar_g": 10.0,
    "sodium_mg": 460.0,
    "saturated_fat_g": 4.0,
}

# Component order matches the contract fixtures.
BALANCED_COMPONENT_ORDER = ("F", "P", "W", "A", "N", "S")

BALANCED_WEIGHTS: dict[Category, dict[str, float]] = {
    "bread": {"F": 30, "P": 10, "W": 10, "A": 20, "N": 25, "S": 5},
    "cereal": {"F": 25, "P": 10, "W": 10, "A": 35, "N": 10, "S": 10},
}

# Required inputs for a complete balanced record (at the reference basis).
BALANCED_REQUIRED_NUTRIENTS = (
    "fiber_g",
    "protein_g",
    "added_sugar_g",
    "sodium_mg",
    "saturated_fat_g",
)


@dataclass
class RankInput:
    id: str
    category: Category
    per_reference: Nutrients
    first_grain_is_whole: Optional[bool]
    serving_g: Optional[float]


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _component_values(item: RankInput) -> dict[str, Optional[float]]:
    """Raw component values in [0, 1], or None when the input is missing."""
    n = item.per_reference
    values: dict[str, Optional[float]] = {}
    values["F"] = None if n.fiber_g is None else _clamp01(n.fiber_g / ANCHORS["fiber_g"])
    values["P"] = None if n.protein_g is None else _clamp01(n.protein_g / ANCHORS["protein_g"])
    values["A"] = (
        None if n.added_sugar_g is None else 1.0 - _clamp01(n.added_sugar_g / ANCHORS["added_sugar_g"])
    )
    values["N"] = None if n.sodium_mg is None else 1.0 - _clamp01(n.sodium_mg / ANCHORS["sodium_mg"])
    values["S"] = (
        None
        if n.saturated_fat_g is None
        else 1.0 - _clamp01(n.saturated_fat_g / ANCHORS["saturated_fat_g"])
    )
    if item.first_grain_is_whole is None:
        values["W"] = None
    else:
        values["W"] = 1.0 if item.first_grain_is_whole else 0.0
    return values


def _balanced_missing_fields(item: RankInput) -> list[str]:
    missing: list[str] = []
    if item.serving_g is None or item.serving_g <= 0:
        missing.append("serving_g")
    n = item.per_reference
    for field in BALANCED_REQUIRED_NUTRIENTS:
        if getattr(n, field) is None:
            missing.append(field)
    if item.first_grain_is_whole is None:
        missing.append("first_grain_is_whole")
    return missing


def _balanced_index_and_components(
    item: RankInput,
) -> tuple[float, list[Component]]:
    values = _component_values(item)
    weights = BALANCED_WEIGHTS[item.category]
    components: list[Component] = []
    index = 0.0
    for key in BALANCED_COMPONENT_ORDER:
        contribution = values[key] * weights[key]  # type: ignore[operator]
        index += contribution
        components.append(Component(key=key, contribution=contribution))
    return index, components


# --------------------------------------------------------------------------- #
# Reason generation (truthful, same-category comparison only)
# --------------------------------------------------------------------------- #
def _fmt(value: Optional[float], unit: str) -> Optional[str]:
    if value is None:
        return None
    rounded = round(value, 1)
    text = f"{rounded:g}"
    return f"{text} {unit}"


def _metric_note(item: RankInput) -> Reason:
    ref = int(round(item.serving_g)) if item.serving_g else None
    fiber = _fmt(item.per_reference.fiber_g, "g fiber")
    sodium = _fmt(item.per_reference.sodium_mg, "mg sodium")
    from app.services.normalize import reference_g_for

    ref_g = int(reference_g_for(item.category))
    parts = [p for p in (fiber, sodium) if p]
    if parts:
        text = f"{' and '.join(parts)} per {ref_g} g."
    else:
        text = f"Values reported per {ref_g} g."
    return Reason(kind="note", text=text)


def _comparison_reasons(item: RankInput, peers: list[RankInput]) -> list[Reason]:
    """At most one strength and one tradeoff vs same-category peers that have
    the metric. Never claims an improvement when there is no comparator."""
    reasons: list[Reason] = []

    def known(field: str) -> list[float]:
        return [
            getattr(p.per_reference, field)
            for p in peers
            if getattr(p.per_reference, field) is not None
        ]

    my_fiber = item.per_reference.fiber_g
    my_sodium = item.per_reference.sodium_mg
    my_added = item.per_reference.added_sugar_g

    fibers = known("fiber_g")
    sodiums = known("sodium_mg")
    addeds = known("added_sugar_g")

    # Strength: top fiber, else lowest sodium, else whole grain advantage.
    if my_fiber is not None and fibers and my_fiber >= max(fibers) and max(fibers) > min(fibers):
        reasons.append(
            Reason(
                kind="strength",
                text="More fiber at equal weight than the other products in this category.",
            )
        )
    elif my_sodium is not None and sodiums and my_sodium <= min(sodiums) and max(sodiums) > min(sodiums):
        reasons.append(
            Reason(
                kind="strength",
                text="Less sodium at equal weight than the other products in this category.",
            )
        )
    elif item.first_grain_is_whole and any(p.first_grain_is_whole is False for p in peers):
        reasons.append(
            Reason(
                kind="strength",
                text="Made with a whole grain as the first grain.",
            )
        )

    # Tradeoff: highest sodium, else highest added sugar.
    if my_sodium is not None and sodiums and my_sodium >= max(sodiums) and max(sodiums) > min(sodiums):
        reasons.append(
            Reason(
                kind="tradeoff",
                text="More sodium at equal weight than the other products in this category.",
            )
        )
    elif my_added is not None and addeds and my_added >= max(addeds) and max(addeds) > min(addeds):
        reasons.append(
            Reason(
                kind="tradeoff",
                text="More added sugar at equal weight than the other products in this category.",
            )
        )

    return reasons


def _reasons(item: RankInput, peers: list[RankInput]) -> list[Reason]:
    return [_metric_note(item)] + _comparison_reasons(item, peers)


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def rank(items: list[RankInput], priority: Priority) -> dict[str, Ranking]:
    """Compute category-local rankings for `items` under `priority`.

    Returns a mapping of product id -> Ranking. Products are ranked only within
    their own category; those lacking the data a mode requires are placed after
    ranked products with a null rank and an explanation.
    """
    result: dict[str, Ranking] = {}
    by_category: dict[Category, list[RankInput]] = {}
    for item in items:
        by_category.setdefault(item.category, []).append(item)

    for category, group in by_category.items():
        if priority == "balanced":
            result.update(_rank_balanced(group))
        else:
            result.update(_rank_single_metric(group, priority, **_SINGLE_METRIC[priority]))
    return result


# Single-metric priority modes: which reference-quantity field they sort on, the
# direction, and the secondary tie-break. Unknown tie-break values sort last.
_SINGLE_METRIC: dict[str, dict] = {
    # most fiber first; ties -> lower sodium, then stable id
    "fiber": dict(field="fiber_g", descending=True, tiebreak_field="sodium_mg", tiebreak_descending=False),
    # least sodium first; ties -> higher fiber
    "sodium": dict(field="sodium_mg", descending=False, tiebreak_field="fiber_g", tiebreak_descending=True),
    # most protein first; ties -> lower sodium
    "protein": dict(field="protein_g", descending=True, tiebreak_field="sodium_mg", tiebreak_descending=False),
    # fewest calories first; ties -> more protein
    "low_calorie": dict(field="calories_kcal", descending=False, tiebreak_field="protein_g", tiebreak_descending=True),
    # least added sugar first; ties -> more fiber
    "low_sugar": dict(field="added_sugar_g", descending=False, tiebreak_field="fiber_g", tiebreak_descending=True),
    # least saturated fat first; ties -> more fiber
    "low_sat_fat": dict(field="saturated_fat_g", descending=False, tiebreak_field="fiber_g", tiebreak_descending=True),
}


def _rank_balanced(group: list[RankInput]) -> dict[str, Ranking]:
    result: dict[str, Ranking] = {}
    ranked: list[tuple[float, RankInput, list[Component]]] = []
    unranked: list[RankInput] = []

    for item in group:
        missing = _balanced_missing_fields(item)
        if missing:
            unranked.append(item)
        else:
            index, components = _balanced_index_and_components(item)
            ranked.append((index, item, components))

    # Higher index first; stable id as the final tie-breaker.
    ranked.sort(key=lambda t: (-t[0], t[1].id))
    for position, (index, item, components) in enumerate(ranked, start=1):
        peers = [other for _, other, _ in ranked if other.id != item.id]
        result[item.id] = Ranking(
            priority="balanced",
            status="ranked",
            rank=position,
            internal_index=index,
            reasons=_reasons(item, peers),
            missing_fields=[],
            components=components,
        )

    for item in unranked:
        result[item.id] = Ranking(
            priority="balanced",
            status="insufficient_data",
            rank=None,
            internal_index=None,
            reasons=[
                _metric_note(item),
                Reason(
                    kind="note",
                    text="Not ranked for balanced: missing "
                    + ", ".join(_balanced_missing_fields(item))
                    + ".",
                ),
            ],
            missing_fields=_balanced_missing_fields(item),
            components=[],
        )
    return result


def _rank_single_metric(
    group: list[RankInput],
    priority: Priority,
    field: str,
    descending: bool,
    tiebreak_field: str,
    tiebreak_descending: bool,
) -> dict[str, Ranking]:
    result: dict[str, Ranking] = {}
    ranked: list[RankInput] = []
    unranked: list[RankInput] = []

    for item in group:
        if getattr(item.per_reference, field) is None:
            unranked.append(item)
        else:
            ranked.append(item)

    def sort_key(item: RankInput):
        primary = getattr(item.per_reference, field)
        primary_key = -primary if descending else primary
        tb = getattr(item.per_reference, tiebreak_field)
        # Unknown tie-break values sort after known ones.
        tb_missing = tb is None
        if tb is None:
            tb_key = 0.0
        else:
            tb_key = -tb if tiebreak_descending else tb
        return (primary_key, tb_missing, tb_key, item.id)

    ranked.sort(key=sort_key)
    for position, item in enumerate(ranked, start=1):
        peers = [other for other in ranked if other.id != item.id]
        result[item.id] = Ranking(
            priority=priority,
            status="ranked",
            rank=position,
            internal_index=None,
            reasons=_reasons(item, peers),
            missing_fields=[],
            components=[],
        )

    for item in unranked:
        missing = [field]
        if item.serving_g is None or item.serving_g <= 0:
            missing = ["serving_g", field]
        result[item.id] = Ranking(
            priority=priority,
            status="insufficient_data",
            rank=None,
            internal_index=None,
            reasons=[
                _metric_note(item),
                Reason(
                    kind="note",
                    text=f"Not ranked for {priority}: missing {field}.",
                ),
            ],
            missing_fields=missing,
            components=[],
        )
    return result
