
import redis
import os
import datetime
from dotenv import load_dotenv

load_dotenv()


redis_password = os.getenv('REDIS_PASSWORD')
redis_uri = f"redis://default:{redis_password}@redis-15335.c341.af-south-1-1.ec2.cloud.redislabs.com:15335"


# Create a Redis client
redis_client = redis.Redis.from_url(redis_uri)

try:
    print("Ping:", redis_client.ping())  # Should print True
except Exception as e:
    print("Connection failed:", e)

def heartbeat(redis_client):
    """
    Write a heartbeat key with the current timestamp and read it back.
    This counts as real activity (SET + GET).
    """
    try:
        timestamp = datetime.datetime.now().isoformat()
        redis_client.set("heartbeat", timestamp)
        value = redis_client.get("heartbeat")
        print(f"Heartbeat written and read: {value.decode('utf-8')}")
    except Exception as e:
        print("Error during heartbeat:", e)


def show_limiter_keys(redis_client, pattern="LIMITER*"):
    """
    List all keys matching the limiter pattern and print their values.
    """
    try:
        keys = redis_client.keys(pattern)
        if not keys:
            print("No limiter keys found.")
            return

        print(f"Found {len(keys)} limiter keys:")
        for key in keys:
            # Redis returns keys as bytes, so decode them
            key_str = key.decode("utf-8")
            value = redis_client.get(key)
            print(f"{key_str} -> {value.decode('utf-8') if value else None}")
    except Exception as e:
        print("Error while fetching limiter keys:", e)


show_limiter_keys(redis_client)
heartbeat(redis_client)