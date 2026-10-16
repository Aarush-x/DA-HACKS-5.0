from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas import CatalogResponse, Category, Priority
from app.services import catalog
from app.services.storage import CatalogStore, get_store

router = APIRouter(prefix="/api/v1", tags=["products"])


@router.get("/products", response_model=CatalogResponse)
def get_products(
    store_id: str = Query(..., description="demo-store-a or demo-store-b"),
    category: Optional[Category] = Query(None),
    q: Optional[str] = Query(None, max_length=100),
    priority: Priority = Query("balanced"),
    store: CatalogStore = Depends(get_store),
) -> CatalogResponse:
    # Invalid category/priority enums and an over-long q are rejected as 422 by
    # FastAPI validation before reaching here. An unknown but well-formed
    # store_id becomes a 404 inside the service.
    return catalog.get_catalog(
        store=store,
        store_id=store_id,
        category=category,
        q=q,
        priority=priority,
    )
