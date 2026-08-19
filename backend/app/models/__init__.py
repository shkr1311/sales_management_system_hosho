# Models package - import all models so Alembic can discover them
from app.models.user import Role, User, RoleName
from app.models.customer import Customer, CustomerContact, CustomerStatus
from app.models.lead import Lead, LeadStatus, LeadSource, LeadPriority
from app.models.opportunity import Opportunity, OpportunityStage, OpportunityStatus
from app.models.activity import Activity, ActivityType, ActivityStatus
from app.models.sales import Territory, SalesTarget, TargetPeriod, DiscountRequest, DiscountStatus
from app.models.account import Account, AccountPlan, AccountPlanStatus, Renewal, RenewalStatus, SatisfactionRecord
from app.models.marketing import Campaign, CampaignStatus, CustomerSegment, CustomerSegmentMember, ContentItem, ContentStatus
from app.models.product import (
    Product, ProductUpdate, RoadmapStatus,
    CustomerFeedback, FeedbackStatus,
    FeatureRequest, FeatureRequestPriority, FeatureRequestStatus,
    ProductDocument, DocStatus, Competitor
)

__all__ = [
    "Role", "User", "RoleName",
    "Customer", "CustomerContact", "CustomerStatus",
    "Lead", "LeadStatus", "LeadSource", "LeadPriority",
    "Opportunity", "OpportunityStage", "OpportunityStatus",
    "Activity", "ActivityType", "ActivityStatus",
    "Territory", "SalesTarget", "TargetPeriod", "DiscountRequest", "DiscountStatus",
    "Account", "AccountPlan", "AccountPlanStatus", "Renewal", "RenewalStatus", "SatisfactionRecord",
    "Campaign", "CampaignStatus", "CustomerSegment", "CustomerSegmentMember", "ContentItem", "ContentStatus",
    "Product", "ProductUpdate", "RoadmapStatus",
    "CustomerFeedback", "FeedbackStatus",
    "FeatureRequest", "FeatureRequestPriority", "FeatureRequestStatus",
    "ProductDocument", "DocStatus", "Competitor",
]
