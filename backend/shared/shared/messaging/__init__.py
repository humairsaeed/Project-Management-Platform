"""
Messaging infrastructure using Redis Streams.
"""

from .redis_streams import RedisStreamClient, get_redis_client
from .events import Event, TaskCreatedEvent, TaskStatusChangedEvent, ProjectMilestoneEvent
from .publisher import EventPublisher
from .subscriber import EventSubscriber

__all__ = [
    "RedisStreamClient",
    "get_redis_client",
    "Event",
    "TaskCreatedEvent",
    "TaskStatusChangedEvent",
    "ProjectMilestoneEvent",
    "EventPublisher",
    "EventSubscriber",
]
