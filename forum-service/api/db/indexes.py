from db.mongo import get_database


async def create_indexes() -> None:
    """Create MongoDB indexes for optimal query performance."""
    db = get_database()

    # ── Threads ──────────────────────────────────────────────
    threads = db.threads

    # Text index for full-text search on title and content
    await threads.create_index(
        [("title", "text"), ("content", "text")],
        name="threads_text_search",
    )

    # Compound index: list threads by category sorted by newest first
    await threads.create_index(
        [("category_id", 1), ("created_at", -1)],
        name="threads_category_created",
    )

    # Index on tags for filtering
    await threads.create_index("tags", name="threads_tags")

    # ── Replies ──────────────────────────────────────────────
    replies = db.replies

    # Compound index: list replies for a thread sorted by creation date
    await replies.create_index(
        [("thread_id", 1), ("created_at", 1)],
        name="replies_thread_created",
    )

    # Index on parent_reply_id for fetching nested replies
    await replies.create_index("parent_reply_id", name="replies_parent")

    # ── Categories ───────────────────────────────────────────
    categories = db.categories

    # Unique index on category name
    await categories.create_index("name", unique=True, name="categories_name_unique")

    print("MongoDB indexes created successfully.")
