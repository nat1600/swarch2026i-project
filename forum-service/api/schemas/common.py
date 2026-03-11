from __future__ import annotations

from typing import Any, Generic, List, Optional, TypeVar

from bson import ObjectId
from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema


# ── PyObjectId ───────────────────────────────────────────────
# Custom type so Pydantic can validate / serialise MongoDB ObjectIds.


class PyObjectId(str):
    """A string sub-type that validates MongoDB ObjectId values."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.no_info_plain_validator_function(cls.validate),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema: Any, handler: Any) -> dict:
        return handler(core_schema.str_schema())

    @classmethod
    def validate(cls, value: Any) -> str:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, str) and ObjectId.is_valid(value):
            return value
        raise ValueError(f"Invalid ObjectId: {value}")


# ── Cursor-based pagination wrapper ─────────────────────────

T = TypeVar("T")


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Generic wrapper for cursor-based paginated responses."""

    items: List[T]
    next_cursor: Optional[str] = None
    has_more: bool = False
