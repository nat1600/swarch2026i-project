import strawberry
from strawberry.types import Info
from strawberry.fastapi import GraphQLRouter
from typing import Optional
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.types.gql_users import GraphQLUser, GraphQLLanguage
from app.models.user import User
from app.core.dependencies import get_db, get_current_user_sub



@strawberry.type
class Query:
    @strawberry.field
    async def my_profile(self, info: Info) -> Optional[GraphQLUser]:
        db: AsyncSession = info.context["db"]
        auth0_sub: str = info.context["auth0_sub"]

        # 2. Tu consulta EXACTA de SQLAlchemy (la misma que usaste en register)
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

        # 3. Mapeamos el modelo de SQLAlchemy al tipo de GraphQL
        return GraphQLUser(
            auth0_id=user.auth0_id,
            email=user.email,
            username=user.username,
            timezone=user.timezone,
            native_language=GraphQLLanguage(id=user.native_language.id, name=user.native_language.name),
            learning_language=GraphQLLanguage(id=user.learning_language.id, name=user.learning_language.name)
        )

# ==========================================
# 3. EL PUENTE (Inyección de Dependencias)
# ==========================================
async def get_graphql_context(
    auth0_sub: str = Depends(get_current_user_sub),
    db: AsyncSession = Depends(get_db)
):
    #Esto inyecta tus dependencias de FastAPI directo en el 'info.context' de GraphQL
    return {
        "auth0_sub": auth0_sub,
        "db": db
    }

# Creamos el router final
schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema, context_getter=get_graphql_context)
