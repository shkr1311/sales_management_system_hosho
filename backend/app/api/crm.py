from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer, CustomerContact
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.sales import Territory, SalesTarget, DiscountRequest, DiscountStatus
from app.core.security import get_current_user, require_roles
from app.schemas.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
    CustomerContactCreate, CustomerContactStandaloneCreate, CustomerContactUpdate, CustomerContactResponse,
    LeadCreate, LeadUpdate, LeadResponse,
    OpportunityCreate, OpportunityUpdate, OpportunityResponse,
    ActivityCreate, ActivityUpdate, ActivityResponse,
    SalesTargetCreate, SalesTargetUpdate, SalesTargetResponse,
    DiscountRequestCreate, DiscountRequestUpdate, DiscountRequestResponse,
    TerritoryCreate, TerritoryUpdate, TerritoryResponse,
)

import math
from datetime import date, datetime, timezone

# ============================================================
# CUSTOMERS
# ============================================================
customers_router = APIRouter(prefix="/customers", tags=["Customers"])


@customers_router.get("")
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None,
    industry: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Customer)

    if search:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.city.ilike(f"%{search}%"),
                Customer.industry.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.filter(Customer.status == status)
    if region:
        query = query.filter(Customer.region == region)
    if industry:
        query = query.filter(Customer.industry == industry)

    total = query.count()
    customers = query.order_by(Customer.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [CustomerListResponse.model_validate(c) for c in customers],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@customers_router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.model_validate(customer)


@customers_router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    customer = Customer(**data.model_dump())
    if customer.owner_id is None:
        customer.owner_id = current_user.id
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@customers_router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@customers_router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER")),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()


# ---- Customer Contacts ----
@customers_router.get("/{customer_id}/contacts", response_model=list[CustomerContactResponse])
def list_contacts(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contacts = db.query(CustomerContact).filter(CustomerContact.customer_id == customer_id).all()
    return [CustomerContactResponse.model_validate(c) for c in contacts]


@customers_router.post("/{customer_id}/contacts", response_model=CustomerContactResponse, status_code=201)
def create_contact(
    customer_id: int,
    data: CustomerContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    contact = CustomerContact(customer_id=customer_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return CustomerContactResponse.model_validate(contact)


@customers_router.put("/{customer_id}/contacts/{contact_id}", response_model=CustomerContactResponse)
def update_contact(
    customer_id: int,
    contact_id: int,
    data: CustomerContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    contact = db.query(CustomerContact).filter(
        CustomerContact.id == contact_id, CustomerContact.customer_id == customer_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return CustomerContactResponse.model_validate(contact)


@customers_router.delete("/{customer_id}/contacts/{contact_id}", status_code=204)
def delete_contact(
    customer_id: int,
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    contact = db.query(CustomerContact).filter(
        CustomerContact.id == contact_id, CustomerContact.customer_id == customer_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()


# ============================================================
# CONTACTS (STANDALONE)
# ============================================================
contacts_router = APIRouter(prefix="/contacts", tags=["Contacts"])


@contacts_router.get("")
def get_all_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CustomerContact).join(Customer, CustomerContact.customer_id == Customer.id)

    if customer_id:
        query = query.filter(CustomerContact.customer_id == customer_id)
    if search:
        query = query.filter(
            or_(
                CustomerContact.first_name.ilike(f"%{search}%"),
                CustomerContact.last_name.ilike(f"%{search}%"),
                CustomerContact.email.ilike(f"%{search}%"),
                CustomerContact.phone.ilike(f"%{search}%"),
                CustomerContact.designation.ilike(f"%{search}%"),
                CustomerContact.department.ilike(f"%{search}%"),
                Customer.name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    contacts = query.order_by(CustomerContact.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for c in contacts:
        data = CustomerContactResponse.model_validate(c)
        data.customer_name = c.customer.name if c.customer else None
        items.append(data)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@contacts_router.get("/{contact_id}", response_model=CustomerContactResponse)
def get_contact_detail(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = db.query(CustomerContact).filter(CustomerContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    data = CustomerContactResponse.model_validate(contact)
    data.customer_name = contact.customer.name if contact.customer else None
    return data


@contacts_router.post("", response_model=CustomerContactResponse, status_code=201)
def create_standalone_contact(
    data: CustomerContactStandaloneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Selected customer does not exist")
    
    contact = CustomerContact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    res = CustomerContactResponse.model_validate(contact)
    res.customer_name = customer.name
    return res


@contacts_router.put("/{contact_id}", response_model=CustomerContactResponse)
def update_standalone_contact(
    contact_id: int,
    data: CustomerContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    contact = db.query(CustomerContact).filter(CustomerContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if "customer_id" in update_data and update_data["customer_id"]:
        cust = db.query(Customer).filter(Customer.id == update_data["customer_id"]).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in update_data.items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    res = CustomerContactResponse.model_validate(contact)
    res.customer_name = contact.customer.name if contact.customer else None
    return res


@contacts_router.delete("/{contact_id}", status_code=204)
def delete_standalone_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    contact = db.query(CustomerContact).filter(CustomerContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()



# ============================================================
# LEADS
# ============================================================
leads_router = APIRouter(prefix="/leads", tags=["Leads"])


@leads_router.get("")
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Lead)

    if search:
        query = query.filter(
            or_(Lead.title.ilike(f"%{search}%"), Lead.company_name.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)
    if priority:
        query = query.filter(Lead.priority == priority)
    if assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)

    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [LeadResponse.model_validate(l) for l in leads],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@leads_router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse.model_validate(lead)


@leads_router.post("", response_model=LeadResponse, status_code=201)
def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING", "SALES_MANAGER", "SALES_REP")),
):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@leads_router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "MARKETING")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    update_data = data.model_dump(exclude_unset=True)
    if "assigned_to" in update_data and update_data["assigned_to"] is not None:
        update_data["assignment_date"] = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@leads_router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "MARKETING")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()


# ============================================================
# OPPORTUNITIES
# ============================================================
opportunities_router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


def _format_opportunity_response(o: Opportunity) -> OpportunityResponse:
    res = OpportunityResponse.model_validate(o)
    res.customer_name = o.customer.name if o.customer else None
    res.owner_name = o.owner.full_name if o.owner else None
    res.competitor_name = o.competitor.name if getattr(o, "competitor", None) else None
    return res


@opportunities_router.get("")
def list_opportunities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    stage: Optional[str] = None,
    status: Optional[str] = None,
    owner_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Opportunity)

    if search:
        query = query.filter(
            or_(
                Opportunity.name.ilike(f"%{search}%"),
                Opportunity.notes.ilike(f"%{search}%"),
            )
        )
    if stage:
        query = query.filter(Opportunity.stage == stage)
    if status:
        query = query.filter(Opportunity.status == status)
    if owner_id:
        query = query.filter(Opportunity.owner_id == owner_id)
    if customer_id:
        query = query.filter(Opportunity.customer_id == customer_id)

    total = query.count()
    opps = query.order_by(Opportunity.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [_format_opportunity_response(o) for o in opps],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@opportunities_router.get("/{opp_id}", response_model=OpportunityResponse)
def get_opportunity(
    opp_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return _format_opportunity_response(opp)


@opportunities_router.post("", response_model=OpportunityResponse, status_code=201)
def create_opportunity(
    data: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    opp_data = data.model_dump()
    if opp_data.get("owner_id") is None:
        opp_data["owner_id"] = current_user.id
    opp = Opportunity(**opp_data)
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return _format_opportunity_response(opp)


@opportunities_router.put("/{opp_id}", response_model=OpportunityResponse)
def update_opportunity(
    opp_id: int,
    data: OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    update_data = data.model_dump(exclude_unset=True)

    if "stage" in update_data:
        st = update_data["stage"]
        if st == "CLOSED_WON":
            opp.status = "WON"
            opp.actual_close_date = date.today()
            if "probability" not in update_data:
                opp.probability = 100
        elif st == "CLOSED_LOST":
            opp.status = "LOST"
            opp.actual_close_date = date.today()
            if "probability" not in update_data:
                opp.probability = 0
        elif st in ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION"]:
            opp.status = "OPEN"
            opp.actual_close_date = None

    for key, value in update_data.items():
        setattr(opp, key, value)
    db.commit()
    db.refresh(opp)
    return _format_opportunity_response(opp)


@opportunities_router.put("/{opp_id}/stage", response_model=OpportunityResponse)
def advance_opportunity_stage(
    opp_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    new_stage = data.get("stage")
    if not new_stage:
        raise HTTPException(status_code=400, detail="Stage is required")
    opp.stage = new_stage
    stage_probs = {
        "PROSPECTING": 10,
        "QUALIFICATION": 30,
        "PROPOSAL": 60,
        "NEGOTIATION": 80,
        "CLOSED_WON": 100,
        "CLOSED_LOST": 0,
    }
    if new_stage in stage_probs:
        opp.probability = stage_probs[new_stage]
    if new_stage == "CLOSED_WON":
        opp.status = "WON"
        opp.actual_close_date = date.today()
    elif new_stage == "CLOSED_LOST":
        opp.status = "LOST"
        opp.actual_close_date = date.today()
        if "loss_reason" in data:
            opp.loss_reason = data["loss_reason"]
    else:
        opp.status = "OPEN"
        opp.actual_close_date = None
    db.commit()
    db.refresh(opp)
    return _format_opportunity_response(opp)


@opportunities_router.delete("/{opp_id}", status_code=204)
def delete_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER")),
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.delete(opp)
    db.commit()


# ============================================================
# ACTIVITIES
# ============================================================
activities_router = APIRouter(prefix="/activities", tags=["Activities"])


def _format_activity_response(a: Activity) -> ActivityResponse:
    res = ActivityResponse.model_validate(a)
    res.customer_name = a.customer.name if a.customer else None
    res.contact_name = f"{a.contact.first_name} {a.contact.last_name}" if getattr(a, "contact", None) else None
    res.user_name = a.user.full_name if a.user else None
    return res


@activities_router.get("")
def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Activity)

    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    if status:
        query = query.filter(Activity.status == status)
    if user_id:
        query = query.filter(Activity.user_id == user_id)
    if customer_id:
        query = query.filter(Activity.customer_id == customer_id)
    if contact_id:
        query = query.filter(Activity.contact_id == contact_id)
    if search:
        query = query.filter(
            or_(
                Activity.title.ilike(f"%{search}%"),
                Activity.notes.ilike(f"%{search}%"),
                Activity.outcome.ilike(f"%{search}%"),
                Activity.location.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    activities = query.order_by(Activity.scheduled_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [_format_activity_response(a) for a in activities],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@activities_router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return _format_activity_response(activity)


@activities_router.post("", response_model=ActivityResponse, status_code=201)
def create_activity(
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    act_data = data.model_dump()
    if act_data.get("user_id") is None:
        act_data["user_id"] = current_user.id
    activity = Activity(**act_data)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _format_activity_response(activity)


@activities_router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("status") == "COMPLETED" and not activity.completed_date and not update_data.get("completed_date"):
        update_data["completed_date"] = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return _format_activity_response(activity)


@activities_router.put("/{activity_id}/complete", response_model=ActivityResponse)
def complete_activity(
    activity_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity.status = "COMPLETED"
    activity.completed_date = datetime.now(timezone.utc)
    if "outcome" in data and data["outcome"]:
        activity.outcome = data["outcome"]
    if "follow_up_date" in data and data["follow_up_date"]:
        activity.follow_up_date = data["follow_up_date"]
    db.commit()
    db.refresh(activity)
    return _format_activity_response(activity)


@activities_router.delete("/{activity_id}", status_code=204)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER", "ACCOUNT_MANAGER")),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()


# ============================================================
# SALES TARGETS
# ============================================================
targets_router = APIRouter(tags=["Sales Targets"])


@targets_router.get("")
def list_targets(
    user_id: Optional[int] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SalesTarget)
    if user_id:
        query = query.filter(SalesTarget.user_id == user_id)
    if period:
        query = query.filter(SalesTarget.period == period)
    targets = query.order_by(SalesTarget.start_date.desc()).all()
    return [SalesTargetResponse.model_validate(t) for t in targets]


@targets_router.post("", response_model=SalesTargetResponse, status_code=201)
def create_target(
    data: SalesTargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    target = SalesTarget(**data.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return SalesTargetResponse.model_validate(target)


@targets_router.put("/{target_id}", response_model=SalesTargetResponse)
def update_target(
    target_id: int,
    data: SalesTargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    target = db.query(SalesTarget).filter(SalesTarget.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(target, key, value)
    db.commit()
    db.refresh(target)
    return SalesTargetResponse.model_validate(target)


# ============================================================
# DISCOUNT REQUESTS
# ============================================================
discounts_router = APIRouter(tags=["Discount Requests"])


@discounts_router.get("")
def list_discount_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DiscountRequest)
    if status:
        query = query.filter(DiscountRequest.status == status)
    # Sales reps see only their own requests
    if current_user.role.name == "SALES_REP":
        query = query.filter(DiscountRequest.requester_id == current_user.id)
    return [DiscountRequestResponse.model_validate(d) for d in query.order_by(DiscountRequest.created_at.desc()).all()]


@discounts_router.post("", response_model=DiscountRequestResponse, status_code=201)
def create_discount_request(
    data: DiscountRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_REP", "SALES_MANAGER")),
):
    dr = DiscountRequest(requester_id=current_user.id, **data.model_dump())
    db.add(dr)
    db.commit()
    db.refresh(dr)
    return DiscountRequestResponse.model_validate(dr)


@discounts_router.put("/{request_id}/approve", response_model=DiscountRequestResponse)
def approve_discount(
    request_id: int,
    data: DiscountRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    dr = db.query(DiscountRequest).filter(DiscountRequest.id == request_id).first()
    if not dr:
        raise HTTPException(status_code=404, detail="Discount request not found")
    if dr.status != DiscountStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not in pending status")
    dr.status = DiscountStatus.APPROVED
    dr.approver_id = current_user.id
    dr.approved_at = datetime.now(timezone.utc)
    if data.manager_comments:
        dr.manager_comments = data.manager_comments
    db.commit()
    db.refresh(dr)
    return DiscountRequestResponse.model_validate(dr)


@discounts_router.put("/{request_id}/reject", response_model=DiscountRequestResponse)
def reject_discount(
    request_id: int,
    data: DiscountRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    dr = db.query(DiscountRequest).filter(DiscountRequest.id == request_id).first()
    if not dr:
        raise HTTPException(status_code=404, detail="Discount request not found")
    if dr.status != DiscountStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not in pending status")
    dr.status = DiscountStatus.REJECTED
    dr.approver_id = current_user.id
    dr.approved_at = datetime.now(timezone.utc)
    if data.manager_comments:
        dr.manager_comments = data.manager_comments
    db.commit()
    db.refresh(dr)
    return DiscountRequestResponse.model_validate(dr)


@discounts_router.put("/{request_id}/review", response_model=DiscountRequestResponse)
def review_discount(
    request_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    dr = db.query(DiscountRequest).filter(DiscountRequest.id == request_id).first()
    if not dr:
        raise HTTPException(status_code=404, detail="Discount request not found")
    new_status = data.get("status", "APPROVED")
    dr.status = DiscountStatus.APPROVED if new_status == "APPROVED" else DiscountStatus.REJECTED
    dr.approver_id = current_user.id
    dr.approved_at = datetime.now(timezone.utc)
    comments = data.get("reviewer_notes") or data.get("manager_comments")
    if comments:
        dr.manager_comments = comments
    db.commit()
    db.refresh(dr)
    return DiscountRequestResponse.model_validate(dr)


# ============================================================
# TERRITORIES
# ============================================================
territories_router = APIRouter(prefix="/territories", tags=["Territories"])


@territories_router.get("", response_model=list[TerritoryResponse])
def list_territories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [TerritoryResponse.model_validate(t) for t in db.query(Territory).all()]


@territories_router.get("/{territory_id}", response_model=TerritoryResponse)
def get_territory(
    territory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Territory not found")
    return TerritoryResponse.model_validate(t)


@territories_router.post("", response_model=TerritoryResponse, status_code=201)
def create_territory(
    data: TerritoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    t = Territory(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return TerritoryResponse.model_validate(t)


@territories_router.put("/{territory_id}", response_model=TerritoryResponse)
def update_territory(
    territory_id: int,
    data: TerritoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Territory not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return TerritoryResponse.model_validate(t)


@territories_router.post("/{territory_id}/assign-rep")
def assign_rep_to_territory(
    territory_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Territory not found")
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.territory_id = territory_id
    db.commit()
    return {"message": f"Assigned {u.full_name} to {t.name}"}


@territories_router.delete("/{territory_id}", status_code=204)
def delete_territory(
    territory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Territory not found")
    db.delete(t)
    db.commit()
