import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Enum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class ActivityType(str, enum.Enum):
    CALL = "CALL"
    MEETING = "MEETING"
    DEMO = "DEMO"
    EMAIL = "EMAIL"
    FOLLOW_UP = "FOLLOW_UP"
    TASK = "TASK"


class ActivityStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    activity_type = Column(Enum(ActivityType), nullable=False)
    status = Column(Enum(ActivityStatus), default=ActivityStatus.PLANNED, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    contact_id = Column(Integer, ForeignKey("customer_contacts.id"), nullable=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=True, index=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="activities", foreign_keys=[user_id])
    customer = relationship("Customer", back_populates="activities")
    contact = relationship("CustomerContact", foreign_keys=[contact_id])
    opportunity = relationship("Opportunity", back_populates="activities")
