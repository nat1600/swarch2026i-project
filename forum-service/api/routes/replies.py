from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Query, status

from db.mongo import get_database
from models.reply import reply_document
from schemas.common import CursorPaginatedResponse
from schemas.reply import ReplyCreate, ReplyResponse, ReplyUpdate

router = APIRouter()

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def _replies():
    return get_database().replies


def _threads():
    return get_database().threads


# ── Helper: extract user_id from gateway header ─────────────
def _require_user(x_user_sub: str | None) -> str:
    if not x_user_sub:
        raise HTTPException(status_code=401, detail="Missing X-User-Sub header.")
    return x_user_sub


# ── GET /threads/{thread_id}/replies ─────────────────────────
# NOTE: This endpoint is mounted under the threads router prefix in app.py,
#       but since replies need their own prefix too, we register it here
#       with the full sub-path.  The app mounts this router at /replies,
#       but we also add a dedicated route on the threads router.
#       Actually, to keep things clean we mount this router at root and
#       define both /threads/{thread_id}/replies and /replies/{id} paths.


@router.get(
    "/threads/{thread_id}/replies",
    response_model=CursorPaginatedResponse[ReplyResponse],
)
async def list_replies(
    thread_id: str,
    after: str | None = Query(None, description="Cursor: _id of the last item"),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
):
    """List replies for a thread with cursor-based pagination."""
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    query: dict = {"thread_id": thread_id}
    if after:
        if not ObjectId.is_valid(after):
            raise HTTPException(status_code=400, detail="Invalid cursor.")
        query["_id"] = {"$gt": ObjectId(after)}

    cursor = _replies().find(query).sort("_id", 1).limit(limit + 1)
    items = await cursor.to_list(length=limit + 1)

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = str(items[-1]["_id"]) if items and has_more else None

    return CursorPaginatedResponse[ReplyResponse](
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


# ── POST /threads/{thread_id}/replies ────────────────────────
@router.post(
    "/threads/{thread_id}/replies",
    response_model=ReplyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reply(
    thread_id: str,
    body: ReplyCreate,
    x_user_sub: str | None = Header(None),
):
    """Create a reply to a thread (optionally nested under another reply)."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid thread id.")

    # Verify thread exists
    thread = await _threads().find_one({"_id": ObjectId(thread_id)})
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")

    # If replying to another reply, verify it exists and belongs to the same thread
    if body.parent_reply_id:
        if not ObjectId.is_valid(body.parent_reply_id):
            raise HTTPException(status_code=400, detail="Invalid parent_reply_id.")
        parent = await _replies().find_one({"_id": ObjectId(body.parent_reply_id)})
        if parent is None:
            raise HTTPException(status_code=404, detail="Parent reply not found.")
        if parent["thread_id"] != thread_id:
            raise HTTPException(
                status_code=400,
                detail="Parent reply does not belong to this thread.",
            )

    doc = reply_document(
        thread_id=thread_id,
        user_id=user_id,
        content=body.content,
        parent_reply_id=body.parent_reply_id,
    )
    result = await _replies().insert_one(doc)
    doc["_id"] = result.inserted_id

    # Increment replies_count on the thread
    await _threads().update_one(
        {"_id": ObjectId(thread_id)},
        {"$inc": {"replies_count": 1}},
    )

    return doc


# ── PATCH /replies/{reply_id} ────────────────────────────────
@router.patch("/replies/{reply_id}", response_model=ReplyResponse)
async def update_reply(
    reply_id: str,
    body: ReplyUpdate,
    x_user_sub: str | None = Header(None),
):
    """Partially update a reply. Only the author can edit."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(reply_id):
        raise HTTPException(status_code=400, detail="Invalid reply id.")

    reply = await _replies().find_one({"_id": ObjectId(reply_id)})
    if reply is None:
        raise HTTPException(status_code=404, detail="Reply not found.")
    if reply["user_id"] != user_id:
        raise HTTPException(
            status_code=403, detail="You can only edit your own replies."
        )

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updates["updated_at"] = datetime.now(timezone.utc)

    await _replies().update_one({"_id": ObjectId(reply_id)}, {"$set": updates})
    updated = await _replies().find_one({"_id": ObjectId(reply_id)})
    return updated


# ── DELETE /replies/{reply_id} ───────────────────────────────
@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(
    reply_id: str,
    x_user_sub: str | None = Header(None),
):
    """Delete a reply. Only the author can delete."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(reply_id):
        raise HTTPException(status_code=400, detail="Invalid reply id.")

    reply = await _replies().find_one({"_id": ObjectId(reply_id)})
    if reply is None:
        raise HTTPException(status_code=404, detail="Reply not found.")
    if reply["user_id"] != user_id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own replies."
        )

    await _replies().delete_one({"_id": ObjectId(reply_id)})

    # Decrement replies_count on the thread
    await _threads().update_one(
        {"_id": ObjectId(reply["thread_id"])},
        {"$inc": {"replies_count": -1}},
    )


# ── POST /replies/{reply_id}/like ────────────────────────────
@router.post("/replies/{reply_id}/like", response_model=ReplyResponse)
async def like_reply(
    reply_id: str,
    x_user_sub: str | None = Header(None),
):
    """Add a like to a reply."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(reply_id):
        raise HTTPException(status_code=400, detail="Invalid reply id.")

    result = await _replies().update_one(
        {"_id": ObjectId(reply_id)},
        {"$addToSet": {"likes": user_id}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reply not found.")

    # Sync likes_count
    reply = await _replies().find_one({"_id": ObjectId(reply_id)})
    if reply:
        actual = len(reply["likes"])
        if reply["likes_count"] != actual:
            await _replies().update_one(
                {"_id": ObjectId(reply_id)},
                {"$set": {"likes_count": actual}},
            )
            reply["likes_count"] = actual
    return reply


# ── DELETE /replies/{reply_id}/like ──────────────────────────
@router.delete("/replies/{reply_id}/like", response_model=ReplyResponse)
async def unlike_reply(
    reply_id: str,
    x_user_sub: str | None = Header(None),
):
    """Remove a like from a reply."""
    user_id = _require_user(x_user_sub)

    if not ObjectId.is_valid(reply_id):
        raise HTTPException(status_code=400, detail="Invalid reply id.")

    result = await _replies().update_one(
        {"_id": ObjectId(reply_id)},
        {"$pull": {"likes": user_id}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reply not found.")

    # Sync likes_count
    reply = await _replies().find_one({"_id": ObjectId(reply_id)})
    if reply:
        actual = len(reply["likes"])
        if reply["likes_count"] != actual:
            await _replies().update_one(
                {"_id": ObjectId(reply_id)},
                {"$set": {"likes_count": actual}},
            )
            reply["likes_count"] = actual
    return reply
