from datetime import datetime, timezone


def category_document(name: str, description: str) -> dict:
    """Build a category document ready to insert into MongoDB."""
    return {
        "name": name,
        "description": description,
        "created_at": datetime.now(timezone.utc),
    }
