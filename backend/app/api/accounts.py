from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import math

from app.db.session import get_db
from app.models.user import User
from app.models.account import Account, AccountPlan, Renewal, SatisfactionRecord
from app.core.security import get_current_user, require_roles
from app.schemas.models import (
    AccountCreate, AccountUpdate, AccountResponse,
    AccountPlanCreate, AccountPlanUpdate, AccountPlanResponse,
    RenewalCreate, RenewalUpdate, RenewalResponse,
    SatisfactionCreate, SatisfactionUpdate, SatisfactionResponse,
)


# ============================================================
# ACCOUNTS
# ============================================================
accounts_router = APIRouter(prefix="/accounts", tags=["Accounts"])


@accounts_router.get("")
def list_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    account_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account)
    if account_type:
        query = query.filter(Account.account_type == account_type)
    if current_user.role.name == "ACCOUNT_MANAGER":
        query = query.filter(Account.manager_id == current_user.id)
    total = query.count()
    accounts = query.order_by(Account.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [AccountResponse.model_validate(a) for a in accounts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@accounts_router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountResponse.model_validate(account)


@accounts_router.post("", response_model=AccountResponse, status_code=201)
def create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER", "SALES_MANAGER")),
):
    acc_data = data.model_dump()
    if acc_data.get("manager_id") is None:
        acc_data["manager_id"] = current_user.id
    account = Account(**acc_data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return AccountResponse.model_validate(account)


@accounts_router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER", "SALES_MANAGER")),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return AccountResponse.model_validate(account)


# ============================================================
# ACCOUNT PLANS
# ============================================================
plans_router = APIRouter(tags=["Account Plans"])


@plans_router.get("")
def list_plans(
    account_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AccountPlan)
    if account_id:
        query = query.filter(AccountPlan.account_id == account_id)
    if status:
        query = query.filter(AccountPlan.status == status)
    return [AccountPlanResponse.model_validate(p) for p in query.all()]


@plans_router.post("", response_model=AccountPlanResponse, status_code=201)
def create_plan(
    data: AccountPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    plan = AccountPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return AccountPlanResponse.model_validate(plan)


@plans_router.put("/{plan_id}", response_model=AccountPlanResponse)
def update_plan(
    plan_id: int,
    data: AccountPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    plan = db.query(AccountPlan).filter(AccountPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Account plan not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return AccountPlanResponse.model_validate(plan)


@plans_router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    plan = db.query(AccountPlan).filter(AccountPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Account plan not found")
    db.delete(plan)
    db.commit()


# ============================================================
# RENEWALS
# ============================================================
renewals_router = APIRouter(prefix="/renewals", tags=["Renewals"])


@renewals_router.get("")
def list_renewals(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Renewal)
    if status:
        query = query.filter(Renewal.status == status)
    if customer_id:
        query = query.filter(Renewal.customer_id == customer_id)
    return [RenewalResponse.model_validate(r) for r in query.order_by(Renewal.renewal_date.asc()).all()]


@renewals_router.post("", response_model=RenewalResponse, status_code=201)
def create_renewal(
    data: RenewalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    renewal = Renewal(**data.model_dump())
    db.add(renewal)
    db.commit()
    db.refresh(renewal)
    return RenewalResponse.model_validate(renewal)


@renewals_router.put("/{renewal_id}", response_model=RenewalResponse)
def update_renewal(
    renewal_id: int,
    data: RenewalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    renewal = db.query(Renewal).filter(Renewal.id == renewal_id).first()
    if not renewal:
        raise HTTPException(status_code=404, detail="Renewal not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(renewal, key, value)
    db.commit()
    db.refresh(renewal)
    return RenewalResponse.model_validate(renewal)


# ============================================================
# SATISFACTION
# ============================================================
satisfaction_router = APIRouter(prefix="/satisfaction", tags=["Satisfaction"])


@satisfaction_router.get("")
def list_satisfaction(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SatisfactionRecord)
    if customer_id:
        query = query.filter(SatisfactionRecord.customer_id == customer_id)
    return [SatisfactionResponse.model_validate(s) for s in query.order_by(SatisfactionRecord.feedback_date.desc()).all()]


@satisfaction_router.post("", response_model=SatisfactionResponse, status_code=201)
def create_satisfaction(
    data: SatisfactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    sat_data = data.model_dump()
    if sat_data.get("recorded_by") is None:
        sat_data["recorded_by"] = current_user.id
    sat = SatisfactionRecord(**sat_data)
    db.add(sat)
    db.commit()
    db.refresh(sat)
    return SatisfactionResponse.model_validate(sat)


@satisfaction_router.put("/{record_id}", response_model=SatisfactionResponse)
def update_satisfaction(
    record_id: int,
    data: SatisfactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ACCOUNT_MANAGER")),
):
    sat = db.query(SatisfactionRecord).filter(SatisfactionRecord.id == record_id).first()
    if not sat:
        raise HTTPException(status_code=404, detail="Satisfaction record not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sat, key, value)
    db.commit()
    db.refresh(sat)
    return SatisfactionResponse.model_validate(sat)
