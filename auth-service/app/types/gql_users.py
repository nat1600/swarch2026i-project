from datetime import datetime
import strawberry


@strawberry.type
class GraphQLLanguage:
    id: int
    name: str


@strawberry.type
class GraphQLUser:
    id: int
    auth0_id: str
    email: str
    username: str
    timezone: str
    native_language: GraphQLLanguage
    learning_language: GraphQLLanguage
    accumulated_points: int | None = None
    last_login_at: datetime | None = None


@strawberry.input
class CreateUserInput:
    email: str
    username: str
    timezone: str
    native_language: str
    learning_language: str
