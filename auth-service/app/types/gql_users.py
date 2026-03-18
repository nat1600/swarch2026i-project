import strawberry

@strawberry.type
class GraphQLLanguage:
    id: int
    name: str

@strawberry.type
class GraphQLUser:
    auth0_id: str
    email: str
    username: str
    timezone: str
    native_language: GraphQLLanguage
    learning_language: GraphQLLanguage
