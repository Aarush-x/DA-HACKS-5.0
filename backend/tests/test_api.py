"""Endpoint tests via FastAPI TestClient against the seed dataset."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz():
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "api_version": "1"}


def test_stores():
    resp = client.get("/api/v1/stores")
    assert resp.status_code == 200
    body = resp.json()
    assert body["meta"]["inventory_mode"] == "simulated"
    ids = {s["id"] for s in body["stores"]}
    assert ids == {"demo-store-a", "demo-store-b"}
    assert all(s["inventory_mode"] == "simulated" for s in body["stores"])


def test_products_store_a_returns_full_assortment():
    resp = client.get("/api/v1/products", params={"store_id": "demo-store-a"})
    assert resp.status_code == 200
    body = resp.json()
    meta = body["meta"]
    assert meta["api_version"] == "1"
    assert meta["inventory_mode"] == "simulated"
    assert meta["storage_mode"] == "seed"
    assert meta["store_id"] == "demo-store-a"
    assert meta["priority"] == "balanced"
    assert meta["supported_categories"] == ["bread", "cereal"]
    assert meta["reference_g_by_category"] == {"bread": 50, "cereal": 40}
    # Real (unverified) data — no synthetic labels remain.
    assert meta["contains_synthetic_labels"] is False
    assert meta["total"] == len(body["products"]) == 6


def test_products_grouped_by_category_with_local_ranks():
    # Use fiber priority so every product has the data it needs to rank.
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "priority": "fiber"}
    )
    products = resp.json()["products"]
    categories = [p["category"] for p in products]
    # bread group precedes cereal group
    assert categories == sorted(categories, key=lambda c: 0 if c == "bread" else 1)
    bread_ranks = [p["ranking"]["rank"] for p in products if p["category"] == "bread"]
    assert sorted(bread_ranks) == [1, 2, 3]


def test_category_filter_returns_only_that_category():
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "category": "bread"}
    )
    cats = {p["category"] for p in resp.json()["products"]}
    assert cats == {"bread"}


def test_query_matches_category_even_without_name_match():
    resp = client.get("/api/v1/products", params={"store_id": "demo-store-a", "q": "bread"})
    products = resp.json()["products"]
    assert len(products) == 3
    assert all(p["category"] == "bread" for p in products)


def test_unsupported_query_returns_empty_with_supported_categories():
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "q": "zzz-no-match"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["products"] == []
    assert body["meta"]["total"] == 0
    assert body["meta"]["supported_categories"] == ["bread", "cereal"]


def test_store_b_assortment_is_smaller():
    a = client.get("/api/v1/products", params={"store_id": "demo-store-a"}).json()
    b = client.get("/api/v1/products", params={"store_id": "demo-store-b"}).json()
    assert b["meta"]["total"] < a["meta"]["total"]
    # every returned product is actually in store B's assortment
    for p in b["products"]:
        assert p["availability"]["store_id"] == "demo-store-b"
        assert p["availability"]["status"] == "in_demo_assortment"
        assert p["availability"]["mode"] == "simulated"


def _rank_of(products, product_id):
    return next(p for p in products if p["id"] == product_id)["ranking"]["rank"]


def test_priority_flip_reorders_cereals():
    # Honey Nut Cheerios has more fiber but also more sodium than Frosted Flakes,
    # so the two swap places when the priority changes. This is the genuine,
    # data-driven tradeoff in the verified catalog.
    fiber = client.get(
        "/api/v1/products",
        params={"store_id": "demo-store-a", "category": "cereal", "priority": "fiber"},
    ).json()["products"]
    sodium = client.get(
        "/api/v1/products",
        params={"store_id": "demo-store-a", "category": "cereal", "priority": "sodium"},
    ).json()["products"]
    hnc, frosted = "cereal-honey-nut-cheerios", "cereal-frosted-flakes"
    # fiber priority ranks HNC above Frosted; sodium priority reverses them
    assert _rank_of(fiber, hnc) < _rank_of(fiber, frosted)
    assert _rank_of(sodium, frosted) < _rank_of(sodium, hnc)


def test_missing_saturated_fat_makes_balanced_insufficient():
    # Dave's Killer Bread Powerseed has no saturated-fat value yet, so it cannot
    # receive a complete balanced rank (real missing-data path).
    products = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "category": "bread"}
    ).json()["products"]
    daves = next(p for p in products if p["id"] == "bread-daves-powerseed")
    assert daves["ranking"]["status"] == "insufficient_data"
    assert "saturated_fat_g" in daves["ranking"]["missing_fields"]
    # but it still ranks under fiber priority, which does not need saturated fat
    fiber = client.get(
        "/api/v1/products",
        params={"store_id": "demo-store-a", "category": "bread", "priority": "fiber"},
    ).json()["products"]
    daves_fiber = next(p for p in fiber if p["id"] == "bread-daves-powerseed")
    assert daves_fiber["ranking"]["status"] == "ranked"


def test_fiber_mode_index_null_components_empty():
    products = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "priority": "fiber"}
    ).json()["products"]
    for p in products:
        assert p["ranking"]["internal_index"] is None
        assert p["ranking"]["components"] == []


def test_normalized_values_present_and_reference_matches_category():
    products = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a"}
    ).json()["products"]
    for p in products:
        expected = 50 if p["category"] == "bread" else 40
        assert p["reference_g"] == expected
        # synthetic seed uses serving_g == reference_g, so values align
        assert p["nutrition_per_reference"]["fiber_g"] is not None


# --------------------------------------------------------------------------- #
# Errors
# --------------------------------------------------------------------------- #
def _assert_envelope(body):
    assert set(body.keys()) == {"error"}
    err = body["error"]
    assert set(err.keys()) == {"code", "message", "request_id"}
    assert err["request_id"]


def test_missing_store_id_is_422_envelope():
    resp = client.get("/api/v1/products")
    assert resp.status_code == 422
    _assert_envelope(resp.json())
    assert resp.json()["error"]["code"] == "validation_error"


def test_invalid_category_is_422():
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "category": "salsa"}
    )
    assert resp.status_code == 422
    _assert_envelope(resp.json())


def test_invalid_priority_is_422():
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "priority": "cheapest"}
    )
    assert resp.status_code == 422
    _assert_envelope(resp.json())


def test_overlong_query_is_422():
    resp = client.get(
        "/api/v1/products", params={"store_id": "demo-store-a", "q": "x" * 101}
    )
    assert resp.status_code == 422
    _assert_envelope(resp.json())


def test_unknown_store_is_404():
    resp = client.get("/api/v1/products", params={"store_id": "demo-store-z"})
    assert resp.status_code == 404
    body = resp.json()
    _assert_envelope(body)
    assert body["error"]["code"] == "not_found"


def test_ingredient_found():
    resp = client.get("/api/v1/ingredients/cane-sugar")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "cane-sugar"
    assert body["content_status"] in {"reviewed", "draft", "synthetic"}


def test_ingredient_not_found_is_404_envelope():
    resp = client.get("/api/v1/ingredients/does-not-exist")
    assert resp.status_code == 404
    _assert_envelope(resp.json())
