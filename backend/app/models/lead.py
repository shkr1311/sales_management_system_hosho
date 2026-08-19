import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    UNQUALIFIED = "UNQUALIFIED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    REFERRAL = "REFERRAL"
    CAMPAIGN = "CAMPAIGN"
    COLD_CALL = "COLD_CALL"
    TRADE_SHOW = "TRADE_SHOW"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    OTHER = "OTHER"


class LeadPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False, index=True)
    source = Column(Enum(LeadSource), default=LeadSource.OTHER, nullable=True)
    priority = Column(Enum(LeadPriority), default=LeadPriority.MEDIUM, nullable=True)
    estimated_value = Column(Numeric(15, 2), nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    company_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    assignment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="leads")
    assigned_to_user = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to])
    campaign = relationship("Campaign", back_populates="leads")
    opportunity = relationship("Opportunity", back_populates="lead", uselist=False)
