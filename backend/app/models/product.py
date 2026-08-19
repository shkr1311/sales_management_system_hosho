import enum

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Numeric, Enum, Date, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(15, 2), nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    updates = relationship("ProductUpdate", back_populates="product", cascade="all, delete-orphan")
    documents = relationship("ProductDocument", back_populates="product", cascade="all, delete-orphan")
    feedback_records = relationship("CustomerFeedback", back_populates="product")
    feature_requests = relationship("FeatureRequest", back_populates="product")


class RoadmapStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_DEVELOPMENT = "IN_DEVELOPMENT"
    BETA = "BETA"
    RELEASED = "RELEASED"
    DEPRECATED = "DEPRECATED"


class ProductUpdate(Base):
    __tablename__ = "product_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    version = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    release_date = Column(Date, nullable=True)
    roadmap_status = Column(Enum(RoadmapStatus), default=RoadmapStatus.PLANNED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="updates")


class FeedbackStatus(str, enum.Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    feedback = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5
    source = Column(String(50), nullable=True)  # SALES_CALL, SUPPORT, SURVEY, EMAIL
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.NEW, nullable=False)
    feedback_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="feedback_records")
    product = relationship("Product", back_populates="feedback_records")
    recorder = relationship("User", backref="recorded_feedback")


class FeatureRequestPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FeatureRequestStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DECLINED = "DECLINED"


class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(FeatureRequestPriority), default=FeatureRequestPriority.MEDIUM, nullable=False)
    status = Column(Enum(FeatureRequestStatus), default=FeatureRequestStatus.SUBMITTED, nullable=False, index=True)
    business_impact = Column(Text, nullable=True)
    requested_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="feature_requests")
    product = relationship("Product", back_populates="feature_requests")


class DocStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ProductDocument(Base):
    __tablename__ = "product_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)  # TECHNICAL, USER_GUIDE, API, FAQ
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    version = Column(String(50), nullable=True)
    status = Column(Enum(DocStatus), default=DocStatus.DRAFT, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="documents")


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    opportunities = relationship("Opportunity", back_populates="competitor")
