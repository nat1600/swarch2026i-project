from fastapi import APIRouter, HTTPException, status
from bson import ObjectId

from db.mongo import get_database
from models.category import category_document
from schemas.category import CategoryCreate, CategoryResponse

router = APIRouter()


def _collection():
    return get_database().categories


# ── GET /categories ──────────────────────────────────────────
@router.get("", response_model=list[CategoryResponse])
async def list_categories():
    """Return all categories."""
    cursor = _collection().find().sort("name", 1)
    categories = await cursor.to_list(length=100)
    return categories


# ── POST /categories ─────────────────────────────────────────
@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(body: CategoryCreate):
    """Create a new category."""
    doc = category_document(name=body.name, description=body.description)
    try:
        result = await _collection().insert_one(doc)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{body.name}' already exists.",
        )
    doc["_id"] = result.inserted_id
    return doc


# ── GET /categories/{category_id} ───────────────────────────
@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    """Get a single category by id."""
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail="Invalid category id.")
    category = await _collection().find_one({"_id": ObjectId(category_id)})
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    return category
