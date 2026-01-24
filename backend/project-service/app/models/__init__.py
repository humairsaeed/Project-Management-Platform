"""
Project Service database models.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"schema": "projects"}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planning", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    completion_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    owner_team_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    manager_user_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    target_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    target_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    milestones: Mapped[list["Milestone"]] = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    assignments: Mapped[list["ProjectAssignment"]] = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"schema": "projects"}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False
    )
    parent_task_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.tasks.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="todo", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    assigned_to_user_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    actual_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    completion_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    path: Mapped[str | None] = mapped_column(String, nullable=True)  # LTREE stored as string
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="tasks")
    parent_task: Mapped["Task | None"] = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks: Mapped[list["Task"]] = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = {"schema": "projects"}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="milestones")


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"
    __table_args__ = {"schema": "projects"}

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="member", nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    assigned_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="assignments")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    __table_args__ = {"schema": "projects"}

    predecessor_task_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.tasks.id", ondelete="CASCADE"), primary_key=True
    )
    successor_task_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("projects.tasks.id", ondelete="CASCADE"), primary_key=True
    )
    dependency_type: Mapped[str] = mapped_column(String(20), default="finish_to_start", nullable=False)
