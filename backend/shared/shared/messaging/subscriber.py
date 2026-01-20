"""
Event Subscriber

High-level interface for consuming events from Redis Streams.
"""

import asyncio
import logging
from typing import Callable, Awaitable, Any

from .redis_streams import RedisStreamClient, get_redis_client

logger = logging.getLogger(__name__)

# Type alias for event handlers
EventHandler = Callable[[str, dict[str, Any]], Awaitable[None]]


class EventSubscriber:
    """
    Subscriber for consuming events from Redis Streams.

    Usage:
        subscriber = await EventSubscriber.create(
            group="insights-service",
            consumer="worker-1",
        )

        @subscriber.on("task.created")
        async def handle_task_created(message_id, data):
            ...

        await subscriber.start()
    """

    def __init__(
        self,
        stream_client: RedisStreamClient,
        group: str,
        consumer: str,
    ):
        self.stream_client = stream_client
        self.group = group
        self.consumer = consumer
        self.handlers: dict[str, EventHandler] = {}
        self._running = False

    @classmethod
    async def create(cls, group: str, consumer: str) -> "EventSubscriber":
        """Create an EventSubscriber instance."""
        redis_client = await get_redis_client()
        stream_client = RedisStreamClient(redis_client)
        return cls(stream_client, group, consumer)

    def on(self, stream: str) -> Callable[[EventHandler], EventHandler]:
        """
        Decorator to register an event handler.

        Usage:
            @subscriber.on("task.created")
            async def handle_task(message_id, data):
                ...
        """
        def decorator(handler: EventHandler) -> EventHandler:
            self.handlers[stream] = handler
            return handler
        return decorator

    async def start(self) -> None:
        """
        Start consuming events from registered streams.

        This runs in an infinite loop until stopped.
        """
        if not self.handlers:
            raise ValueError("No event handlers registered")

        # Create consumer groups for all streams
        for stream in self.handlers:
            await self.stream_client.create_consumer_group(
                stream,
                self.group,
                start_id="$",  # Only new messages
            )

        self._running = True
        logger.info(
            f"Starting event subscriber: group={self.group}, "
            f"consumer={self.consumer}, streams={list(self.handlers.keys())}"
        )

        while self._running:
            try:
                # Read from all registered streams
                streams = {stream: ">" for stream in self.handlers}
                messages = await self.stream_client.read_group(
                    group=self.group,
                    consumer=self.consumer,
                    streams=streams,
                    count=10,
                    block=5000,
                )

                for stream_name, stream_messages in messages:
                    handler = self.handlers.get(stream_name)
                    if not handler:
                        continue

                    for message_id, data in stream_messages:
                        try:
                            await handler(message_id, data)
                            await self.stream_client.ack(
                                stream_name,
                                self.group,
                                message_id,
                            )
                        except Exception as e:
                            logger.error(
                                f"Error handling {stream_name} message "
                                f"{message_id}: {e}"
                            )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Subscriber error: {e}")
                await asyncio.sleep(1)

        logger.info("Event subscriber stopped")

    def stop(self) -> None:
        """Stop the event subscriber."""
        self._running = False
