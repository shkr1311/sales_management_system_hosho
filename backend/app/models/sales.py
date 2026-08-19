import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Territory(Base):
    __tablename__ = "territories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="territory", foreign_keys="User.territory_id")


class TargetPeriod(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class SalesTarget(Base):
    __tablename__ = "sales_targets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    period = Column(Enum(TargetPeriod), default=TargetPeriod.MONTHLY, nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    achieved_amount = Column(Numeric(15, 2), default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="sales_targets")


class DiscountStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DiscountRequest(Base):
    __tablename__ = "discount_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_discount = Column(Numeric(5, 2), nullable=False)  # percentage
    original_value = Column(Numeric(15, 2), nullable=False)
    discounted_value = Column(Numeric(15, 2), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(DiscountStatus), default=DiscountStatus.PENDING, nullable=False, index=True)
    manager_comments = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    opportunity = relationship("Opportunity", back_populates="discount_requests")
    requester = relationship("User", foreign_keys=[requester_id], backref="discount_requests_made")
    approver = relationship("User", foreign_keys=[approver_id], backref="discount_requests_reviewed")
