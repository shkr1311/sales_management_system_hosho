import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CampaignStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    campaign_type = Column(String(50), nullable=True)  # EMAIL, SOCIAL, EVENT, WEBINAR, etc.
    status = Column(Enum(CampaignStatus), default=CampaignStatus.PLANNED, nullable=False, index=True)
    budget = Column(Numeric(15, 2), nullable=True)
    actual_cost = Column(Numeric(15, 2), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    target_leads = Column(Integer, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", backref="owned_campaigns")
    leads = relationship("Lead", back_populates="campaign")


class CustomerSegment(Base):
    __tablename__ = "customer_segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    criteria_region = Column(String(100), nullable=True)
    criteria_industry = Column(String(100), nullable=True)
    criteria_min_revenue = Column(Numeric(15, 2), nullable=True)
    criteria_max_revenue = Column(Numeric(15, 2), nullable=True)
    customer_count = Column(Integer, default=0)
    revenue_contribution = Column(Numeric(15, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    members = relationship("CustomerSegmentMember", back_populates="segment", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="target_segment")


class CustomerSegmentMember(Base):
    __tablename__ = "customer_segment_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    segment_id = Column(Integer, ForeignKey("customer_segments.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    segment = relationship("CustomerSegment", back_populates="members")
    customer = relationship("Customer")


class ContentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ContentItem(Base):
    __tablename__ = "content_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(50), nullable=True)  # BROCHURE, CASE_STUDY, WHITEPAPER, PRESENTATION
    status = Column(Enum(ContentStatus), default=ContentStatus.DRAFT, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_segment_id = Column(Integer, ForeignKey("customer_segments.id"), nullable=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", backref="owned_content")
    target_segment = relationship("CustomerSegment", back_populates="content_items")
    campaign = relationship("Campaign", backref="content_items")
