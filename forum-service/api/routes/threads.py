from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Query, status

from db.mongo import get_database
from models.thread import thread_document
from schemas.common import CursorPaginatedResponse
from schemas.thread import ThreadCreate, ThreadResponse, ThreadUpdate

router = APIRouter()

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def _threads():
    return get_database().threads


# ── Helper: extract user_id from gateway header ─────────────
def _require_user(x_user_sub: str | None) -> str:
    if not x_user_sub:
        raise HTTPException(status_code=401, detail="Missing X-User-Sub header.")
    return x_user_sub


# ── GET /threads ─────────────────────────────────────────────
@router.get("", response_model=CursorPaginatedResponse[ThreadResponse])
async def list_threads(
    category_id: str | None = Query(None),
    tag: str | None = Query(None),
    user_id: str | None = Query(None),
    after: str | None = Query(
        None, description="Cursor: _id of the last item from the previous page"
    ),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
):
    """List threads with optional filters and cursor-based pagination."""
    query: dict = {}

    if category_id:
        query["category_id"] = category_id
    if tag:
        query["tags"] = tag
    if user_id:
        query["user_id"] = user_id
    if after:
        if not ObjectId.is_valid(after):
            raise HTTPException(status_code=400, detail="Invalid cursor.")
        query["_id"] = {"$lt": ObjectId(after)}

    # Fetch limit + 1 to know if there are more results
    cursor = _threads().find(query).sort("_id", -1).limit(limit + 1)
    items = await cursor.to_list(length=limit + 1)

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = str(items[-1]["_id"]) if items and has_more else None

    return CursorPaginatedResponse[ThreadResponse](
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


# ── GET /threads/search ─────────────────────────────────────
@router.get("/search", response_model=CursorPaginatedResponse[ThreadResponse])
async def search_threads(
    q: str = Query(..., min_length=1, description="Search query"),
    after: str | None = Query(None),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
):
    """Full-text search on thread title and content."""
    query: dict = {"$text": {"$search": q}}

    if after:
        if not ObjectId.is_valid(after):
            raise HTTPException(status_code=400, detail="Invalid cursor.")
        query["_id"] = {"$lt": ObjectId(after)}

    cursor = (
        _threads()
        .find(query, {"score": {"$meta": "textScore"}})
        .sort([("score", {"$meta": "textScore"}), ("_id", -1)])
        .limit(limit + 1)
    )
    items = await cursor.to_list(length=limit + 1)

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = str(items[-1]["_id"]) if items and has_more else None

    return CursorPaginatedResponse[ThreadResponse](
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


# ── POST /threads ────────────────────────────────────────────
@router.post("", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    body: ThreadCreate,
    x_user_sub: str | None = Header(None),
):
    """Create a new thread."""
    user_id = _require_user(x_user_sub)

    # Validate category exists
    cat = await get_database().categories.find_one({"_id": ObjectId(body.category_id)})
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found.")

    doc = thread_document(
        category_id=body.category_id,
        user_id=user_id,
        title=body.title,
        content=body.content,
        tags=body.tags,
    )
    result = await _threads().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


# ── GET /threads/{thread_id} ────────────────────────────────
@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: str):
    """Get a single thread by id."""
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")
    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return thread


# ── PATCH /threads/{thread_id} ───────────────────────────────
@router.patch("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    body: ThreadUpdate,
    x_user_sub: str | None = Header(None),
):
    """Partially update a thread. Only the author can edit."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")
    if thread["user_id"] != user_id:
        raise HTTPException(
            status_code=403, detail="You can only edit your own threads."
        )

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updates["updated_at"] = datetime.now(timezone.utc)

    await _threads().update_one({"_id": ObjectId(thread_id)}, {"$set": updates})
    updated = await _threads().find_one({"_id": ObjectId(thread_id)})
    return updated


# ── DELETE /threads/{thread_id} ──────────────────────────────
@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: str,
    x_user_sub: str | None = Header(None),
):
    """Delete a thread and all its replies. Only the author can delete."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")
    if thread["user_id"] != user_id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own threads."
        )

    # Delete the thread and all its replies
    await _threads().delete_one({"_id": ObjectId(thread_id)})
    await get_database().replies.delete_many({"thread_id": thread_id})


# ── POST /threads/{thread_id}/like ───────────────────────────
@router.post("/{thread_id}/like", response_model=ThreadResponse)
async def like_thread(
    thread_id: str,
    x_user_sub: str | None = Header(None),
):
    """Add a like to a thread."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    # $addToSet prevents duplicate likes
    result = await _threads().update_one(
        {"_id": ObjectId(thread_id)},
        {"$addToSet": {"likes": user_id}, "$inc": {"likes_count": 1}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thread not found.")

    # Correct likes_count based on actual array length (avoids drift)
    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread and len(thread["likes"]) != thread["likes_count"]:
        await _threads().update_one(
            {"_id": ObjectId(thread_id)},
            {"$set": {"likes_count": len(thread["likes"])}},
        )
        thread["likes_count"] = len(thread["likes"])
    return thread


# ── DELETE /threads/{thread_id}/like ─────────────────────────
@router.delete("/{thread_id}/like", response_model=ThreadResponse)
async def unlike_thread(
    thread_id: str,
    x_user_sub: str | None = Header(None),
):
    """Remove a like from a thread."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    result = await _threads().update_one(
        {"_id": ObjectId(thread_id)},
        {"$pull": {"likes": user_id}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thread not found.")

    # Sync likes_count
    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread:
        actual = len(thread["likes"])
        if thread["likes_count"] != actual:
            await _threads().update_one(
                {"_id": ObjectId(thread_id)},
                {"$set": {"likes_count": actual}},
            )
            thread["likes_count"] = actual
    return thread
