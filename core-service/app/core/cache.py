import json
import redis
from functools import wraps
from app.core.config import get_settings

_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client

def cache_result(ttl_seconds=300):
    """Cache function result in Redis."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redis_client = get_redis()
            # Build cache key: func_name:user_id
            user_id = kwargs.get('user_id') or (args[1] if len(args) > 1 else None)
            if not user_id:
                return func(*args, **kwargs)
            
            cache_key = f"{func.__name__}:{user_id}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute and cache
            result = func(*args, **kwargs)
            
            # Convert SQLAlchemy objects to dict for JSON serialization
            if isinstance(result, list):
                data = [item.__dict__ if hasattr(item, '__dict__') else item for item in result]
            else:
                data = result.__dict__ if hasattr(result, '__dict__') else result
            
            redis_client.setex(cache_key, ttl_seconds, json.dumps(data, default=str))
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: str):
    """Invalidate cache keys matching pattern."""
    redis_client = get_redis()
    for key in redis_client.scan_iter(match=pattern):
        redis_client.delete(key)
