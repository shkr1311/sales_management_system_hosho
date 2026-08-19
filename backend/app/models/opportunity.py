import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class OpportunityStage(str, enum.Enum):
    PROSPECTING = "PROSPECTING"
    QUALIFICATION = "QUALIFICATION"
    PROPOSAL = "PROPOSAL"
    NEGOTIATION = "NEGOTIATION"
    CLOSED_WON = "CLOSED_WON"
    CLOSED_LOST = "CLOSED_LOST"


class OpportunityStatus(str, enum.Enum):
    OPEN = "OPEN"
    WON = "WON"
    LOST = "LOST"
    ON_HOLD = "ON_HOLD"


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    deal_value = Column(Numeric(15, 2), nullable=False)
    stage = Column(Enum(OpportunityStage), default=OpportunityStage.PROSPECTING, nullable=False, index=True)
    status = Column(Enum(OpportunityStatus), default=OpportunityStatus.OPEN, nullable=False)
    probability = Column(Integer, default=10, nullable=False)  # 0-100
    expected_close_date = Column(Date, nullable=True, index=True)
    actual_close_date = Column(Date, nullable=True)
    loss_reason = Column(String(255), nullable=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="opportunities")
    owner = relationship("User", back_populates="owned_opportunities", foreign_keys=[owner_id])
    lead = relationship("Lead", back_populates="opportunity", foreign_keys=[lead_id])
    discount_requests = relationship("DiscountRequest", back_populates="opportunity")
    activities = relationship("Activity", back_populates="opportunity")
    competitor = relationship("Competitor", back_populates="opportunities")
