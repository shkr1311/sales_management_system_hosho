import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False, index=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_type = Column(String(50), default="STANDARD")  # STANDARD, STRATEGIC, KEY
    health_score = Column(Integer, default=50)  # 0-100
    contract_value = Column(Numeric(15, 2), nullable=True)
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="account")
    manager = relationship("User", back_populates="managed_accounts", foreign_keys=[manager_id])
    plans = relationship("AccountPlan", back_populates="account", cascade="all, delete-orphan")
    renewals = relationship("Renewal", back_populates="account")


class AccountPlanStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class AccountPlan(Base):
    __tablename__ = "account_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    objectives = Column(Text, nullable=True)
    strategy = Column(Text, nullable=True)
    key_contacts = Column(Text, nullable=True)
    revenue_goal = Column(Numeric(15, 2), nullable=True)
    next_actions = Column(Text, nullable=True)
    status = Column(Enum(AccountPlanStatus), default=AccountPlanStatus.DRAFT, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    account = relationship("Account", back_populates="plans")


class RenewalStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    IN_PROGRESS = "IN_PROGRESS"
    RENEWED = "RENEWED"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class Renewal(Base):
    __tablename__ = "renewals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True, index=True)
    contract_name = Column(String(255), nullable=False)
    contract_value = Column(Numeric(15, 2), nullable=True)
    renewal_date = Column(Date, nullable=False, index=True)
    reminder_date = Column(Date, nullable=True)
    status = Column(Enum(RenewalStatus), default=RenewalStatus.UPCOMING, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="renewals")
    account = relationship("Account", back_populates="renewals")


class SatisfactionRecord(Base):
    __tablename__ = "satisfaction_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    score = Column(Integer, nullable=False)  # 1-10
    rating = Column(String(20), nullable=True)  # POOR, FAIR, GOOD, EXCELLENT
    feedback = Column(Text, nullable=True)
    feedback_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="satisfaction_records")
    recorder = relationship("User", backref="recorded_satisfaction")
