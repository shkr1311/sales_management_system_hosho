from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.auth import router as auth_router, users_router
from app.api.crm import (
    customers_router, contacts_router, leads_router, opportunities_router,
    activities_router, targets_router, discounts_router, territories_router,
)
from app.api.accounts import (
    accounts_router, plans_router, renewals_router, satisfaction_router,
)
from app.api.marketing import (
    campaigns_router, segments_router, content_router,
)
from app.api.products import (
    products_router, product_updates_router, feedback_router,
    features_router, docs_router, competitors_router,
)
from app.api.dashboard import dashboard_router, reports_router

app = FastAPI(
    title="Sales Management System API",
    description="Enterprise CRM and Sales Management REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api/v1
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(customers_router, prefix=API_PREFIX)
app.include_router(contacts_router, prefix=API_PREFIX)
app.include_router(leads_router, prefix=API_PREFIX)
app.include_router(opportunities_router, prefix=API_PREFIX)
app.include_router(activities_router, prefix=API_PREFIX)
app.include_router(targets_router, prefix=f"{API_PREFIX}/sales-targets")
app.include_router(targets_router, prefix=f"{API_PREFIX}/targets")
app.include_router(discounts_router, prefix=f"{API_PREFIX}/discount-requests")
app.include_router(discounts_router, prefix=f"{API_PREFIX}/discounts")
app.include_router(territories_router, prefix=API_PREFIX)
app.include_router(accounts_router, prefix=API_PREFIX)
app.include_router(plans_router, prefix=f"{API_PREFIX}/account-plans")
app.include_router(plans_router, prefix=f"{API_PREFIX}/plans")
app.include_router(renewals_router, prefix=API_PREFIX)
app.include_router(satisfaction_router, prefix=API_PREFIX)
app.include_router(campaigns_router, prefix=API_PREFIX)
app.include_router(segments_router, prefix=f"{API_PREFIX}/customer-segments")
app.include_router(segments_router, prefix=f"{API_PREFIX}/segments")
app.include_router(content_router, prefix=f"{API_PREFIX}/content-items")
app.include_router(content_router, prefix=f"{API_PREFIX}/content")
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(product_updates_router, prefix=API_PREFIX)
app.include_router(feedback_router, prefix=f"{API_PREFIX}/customer-feedback")
app.include_router(feedback_router, prefix=f"{API_PREFIX}/feedback")
app.include_router(features_router, prefix=f"{API_PREFIX}/feature-requests")
app.include_router(features_router, prefix=f"{API_PREFIX}/features")
app.include_router(docs_router, prefix=f"{API_PREFIX}/product-documents")
app.include_router(docs_router, prefix=f"{API_PREFIX}/docs")
app.include_router(competitors_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "title": "Sales Management System API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/api/docs",
        "health_check": "/api/health"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

