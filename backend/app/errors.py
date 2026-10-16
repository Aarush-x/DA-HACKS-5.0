"""Application errors mapped to the shared error envelope.

    { "error": { "code": str, "message": str, "request_id": str } }

Error bodies never contain stack traces or database credentials.
"""
from __future__ import annotations


class ApiError(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(ApiError):
    status_code = 404
    code = "not_found"


class StorageUnavailableError(ApiError):
    status_code = 503
    code = "storage_unavailable"
