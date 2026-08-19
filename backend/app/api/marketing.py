from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import math

from app.db.session import get_db
from app.models.user import User
from app.models.marketing import Campaign, CustomerSegment, CustomerSegmentMember, ContentItem
from app.core.security import get_current_user, require_roles
from app.schemas.models import (
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CustomerSegmentCreate, CustomerSegmentUpdate, CustomerSegmentResponse,
    ContentItemCreate, ContentItemUpdate, ContentItemResponse,
)

# ============================================================
# CAMPAIGNS
# ============================================================
campaigns_router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@campaigns_router.get("")
def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Campaign)
    if status:
        query = query.filter(Campaign.status == status)
    total = query.count()
    campaigns = query.order_by(Campaign.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [CampaignResponse.model_validate(c) for c in campaigns],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@campaigns_router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse.model_validate(c)


@campaigns_router.post("", response_model=CampaignResponse, status_code=201)
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    c_data = data.model_dump()
    if c_data.get("owner_id") is None:
        c_data["owner_id"] = current_user.id
    campaign = Campaign(**c_data)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)


@campaigns_router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)


@campaigns_router.delete("/{campaign_id}", status_code=204)
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(campaign)
    db.commit()


# ============================================================
# CUSTOMER SEGMENTS
# ============================================================
segments_router = APIRouter(tags=["Customer Segments"])


@segments_router.get("", response_model=list[CustomerSegmentResponse])
def list_segments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [CustomerSegmentResponse.model_validate(s) for s in db.query(CustomerSegment).all()]


@segments_router.post("", response_model=CustomerSegmentResponse, status_code=201)
def create_segment(
    data: CustomerSegmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    segment = CustomerSegment(**data.model_dump())
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return CustomerSegmentResponse.model_validate(segment)


@segments_router.put("/{segment_id}", response_model=CustomerSegmentResponse)
def update_segment(
    segment_id: int,
    data: CustomerSegmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    segment = db.query(CustomerSegment).filter(CustomerSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(segment, key, value)
    db.commit()
    db.refresh(segment)
    return CustomerSegmentResponse.model_validate(segment)


@segments_router.delete("/{segment_id}", status_code=204)
def delete_segment(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    segment = db.query(CustomerSegment).filter(CustomerSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(segment)
    db.commit()


# ============================================================
# CONTENT ITEMS
# ============================================================
content_router = APIRouter(tags=["Content Items"])


@content_router.get("")
def list_content(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ContentItem)
    if status:
        query = query.filter(ContentItem.status == status)
    return [ContentItemResponse.model_validate(c) for c in query.order_by(ContentItem.created_at.desc()).all()]


@content_router.post("", response_model=ContentItemResponse, status_code=201)
def create_content(
    data: ContentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    c_data = data.model_dump()
    if c_data.get("owner_id") is None:
        c_data["owner_id"] = current_user.id
    content = ContentItem(**c_data)
    db.add(content)
    db.commit()
    db.refresh(content)
    return ContentItemResponse.model_validate(content)


@content_router.put("/{item_id}", response_model=ContentItemResponse)
def update_content(
    item_id: int,
    data: ContentItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    content = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content item not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(content, key, value)
    db.commit()
    db.refresh(content)
    return ContentItemResponse.model_validate(content)


@content_router.delete("/{item_id}", status_code=204)
def delete_content(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MARKETING")),
):
    content = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content item not found")
    db.delete(content)
    db.commit()
