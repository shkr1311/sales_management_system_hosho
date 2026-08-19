from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field


# ---- Customer Schemas ----
class CustomerContactBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    is_primary: bool = False


class CustomerContactCreate(CustomerContactBase):
    pass


class CustomerContactStandaloneCreate(CustomerContactBase):
    customer_id: int


class CustomerContactUpdate(BaseModel):
    customer_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    is_primary: Optional[bool] = None


class CustomerContactResponse(CustomerContactBase):
    id: int
    customer_id: int
    created_at: Optional[datetime] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    region: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    status: Optional[str] = "PROSPECT"
    annual_revenue: Optional[Decimal] = None
    employee_count: Optional[int] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    owner_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None
    annual_revenue: Optional[Decimal] = None
    employee_count: Optional[int] = None
    owner_id: Optional[int] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    contacts: List[CustomerContactResponse] = []

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Lead Schemas ----
class LeadBase(BaseModel):
    title: str = Field(..., min_length=1)
    customer_id: Optional[int] = None
    status: Optional[str] = "NEW"
    source: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    estimated_value: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    campaign_id: Optional[int] = None


class LeadCreate(LeadBase):
    assigned_to: Optional[int] = None


class LeadUpdate(BaseModel):
    title: Optional[str] = None
    customer_id: Optional[int] = None
    assigned_to: Optional[int] = None
    status: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    campaign_id: Optional[int] = None


class LeadResponse(LeadBase):
    id: int
    assigned_to: Optional[int] = None
    assignment_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Opportunity Schemas ----
class OpportunityBase(BaseModel):
    name: str = Field(..., min_length=1)
    customer_id: int
    deal_value: Decimal
    stage: Optional[str] = "PROSPECTING"
    status: Optional[str] = "OPEN"
    probability: Optional[int] = Field(10, ge=0, le=100)
    expected_close_date: Optional[date] = None
    loss_reason: Optional[str] = None
    competitor_id: Optional[int] = None
    notes: Optional[str] = None
    lead_id: Optional[int] = None


class OpportunityCreate(OpportunityBase):
    owner_id: Optional[int] = None


class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    customer_id: Optional[int] = None
    owner_id: Optional[int] = None
    deal_value: Optional[Decimal] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    loss_reason: Optional[str] = None
    competitor_id: Optional[int] = None
    notes: Optional[str] = None


class OpportunityResponse(OpportunityBase):
    id: int
    owner_id: int
    actual_close_date: Optional[date] = None
    customer_name: Optional[str] = None
    owner_name: Optional[str] = None
    competitor_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Activity Schemas ----
class ActivityBase(BaseModel):
    title: str = Field(..., min_length=1)
    activity_type: str
    status: Optional[str] = "PLANNED"
    customer_id: Optional[int] = None
    contact_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    scheduled_date: datetime
    follow_up_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None


class ActivityCreate(ActivityBase):
    user_id: Optional[int] = None


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    activity_type: Optional[str] = None
    status: Optional[str] = None
    customer_id: Optional[int] = None
    contact_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None


class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    completed_date: Optional[datetime] = None
    customer_name: Optional[str] = None
    contact_name: Optional[str] = None
    user_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Sales Target Schemas ----
class SalesTargetBase(BaseModel):
    period: str = "MONTHLY"
    target_amount: Decimal
    achieved_amount: Optional[Decimal] = Decimal("0")
    start_date: date
    end_date: date


class SalesTargetCreate(SalesTargetBase):
    user_id: int


class SalesTargetUpdate(BaseModel):
    target_amount: Optional[Decimal] = None
    achieved_amount: Optional[Decimal] = None
    period: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SalesTargetResponse(SalesTargetBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Discount Request Schemas ----
class DiscountRequestCreate(BaseModel):
    opportunity_id: int
    requested_discount: Decimal = Field(..., ge=0, le=100)
    original_value: Decimal
    discounted_value: Decimal
    reason: str = Field(..., min_length=1)


class DiscountRequestUpdate(BaseModel):
    manager_comments: Optional[str] = None


class DiscountRequestResponse(BaseModel):
    id: int
    opportunity_id: int
    requester_id: int
    approver_id: Optional[int] = None
    requested_discount: Decimal
    original_value: Decimal
    discounted_value: Decimal
    reason: str
    status: str
    manager_comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Territory Schemas ----
class TerritoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)
    description: Optional[str] = None
    manager_id: Optional[int] = None


class TerritoryCreate(TerritoryBase):
    pass


class TerritoryUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[int] = None


class TerritoryResponse(TerritoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
