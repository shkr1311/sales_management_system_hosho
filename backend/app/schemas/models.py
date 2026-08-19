from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field


# ---- Account Schemas ----
class AccountBase(BaseModel):
    customer_id: int
    account_type: Optional[str] = "STANDARD"
    health_score: Optional[int] = Field(50, ge=0, le=100)
    contract_value: Optional[Decimal] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    notes: Optional[str] = None


class AccountCreate(AccountBase):
    manager_id: Optional[int] = None


class AccountUpdate(BaseModel):
    account_type: Optional[str] = None
    health_score: Optional[int] = Field(None, ge=0, le=100)
    contract_value: Optional[Decimal] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    manager_id: Optional[int] = None
    notes: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    manager_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Account Plan Schemas ----
class AccountPlanBase(BaseModel):
    account_id: int
    title: str = Field(..., min_length=1)
    objectives: Optional[str] = None
    strategy: Optional[str] = None
    key_contacts: Optional[str] = None
    revenue_goal: Optional[Decimal] = None
    next_actions: Optional[str] = None
    status: Optional[str] = "DRAFT"
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AccountPlanCreate(AccountPlanBase):
    pass


class AccountPlanUpdate(BaseModel):
    title: Optional[str] = None
    objectives: Optional[str] = None
    strategy: Optional[str] = None
    key_contacts: Optional[str] = None
    revenue_goal: Optional[Decimal] = None
    next_actions: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AccountPlanResponse(AccountPlanBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Renewal Schemas ----
class RenewalBase(BaseModel):
    customer_id: int
    account_id: Optional[int] = None
    contract_name: str = Field(..., min_length=1)
    contract_value: Optional[Decimal] = None
    renewal_date: date
    reminder_date: Optional[date] = None
    status: Optional[str] = "UPCOMING"
    notes: Optional[str] = None


class RenewalCreate(RenewalBase):
    pass


class RenewalUpdate(BaseModel):
    contract_name: Optional[str] = None
    contract_value: Optional[Decimal] = None
    renewal_date: Optional[date] = None
    reminder_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class RenewalResponse(RenewalBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Satisfaction Schemas ----
class SatisfactionBase(BaseModel):
    customer_id: int
    score: int = Field(..., ge=1, le=10)
    rating: Optional[str] = None
    feedback: Optional[str] = None
    feedback_date: date


class SatisfactionCreate(SatisfactionBase):
    recorded_by: Optional[int] = None


class SatisfactionUpdate(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=10)
    rating: Optional[str] = None
    feedback: Optional[str] = None


class SatisfactionResponse(SatisfactionBase):
    id: int
    recorded_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Campaign Schemas ----
class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = "PLANNED"
    budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_leads: Optional[int] = None


class CampaignCreate(CampaignBase):
    owner_id: Optional[int] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_leads: Optional[int] = None


class CampaignResponse(CampaignBase):
    id: int
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Customer Segment Schemas ----
class CustomerSegmentBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    criteria_region: Optional[str] = None
    criteria_industry: Optional[str] = None
    criteria_min_revenue: Optional[Decimal] = None
    criteria_max_revenue: Optional[Decimal] = None


class CustomerSegmentCreate(CustomerSegmentBase):
    pass


class CustomerSegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    criteria_region: Optional[str] = None
    criteria_industry: Optional[str] = None
    criteria_min_revenue: Optional[Decimal] = None
    criteria_max_revenue: Optional[Decimal] = None


class CustomerSegmentResponse(CustomerSegmentBase):
    id: int
    customer_count: int = 0
    revenue_contribution: Optional[Decimal] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Content Item Schemas ----
class ContentItemBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = "DRAFT"
    target_segment_id: Optional[int] = None
    campaign_id: Optional[int] = None


class ContentItemCreate(ContentItemBase):
    owner_id: Optional[int] = None


class ContentItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = None
    target_segment_id: Optional[int] = None
    campaign_id: Optional[int] = None


class ContentItemResponse(ContentItemBase):
    id: int
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Product Schemas ----
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[int] = 1


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Product Update Schemas ----
class ProductUpdateBase(BaseModel):
    product_id: int
    title: str = Field(..., min_length=1)
    version: Optional[str] = None
    description: Optional[str] = None
    release_date: Optional[date] = None
    roadmap_status: Optional[str] = "PLANNED"


class ProductUpdateCreate(ProductUpdateBase):
    pass


class ProductUpdateSchema(BaseModel):
    title: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    release_date: Optional[date] = None
    roadmap_status: Optional[str] = None


class ProductUpdateResponse(ProductUpdateBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Customer Feedback Schemas ----
class CustomerFeedbackBase(BaseModel):
    customer_id: int
    product_id: Optional[int] = None
    feedback: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)
    source: Optional[str] = None
    status: Optional[str] = "NEW"
    feedback_date: date


class CustomerFeedbackCreate(CustomerFeedbackBase):
    recorded_by: Optional[int] = None


class CustomerFeedbackUpdate(BaseModel):
    feedback: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    source: Optional[str] = None
    status: Optional[str] = None


class CustomerFeedbackResponse(CustomerFeedbackBase):
    id: int
    recorded_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Feature Request Schemas ----
class FeatureRequestBase(BaseModel):
    customer_id: int
    product_id: Optional[int] = None
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "SUBMITTED"
    business_impact: Optional[str] = None
    requested_date: date


class FeatureRequestCreate(FeatureRequestBase):
    pass


class FeatureRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    business_impact: Optional[str] = None


class FeatureRequestResponse(FeatureRequestBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Product Document Schemas ----
class ProductDocumentBase(BaseModel):
    product_id: int
    title: str = Field(..., min_length=1)
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = "DRAFT"


class ProductDocumentCreate(ProductDocumentBase):
    pass


class ProductDocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None


class ProductDocumentResponse(ProductDocumentBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Competitor Schemas ----
class CompetitorBase(BaseModel):
    name: str = Field(..., min_length=1)
    website: Optional[str] = None
    description: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None


class CompetitorCreate(CompetitorBase):
    pass


class CompetitorUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None


class CompetitorResponse(CompetitorBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Pagination ----
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
