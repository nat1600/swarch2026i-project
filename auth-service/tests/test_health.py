"""
Integration tests for auth-service.

Tests the /health endpoint and basic GraphQL introspection.
The service lifespan sets up a real DB engine, so these tests
require either a running DB or the lifespan to be short-circuited.
We test the routes that don't depend on the database to keep
tests infrastructure-free.
"""
import pytest


# ─── GET /health ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_returns_200(client):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_returns_ok_status(client):
    response = await client.get("/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_identifies_service(client):
    response = await client.get("/health")
    data = response.json()
    assert "service" in data


# ─── POST /graphql (introspection) ───────────────────────────────────────────

INTROSPECTION_QUERY = """
{
  __schema {
    queryType {
      name
    }
  }
}
"""


@pytest.mark.asyncio
async def test_graphql_introspection_returns_200(client):
    response = await client.post(
        "/graphql",
        json={"query": INTROSPECTION_QUERY},
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_graphql_introspection_has_query_type(client):
    response = await client.post(
        "/graphql",
        json={"query": INTROSPECTION_QUERY},
        headers={"Content-Type": "application/json"},
    )
    data = response.json()
    assert "data" in data
    assert data["data"]["__schema"]["queryType"]["name"] == "Query"


@pytest.mark.asyncio
async def test_graphql_invalid_query_returns_error(client):
    response = await client.post(
        "/graphql",
        json={"query": "{ nonExistentField }"},
        headers={"Content-Type": "application/json"},
    )
    data = response.json()
    # GraphQL errors are returned in an "errors" key, not as HTTP 4xx
    assert "errors" in data
