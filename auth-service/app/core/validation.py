"""
User identity extraction from gateway-forwarded headers.

The API Gateway validates Auth0 JWT tokens and forwards the authenticated
user's "sub" claim as the X-User-Sub header to downstream services.
"""

from fastapi import Header, HTTPException, status


async def get_current_user_sub(
    x_user_sub: str | None = Header(default=None),
) -> str:
    """
    Extracts the authenticated user's Auth0 subject (sub) from the
    X-User-Sub header set by the API Gateway after JWT validation.
    """
    if not x_user_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identity",
        )
    return x_user_sub
