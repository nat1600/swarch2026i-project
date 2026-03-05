from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Language(Base):
    """Lookup table of supported languages (e.g. English, Spanish)."""

    __tablename__ = 'languages'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(
        unique=True, comment="Display name of the language, must be unique"
    )
