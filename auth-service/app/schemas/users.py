from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import User


# ---------------------------------------------------------------------
# ------------------------------- REQUEST ----------------------------
# ---------------------------------------------------------------------
class CreateUser(BaseModel):
    native_language: str
    learning_language: str
    email: str
    username: str
    timezone: str


# ---------------------------------------------------------------------
# ------------------------------- RESPONSE ----------------------------
# ---------------------------------------------------------------------
class LanguageNested(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )
    id: int
    name: str


class UserData(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )
    id: str
    native_language: LanguageNested
    learning_language: LanguageNested
    email: str
    accumulated_points: int
    last_login_at: datetime


class UserResponse(BaseModel):
    data: None | UserData

    @classmethod
    def from_db(cls, user: User) -> "UserResponse":
        return cls(data=UserData(
            id=user.auth0_id,
            native_language=user.native_language,
            learning_language=user.learning_language,
            email=user.email,
            accumulated_points=user.accumulated_points,
            last_login_at=user.last_login_at
        ))
