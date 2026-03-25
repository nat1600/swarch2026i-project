from datetime import datetime, timezone
from typing import List, Optional


def thread_document(
    category_id: str,
    user_id: str,
    title: str,
    content: str,
    tags: Optional[List[str]] = None,
) -> dict:
    """Build a thread document ready to insert into MongoDB."""
    return {
        "category_id": category_id,
        "user_id": user_id,
        "title": title,
        "content": content,
        "tags": tags or [],
        "likes": [],
        "likes_count": 0,
        "replies_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }
