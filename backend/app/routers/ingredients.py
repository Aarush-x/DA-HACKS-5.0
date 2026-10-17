from __future__ import annotations

from fastapi import APIRouter, Depends

from app.errors import NotFoundError
from app.schemas import IngredientListResponse, IngredientResponse
from app.services.storage import CatalogStore, get_store

router = APIRouter(prefix="/api/v1", tags=["ingredients"])


@router.get("/ingredients", response_model=IngredientListResponse)
def list_ingredients(store: CatalogStore = Depends(get_store)) -> IngredientListResponse:
    # Every explanation in one call, so the frontend can match chips by
    # name/alias without a request per ingredient.
    return IngredientListResponse(ingredients=store.ingredients())


@router.get("/ingredients/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(
    ingredient_id: str,
    store: CatalogStore = Depends(get_store),
) -> IngredientResponse:
    ingredient = store.ingredient(ingredient_id)
    if ingredient is None:
        # 404 means the explanation is unavailable, not that the ingredient is
        # dangerous.
        raise NotFoundError(f"No explanation available for ingredient: {ingredient_id}")
    return ingredient
