from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import math

from app.db.session import get_db
from app.models.user import User
from app.models.product import (
    Product, ProductUpdate as ProductUpdateModel, CustomerFeedback,
    FeatureRequest, ProductDocument, Competitor
)
from app.core.security import get_current_user, require_roles
from app.schemas.models import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductUpdateCreate, ProductUpdateSchema, ProductUpdateResponse,
    CustomerFeedbackCreate, CustomerFeedbackUpdate, CustomerFeedbackResponse,
    FeatureRequestCreate, FeatureRequestUpdate, FeatureRequestResponse,
    ProductDocumentCreate, ProductDocumentUpdate, ProductDocumentResponse,
    CompetitorCreate, CompetitorUpdate, CompetitorResponse,
)

# ============================================================
# PRODUCTS
# ============================================================
products_router = APIRouter(prefix="/products", tags=["Products"])


@products_router.get("")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return [ProductResponse.model_validate(p) for p in query.all()]


@products_router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(p)


@products_router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@products_router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


# ============================================================
# PRODUCT UPDATES
# ============================================================
product_updates_router = APIRouter(prefix="/product-updates", tags=["Product Updates"])


@product_updates_router.get("")
def list_product_updates(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProductUpdateModel)
    if product_id:
        query = query.filter(ProductUpdateModel.product_id == product_id)
    return [ProductUpdateResponse.model_validate(u) for u in query.order_by(ProductUpdateModel.release_date.desc()).all()]


@product_updates_router.post("", response_model=ProductUpdateResponse, status_code=201)
def create_product_update(
    data: ProductUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    update = ProductUpdateModel(**data.model_dump())
    db.add(update)
    db.commit()
    db.refresh(update)
    return ProductUpdateResponse.model_validate(update)


@product_updates_router.put("/{update_id}", response_model=ProductUpdateResponse)
def update_product_update(
    update_id: int,
    data: ProductUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    update = db.query(ProductUpdateModel).filter(ProductUpdateModel.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Product update not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(update, key, value)
    db.commit()
    db.refresh(update)
    return ProductUpdateResponse.model_validate(update)


# ============================================================
# CUSTOMER FEEDBACK
# ============================================================
feedback_router = APIRouter(tags=["Customer Feedback"])


@feedback_router.get("")
def list_feedback(
    product_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CustomerFeedback)
    if product_id:
        query = query.filter(CustomerFeedback.product_id == product_id)
    if customer_id:
        query = query.filter(CustomerFeedback.customer_id == customer_id)
    if status:
        query = query.filter(CustomerFeedback.status == status)
    return [CustomerFeedbackResponse.model_validate(f) for f in query.order_by(CustomerFeedback.feedback_date.desc()).all()]


@feedback_router.post("", response_model=CustomerFeedbackResponse, status_code=201)
def create_feedback(
    data: CustomerFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER", "SALES_REP", "ACCOUNT_MANAGER")),
):
    fb_data = data.model_dump()
    if fb_data.get("recorded_by") is None:
        fb_data["recorded_by"] = current_user.id
    fb = CustomerFeedback(**fb_data)
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return CustomerFeedbackResponse.model_validate(fb)


@feedback_router.put("/{feedback_id}", response_model=CustomerFeedbackResponse)
def update_feedback(
    feedback_id: int,
    data: CustomerFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    fb = db.query(CustomerFeedback).filter(CustomerFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(fb, key, value)
    db.commit()
    db.refresh(fb)
    return CustomerFeedbackResponse.model_validate(fb)


# ============================================================
# FEATURE REQUESTS
# ============================================================
features_router = APIRouter(tags=["Feature Requests"])


@features_router.get("")
def list_feature_requests(
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FeatureRequest)
    if product_id:
        query = query.filter(FeatureRequest.product_id == product_id)
    if status:
        query = query.filter(FeatureRequest.status == status)
    if priority:
        query = query.filter(FeatureRequest.priority == priority)
    return [FeatureRequestResponse.model_validate(f) for f in query.order_by(FeatureRequest.requested_date.desc()).all()]


@features_router.post("", response_model=FeatureRequestResponse, status_code=201)
def create_feature_request(
    data: FeatureRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER", "SALES_REP")),
):
    fr = FeatureRequest(**data.model_dump())
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FeatureRequestResponse.model_validate(fr)


@features_router.put("/{request_id}", response_model=FeatureRequestResponse)
def update_feature_request(
    request_id: int,
    data: FeatureRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    fr = db.query(FeatureRequest).filter(FeatureRequest.id == request_id).first()
    if not fr:
        raise HTTPException(status_code=404, detail="Feature request not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(fr, key, value)
    db.commit()
    db.refresh(fr)
    return FeatureRequestResponse.model_validate(fr)


# ============================================================
# PRODUCT DOCUMENTS
# ============================================================
docs_router = APIRouter(tags=["Product Documents"])


@docs_router.get("")
def list_documents(
    product_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProductDocument)
    if product_id:
        query = query.filter(ProductDocument.product_id == product_id)
    if category:
        query = query.filter(ProductDocument.category == category)
    return [ProductDocumentResponse.model_validate(d) for d in query.all()]


@docs_router.post("", response_model=ProductDocumentResponse, status_code=201)
def create_document(
    data: ProductDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    doc = ProductDocument(**data.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return ProductDocumentResponse.model_validate(doc)


@docs_router.put("/{doc_id}", response_model=ProductDocumentResponse)
def update_document(
    doc_id: int,
    data: ProductDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    doc = db.query(ProductDocument).filter(ProductDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)
    db.commit()
    db.refresh(doc)
    return ProductDocumentResponse.model_validate(doc)


@docs_router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PRODUCT_MANAGER")),
):
    doc = db.query(ProductDocument).filter(ProductDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()


# ============================================================
# COMPETITORS
# ============================================================
competitors_router = APIRouter(prefix="/competitors", tags=["Competitors"])


@competitors_router.get("", response_model=list[CompetitorResponse])
def list_competitors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [CompetitorResponse.model_validate(c) for c in db.query(Competitor).all()]


@competitors_router.post("", response_model=CompetitorResponse, status_code=201)
def create_competitor(
    data: CompetitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    comp = Competitor(**data.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)


@competitors_router.put("/{competitor_id}", response_model=CompetitorResponse)
def update_competitor(
    competitor_id: int,
    data: CompetitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    comp = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(comp, key, value)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)
