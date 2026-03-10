"""
JWT validation for Auth0 access tokens.

Fetches Auth0's JWKS (public keys), caches them, and validates
incoming Bearer tokens on every request.
"""
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings, Settings


_jwks_cache: dict | None = None
_bearer_scheme = HTTPBearer(
    description="Auth0 access token (JWT)",
    auto_error=True,
)


async def validate_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """
    Validates an Auth0 JWT access token.

    Returns the decoded token payload (claims) if valid.
    Raises 401 on any validation failure.

    What this checks:
        1. Token signature (using Auth0's public RSA key)
        2. Token expiration (exp claim)
        3. Issuer matches your Auth0 tenant (iss claim)
        4. Audience matches your API identifier (aud claim)
    """
    token = credentials.credentials

    # Decode the header without verification to get the key ID
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
        )

    # Find the matching public key from Auth0's JWKS
    jwks = await _get_jwks(settings)
    rsa_key = _find_rsa_key(jwks, unverified_header.get("kid", ""))

    if rsa_key is None:
        # Key not found — maybe Auth0 rotated keys. Clear cache and retry once.
        global _jwks_cache
        _jwks_cache = None
        jwks = await _get_jwks(settings)
        rsa_key = _find_rsa_key(jwks, unverified_header.get("kid", ""))

        if rsa_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate signing key",
            )

    # Validate the token
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=[settings.auth0_algorithms],
            audience=settings.auth0_api_audience,
            issuer=settings.issuer,
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {e}",
        )

    return payload


async def _get_jwks(settings: Settings) -> dict:
    """
    Fetch and cache Auth0's JSON Web Key Set.
    """
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


def _find_rsa_key(jwks: dict, kid: str) -> dict | None:
    """Match the token's key ID to one of Auth0's public keys."""
    for key in jwks.get("keys", []):
        if key["kid"] == kid:
            return {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    return None
