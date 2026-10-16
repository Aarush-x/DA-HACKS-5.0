"""Unit tests for normalization and ranking (handoff section 6)."""
from __future__ import annotations

from app.schemas import Nutrients
from app.services import normalize
from app.services.ranking import RankInput, rank


def _nutrients(**kwargs) -> Nutrients:
    base = dict(
        fiber_g=None,
        protein_g=None,
        added_sugar_g=None,
        total_sugar_g=None,
        sodium_mg=None,
        saturated_fat_g=None,
    )
    base.update(kwargs)
    return Nutrients(**base)


# --------------------------------------------------------------------------- #
# Normalization
# --------------------------------------------------------------------------- #
def test_normalize_scales_to_100g_and_reference():
    per_serving = _nutrients(fiber_g=5, sodium_mg=100)
    per_100g, per_reference, reference_g = normalize.normalize(per_serving, 25, "bread")
    assert reference_g == 50
    # 5 g per 25 g serving -> 20 g per 100 g -> 10 g per 50 g reference
    assert per_100g.fiber_g == 20
    assert per_reference.fiber_g == 10
    assert per_100g.sodium_mg == 400
    assert per_reference.sodium_mg == 200


def test_normalize_preserves_null_and_zero():
    per_serving = _nutrients(fiber_g=0, protein_g=None)
    per_100g, per_reference, _ = normalize.normalize(per_serving, 40, "cereal")
    assert per_100g.fiber_g == 0  # explicit zero stays zero
    assert per_reference.fiber_g == 0
    assert per_100g.protein_g is None  # missing stays null
    assert per_reference.protein_g is None


def test_normalize_missing_serving_mass_yields_null():
    per_serving = _nutrients(fiber_g=5, sodium_mg=100)
    for bad in (None, 0, -5):
        per_100g, per_reference, _ = normalize.normalize(per_serving, bad, "bread")
        assert per_100g.fiber_g is None
        assert per_reference.sodium_mg is None


def test_cereal_reference_is_40g():
    assert normalize.reference_g_for("cereal") == 40
    assert normalize.reference_g_for("bread") == 50


# --------------------------------------------------------------------------- #
# Balanced ranking
# --------------------------------------------------------------------------- #
def _bread(id_, **kw) -> RankInput:
    return RankInput(
        id=id_,
        category="bread",
        per_reference=_nutrients(**{k: v for k, v in kw.items() if k != "whole"}),
        first_grain_is_whole=kw.get("whole", True),
        serving_g=50,
    )


def _complete_bread(id_, fiber, sodium, **extra) -> RankInput:
    fields = dict(
        fiber_g=fiber,
        protein_g=5,
        added_sugar_g=2,
        total_sugar_g=3,
        sodium_mg=sodium,
        saturated_fat_g=0.5,
    )
    fields.update(extra)
    return _bread(id_, whole=extra.pop("whole", True), **fields)


def test_balanced_more_sodium_cannot_improve():
    low = _complete_bread("low-sodium", fiber=4, sodium=150)
    high = _complete_bread("high-sodium", fiber=4, sodium=400)
    result = rank([low, high], "balanced")
    assert result["low-sodium"].internal_index >= result["high-sodium"].internal_index


def test_balanced_more_fiber_cannot_worsen():
    less = _complete_bread("less-fiber", fiber=2, sodium=200)
    more = _complete_bread("more-fiber", fiber=6, sodium=200)
    result = rank([less, more], "balanced")
    assert result["more-fiber"].internal_index >= result["less-fiber"].internal_index
    assert result["more-fiber"].rank == 1


def test_balanced_missing_added_sugar_is_insufficient():
    incomplete = _bread(
        "incomplete",
        fiber_g=4,
        protein_g=5,
        added_sugar_g=None,  # missing
        sodium_mg=200,
        saturated_fat_g=0.5,
        whole=True,
    )
    result = rank([incomplete], "balanced")
    ranking = result["incomplete"]
    assert ranking.status == "insufficient_data"
    assert ranking.rank is None
    assert ranking.internal_index is None
    assert "added_sugar_g" in ranking.missing_fields


def test_balanced_index_matches_fixture_math():
    # bread with fiber 5, protein 5, added 1, sodium 300, sat 0.5, whole -> 72.856
    item = _bread(
        "bread-01",
        fiber_g=5,
        protein_g=5,
        added_sugar_g=1,
        sodium_mg=300,
        saturated_fat_g=0.5,
        whole=True,
    )
    result = rank([item], "balanced")
    assert abs(result["bread-01"].internal_index - 72.85636645962734) < 1e-6
    components = {c.key: c.contribution for c in result["bread-01"].components}
    assert abs(components["F"] - 26.785714285714285) < 1e-6
    assert components["W"] == 10


# --------------------------------------------------------------------------- #
# Priority modes
# --------------------------------------------------------------------------- #
def test_fiber_mode_sorts_descending_index_null():
    a = _complete_bread("a", fiber=2, sodium=200)
    b = _complete_bread("b", fiber=6, sodium=200)
    c = _complete_bread("c", fiber=4, sodium=200)
    result = rank([a, b, c], "fiber")
    order = sorted(result, key=lambda k: result[k].rank)
    assert order == ["b", "c", "a"]
    assert all(result[k].internal_index is None for k in result)
    assert all(result[k].components == [] for k in result)


def test_sodium_mode_sorts_ascending():
    a = _complete_bread("a", fiber=4, sodium=400)
    b = _complete_bread("b", fiber=4, sodium=150)
    result = rank([a, b], "sodium")
    assert result["b"].rank == 1
    assert result["a"].rank == 2


def test_fiber_tie_breaks_by_lower_sodium_then_id():
    a = _complete_bread("a-id", fiber=4, sodium=300)
    b = _complete_bread("b-id", fiber=4, sodium=150)
    result = rank([a, b], "fiber")
    # equal fiber -> lower sodium (b) wins
    assert result["b-id"].rank == 1
    # equal everything -> stable id tie-break
    c = _complete_bread("c-id", fiber=4, sodium=150)
    result2 = rank([b, c], "fiber")
    assert result2["b-id"].rank == 1
    assert result2["c-id"].rank == 2


def test_priority_flip_changes_recommendation():
    # fiber winner (more fiber, more sodium) vs sodium winner (less of both)
    hearth = _complete_bread("hearth", fiber=6, sodium=380)
    soft = _complete_bread("soft", fiber=2, sodium=190)
    fiber_result = rank([hearth, soft], "fiber")
    sodium_result = rank([hearth, soft], "sodium")
    # top of fiber is hearth; top of sodium is soft
    assert fiber_result["hearth"].rank == 1
    assert sodium_result["soft"].rank == 1


def test_missing_metric_placed_after_ranked():
    good = _complete_bread("good", fiber=4, sodium=200)
    no_fiber = _bread("no-fiber", fiber_g=None, sodium_mg=200)
    result = rank([good, no_fiber], "fiber")
    assert result["good"].status == "ranked"
    assert result["no-fiber"].status == "insufficient_data"
    assert result["no-fiber"].rank is None
    assert "fiber_g" in result["no-fiber"].missing_fields


def test_rank_is_category_local():
    bread = _complete_bread("bread", fiber=4, sodium=200)
    cereal = RankInput(
        id="cereal",
        category="cereal",
        per_reference=_nutrients(
            fiber_g=4, protein_g=3, added_sugar_g=1, sodium_mg=140, saturated_fat_g=0.5
        ),
        first_grain_is_whole=True,
        serving_g=40,
    )
    result = rank([bread, cereal], "balanced")
    # each is rank 1 within its own category
    assert result["bread"].rank == 1
    assert result["cereal"].rank == 1
