"""
Event Publisher

High-level interface for publishing events to Redis Streams.
"""

import logging
from typing import TYPE_CHECKING

from .redis_streams import RedisStreamClient, get_redis_client

if TYPE_CHECKING:
    from .events import Event

logger = logging.getLogger(__name__)


class EventPublisher:
    """
    Publisher for sending events to Redis Streams.

    Usage:
        publisher = await EventPublisher.create()
        await publisher.publish(TaskCreatedEvent(...))
    """

    def __init__(self, stream_client: RedisStreamClient):
        self.stream_client = stream_client

    @classmethod
    async def create(cls) -> "EventPublisher":
        """Create an EventPublisher instance."""
        redis_client = await get_redis_client()
        stream_client = RedisStreamClient(redis_client)
        return cls(stream_client)

    async def publish(self, event: "Event") -> str:
        """
        Publish an event to its corresponding stream.

        Args:
            event: Event instance to publish

        Returns:
            Message ID assigned by Redis
        """
        stream_name = event.event_type
        data = event.to_stream_data()

        message_id = await self.stream_client.publish(stream_name, data)
        logger.info(f"Published {event.event_type} with ID {message_id}")

        return message_id

    async def publish_many(self, events: list["Event"]) -> list[str]:
        """
        Publish multiple events.

        Args:
            events: List of events to publish

        Returns:
            List of message IDs
        """
        message_ids = []
        for event in events:
            msg_id = await self.publish(event)
            message_ids.append(msg_id)
        return message_ids
