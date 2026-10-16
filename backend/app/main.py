"""ShelfSense backend — FastAPI app.

Exposes:
    GET /healthz
    GET /api/v1/stores
    GET /api/v1/products
    GET /api/v1/ingredients/{ingredient_id}

Liveness (/healthz) is kept separate from storage readiness. All error paths,
including FastAPI's 422 validation errors, are normalized to the shared error
envelope. Bodies never contain stack traces or credentials.
"""
from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.errors import ApiError
from app.routers import ingredients, products, stores

settings = get_settings()

app = FastAPI(title="ShelfSense API", version="1")

# No cookies or auth are used, so credentials stay off. Only the configured
# exact origins are allowed; GET/OPTIONS covers the public read flow.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(stores.router)
app.include_router(products.router)
app.include_router(ingredients.router)


def _request_id(request: Request) -> str:
    # Honor an upstream request id if present, else mint one.
    return request.headers.get("x-request-id") or uuid.uuid4().hex


def _envelope(status_code: int, code: str, message: str, request_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "request_id": request_id}},
    )


@app.exception_handler(ApiError)
async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
    return _envelope(exc.status_code, exc.code, exc.message, _request_id(request))


@app.exception_handler(RequestValidationError)
async def handle_validation_error(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Compact, safe summary of what failed validation — no internal payloads.
    problems = []
    for err in exc.errors():
        location = ".".join(str(part) for part in err.get("loc", []) if part != "query")
        problems.append(f"{location}: {err.get('msg')}" if location else err.get("msg"))
    message = "; ".join(problems) or "Invalid request parameters."
    return _envelope(422, "validation_error", message, _request_id(request))


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    code = "not_found" if exc.status_code == 404 else "http_error"
    message = exc.detail if isinstance(exc.detail, str) else "Request could not be completed."
    return _envelope(exc.status_code, code, message, _request_id(request))


@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
    # Never leak internals; log server-side in a real deployment.
    return _envelope(500, "internal_error", "An unexpected error occurred.", _request_id(request))


@app.get("/healthz", tags=["health"])
def healthz() -> dict:
    return {"status": "ok", "api_version": "1"}
