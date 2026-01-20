"""
Redis Streams Client

Provides async Redis client for event streaming between microservices.
"""

import os
from typing import Any

import redis.asyncio as redis

# Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Global Redis client instance
_redis_client: redis.Redis | None = None


async def get_redis_client() -> redis.Redis:
    """
    Get or create the Redis client singleton.

    Returns:
        Async Redis client instance
    """
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


class RedisStreamClient:
    """
    Redis Streams wrapper for event publishing and consuming.

    Provides a high-level interface for event-driven communication
    between microservices.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def publish(
        self,
        stream: str,
        data: dict[str, Any],
        maxlen: int | None = 10000,
    ) -> str:
        """
        Publish a message to a Redis Stream.

        Args:
            stream: Stream name (e.g., "task.created")
            data: Message data dictionary
            maxlen: Maximum stream length (for memory management)

        Returns:
            Message ID assigned by Redis
        """
        message_id = await self.redis.xadd(
            stream,
            data,
            maxlen=maxlen,
            approximate=True,
        )
        return message_id

    async def read(
        self,
        streams: dict[str, str],
        count: int = 10,
        block: int | None = 5000,
    ) -> list[tuple[str, list[tuple[str, dict]]]]:
        """
        Read messages from one or more streams.

        Args:
            streams: Dict of stream names to last-read IDs
            count: Maximum messages to read
            block: Milliseconds to block (None for no blocking)

        Returns:
            List of (stream_name, [(message_id, data), ...])
        """
        result = await self.redis.xread(
            streams=streams,
            count=count,
            block=block,
        )
        return result or []

    async def create_consumer_group(
        self,
        stream: str,
        group: str,
        start_id: str = "0",
    ) -> bool:
        """
        Create a consumer group for a stream.

        Args:
            stream: Stream name
            group: Consumer group name
            start_id: ID to start reading from ("0" = beginning, "$" = new only)

        Returns:
            True if created, False if already exists
        """
        try:
            await self.redis.xgroup_create(
                stream,
                group,
                id=start_id,
                mkstream=True,
            )
            return True
        except redis.ResponseError as e:
            if "BUSYGROUP" in str(e):
                return False
            raise

    async def read_group(
        self,
        group: str,
        consumer: str,
        streams: dict[str, str],
        count: int = 10,
        block: int | None = 5000,
    ) -> list[tuple[str, list[tuple[str, dict]]]]:
        """
        Read messages as part of a consumer group.

        Args:
            group: Consumer group name
            consumer: Consumer name within the group
            streams: Dict of stream names to IDs (">" for new messages)
            count: Maximum messages to read
            block: Milliseconds to block

        Returns:
            List of (stream_name, [(message_id, data), ...])
        """
        result = await self.redis.xreadgroup(
            groupname=group,
            consumername=consumer,
            streams=streams,
            count=count,
            block=block,
        )
        return result or []

    async def ack(self, stream: str, group: str, *message_ids: str) -> int:
        """
        Acknowledge message processing.

        Args:
            stream: Stream name
            group: Consumer group name
            message_ids: Message IDs to acknowledge

        Returns:
            Number of messages acknowledged
        """
        return await self.redis.xack(stream, group, *message_ids)
