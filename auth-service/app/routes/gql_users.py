import strawberry
from strawberry.types import Info
from strawberry.fastapi import GraphQLRouter
from typing import Optional
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload

from app.types.gql_users import GraphQLUser, GraphQLLanguage, CreateUserInput
from app.models.user import User
from app.models.language import Language
from app.core.dependencies import get_db, get_current_user_sub


@strawberry.type
class Query:
    @strawberry.field
    async def my_profile(self, info: Info) -> Optional[GraphQLUser]:
        db: AsyncSession = info.context["db"]
        auth0_sub: str = info.context["auth0_sub"]

        user = await db.scalar(
            select(User)
            .where(User.auth0_id == auth0_sub)
            .options(
                selectinload(User.native_language),
                selectinload(User.learning_language),
            )
        )

        if not user:
            return None

        return GraphQLUser(
            id=user.id,
            auth0_id=user.auth0_id,
            email=user.email,
            username=user.username,
            timezone=user.timezone,
            native_language=GraphQLLanguage(id=user.native_language.id, name=user.native_language.name),
            learning_language=GraphQLLanguage(id=user.learning_language.id, name=user.learning_language.name),
            accumulated_points=user.accumulated_points,
            last_login_at=user.last_login_at,
        )

    @strawberry.field
    async def user_exists(self, info: Info) -> Optional[GraphQLUser]:
        db: AsyncSession = info.context["db"]
        auth0_sub: str = info.context["auth0_sub"]

        user = await db.scalar(
            select(User)
            .where(User.auth0_id == auth0_sub)
            .options(
                selectinload(User.native_language),
                selectinload(User.learning_language),
            )
        )

        if user is None:
            return None

        result = GraphQLUser(
            id=user.id,
            auth0_id=user.auth0_id,
            email=user.email,
            username=user.username,
            timezone=user.timezone,
            native_language=GraphQLLanguage(id=user.native_language.id, name=user.native_language.name),
            learning_language=GraphQLLanguage(id=user.learning_language.id, name=user.learning_language.name),
            accumulated_points=user.accumulated_points,
            last_login_at=user.last_login_at,
        )

        await db.execute(
            update(User)
            .where(User.auth0_id == auth0_sub)
            .values(last_login_at=func.now())
        )
        await db.commit()

        return result


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def register_user(self, input: CreateUserInput, info: Info) -> GraphQLUser:
        db: AsyncSession = info.context["db"]
        auth0_sub: str = info.context["auth0_sub"]

        existing = await db.scalar(
            select(User).where(User.auth0_id == auth0_sub)
        )
        if existing:
            raise ValueError("User already exists")

        native_language_id = await db.scalar(
            select(Language.id).where(Language.name == input.native_language)
        )
        if native_language_id is None:
            raise ValueError(f"Unknown language: {input.native_language}")

        learning_language_id = await db.scalar(
            select(Language.id).where(Language.name == input.learning_language)
        )
        if learning_language_id is None:
            raise ValueError(f"Unknown language: {input.learning_language}")

        user = User(
            auth0_id=auth0_sub,
            native_language_id=native_language_id,
            learning_language_id=learning_language_id,
            email=input.email,
            username=input.username,
            timezone=input.timezone,
            last_login_at=func.now(),
        )
        db.add(user)
        await db.commit()

        user = await db.scalar(
            select(User)
            .where(User.auth0_id == auth0_sub)
            .options(
                selectinload(User.native_language),
                selectinload(User.learning_language),
            )
            .execution_options(populate_existing=True)
        )

        return GraphQLUser(
            id=user.id,
            auth0_id=user.auth0_id,
            email=user.email,
            username=user.username,
            timezone=user.timezone,
            native_language=GraphQLLanguage(id=user.native_language.id, name=user.native_language.name),
            learning_language=GraphQLLanguage(id=user.learning_language.id, name=user.learning_language.name),
            accumulated_points=user.accumulated_points,
            last_login_at=user.last_login_at,
        )


async def get_graphql_context(
    auth0_sub: str = Depends(get_current_user_sub),
    db: AsyncSession = Depends(get_db)
):
    return {
        "auth0_sub": auth0_sub,
        "db": db
    }


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema, context_getter=get_graphql_context)
