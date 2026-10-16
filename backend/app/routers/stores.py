from __future__ import annotations

from fastapi import APIRouter, Depends

from app.schemas import StoresResponse
from app.services import catalog
from app.services.storage import CatalogStore, get_store

router = APIRouter(prefix="/api/v1", tags=["stores"])


@router.get("/stores", response_model=StoresResponse)
def list_stores(store: CatalogStore = Depends(get_store)) -> StoresResponse:
    return catalog.get_stores(store)
