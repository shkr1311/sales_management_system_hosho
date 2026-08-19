import enum

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class RoleName(str, enum.Enum):
    SALES_REP = "SALES_REP"
    SALES_MANAGER = "SALES_MANAGER"
    ACCOUNT_MANAGER = "ACCOUNT_MANAGER"
    MARKETING = "MARKETING"
    PRODUCT_MANAGER = "PRODUCT_MANAGER"
    EXECUTIVE = "EXECUTIVE"


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    territory = relationship("Territory", back_populates="users", foreign_keys=[territory_id])

    # Reverse relationships
    owned_customers = relationship("Customer", back_populates="owner", foreign_keys="Customer.owner_id")
    assigned_leads = relationship("Lead", back_populates="assigned_to_user", foreign_keys="Lead.assigned_to")
    owned_opportunities = relationship("Opportunity", back_populates="owner", foreign_keys="Opportunity.owner_id")
    activities = relationship("Activity", back_populates="user", foreign_keys="Activity.user_id")
    managed_accounts = relationship("Account", back_populates="manager", foreign_keys="Account.manager_id")
