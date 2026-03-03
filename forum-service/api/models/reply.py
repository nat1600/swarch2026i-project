from datetime import datetime, timezone
from typing import Optional


def reply_document(
    thread_id: str,
    user_id: str,
    content: str,
    parent_reply_id: Optional[str] = None,
) -> dict:
    """Build a reply document ready to insert into MongoDB."""
    return {
        "thread_id": thread_id,
        "user_id": user_id,
        "content": content,
        "parent_reply_id": parent_reply_id,
        "likes": [],
        "likes_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }
