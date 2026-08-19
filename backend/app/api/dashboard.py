"""
Dashboard and Reports API — All metrics computed from actual database data.
No hardcoded numbers.
"""
from datetime import date, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_

from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.lead import Lead, LeadStatus
from app.models.opportunity import Opportunity, OpportunityStage, OpportunityStatus
from app.models.activity import Activity, ActivityStatus
from app.models.sales import SalesTarget, DiscountRequest, DiscountStatus
from app.models.account import Account, Renewal, RenewalStatus, SatisfactionRecord
from app.models.marketing import Campaign
from app.models.product import CustomerFeedback, FeatureRequest, ProductUpdate, Competitor
from app.core.security import get_current_user, require_roles

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboards"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])


def _safe_float(val):
    if val is None:
        return 0.0
    return float(val)


# ============================================================
# SALES REP DASHBOARD
# ============================================================
@dashboard_router.get("/sales-rep")
def sales_rep_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    # Revenue from won deals
    revenue = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.owner_id == user_id,
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).scalar()

    # Current target
    today = date.today()
    target = db.query(SalesTarget).filter(
        SalesTarget.user_id == user_id,
        SalesTarget.start_date <= today,
        SalesTarget.end_date >= today,
    ).first()

    target_amount = float(target.target_amount) if target else 0
    achievement = (float(revenue) / target_amount * 100) if target_amount > 0 else 0

    # Open opportunities
    open_opps = db.query(func.count(Opportunity.id)).filter(
        Opportunity.owner_id == user_id,
        Opportunity.status == OpportunityStatus.OPEN,
    ).scalar()

    # Pipeline value
    pipeline = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.owner_id == user_id,
        Opportunity.status == OpportunityStatus.OPEN,
    ).scalar()

    # Upcoming activities (next 7 days)
    from datetime import timedelta
    week_later = datetime.now(timezone.utc) + timedelta(days=7)
    upcoming = db.query(func.count(Activity.id)).filter(
        Activity.user_id == user_id,
        Activity.status == ActivityStatus.PLANNED,
        Activity.scheduled_date <= week_later,
    ).scalar()

    # Won/Lost counts for win rate
    won = db.query(func.count(Opportunity.id)).filter(
        Opportunity.owner_id == user_id,
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).scalar()
    lost = db.query(func.count(Opportunity.id)).filter(
        Opportunity.owner_id == user_id,
        Opportunity.stage == OpportunityStage.CLOSED_LOST,
    ).scalar()
    win_rate = (won / (won + lost) * 100) if (won + lost) > 0 else 0

    return {
        "revenue": _safe_float(revenue),
        "target": target_amount,
        "achievement_pct": round(achievement, 1),
        "open_opportunities": open_opps or 0,
        "pipeline_value": _safe_float(pipeline),
        "upcoming_activities": upcoming or 0,
        "won_deals": won or 0,
        "lost_deals": lost or 0,
        "win_rate": round(win_rate, 1),
    }


# ============================================================
# SALES MANAGER DASHBOARD
# ============================================================
@dashboard_router.get("/manager")
def manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    # Team revenue (all reps)
    team_revenue = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).scalar()

    # Team target (sum of all current targets)
    today = date.today()
    team_target = db.query(func.coalesce(func.sum(SalesTarget.target_amount), 0)).filter(
        SalesTarget.start_date <= today,
        SalesTarget.end_date >= today,
    ).scalar()

    team_target_f = _safe_float(team_target)
    achievement = (_safe_float(team_revenue) / team_target_f * 100) if team_target_f > 0 else 0

    # Pipeline
    pipeline = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.status == OpportunityStatus.OPEN,
    ).scalar()

    # Win rate
    total_won = db.query(func.count(Opportunity.id)).filter(Opportunity.stage == OpportunityStage.CLOSED_WON).scalar()
    total_lost = db.query(func.count(Opportunity.id)).filter(Opportunity.stage == OpportunityStage.CLOSED_LOST).scalar()
    win_rate = (total_won / (total_won + total_lost) * 100) if (total_won + total_lost) > 0 else 0

    # Pending discount requests
    pending_discounts = db.query(func.count(DiscountRequest.id)).filter(
        DiscountRequest.status == DiscountStatus.PENDING,
    ).scalar()

    # Rep performance (top performers)
    rep_performance = db.query(
        User.id,
        User.full_name,
        func.coalesce(func.sum(Opportunity.deal_value), 0).label("revenue"),
        func.count(Opportunity.id).label("deals"),
    ).join(Opportunity, Opportunity.owner_id == User.id).filter(
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).group_by(User.id, User.full_name).order_by(func.sum(Opportunity.deal_value).desc()).limit(10).all()

    return {
        "team_revenue": _safe_float(team_revenue),
        "team_target": team_target_f,
        "achievement_pct": round(achievement, 1),
        "pipeline_value": _safe_float(pipeline),
        "win_rate": round(win_rate, 1),
        "pending_discounts": pending_discounts or 0,
        "total_won": total_won or 0,
        "total_lost": total_lost or 0,
        "rep_performance": [
            {"id": r.id, "name": r.full_name, "revenue": float(r.revenue), "deals": r.deals}
            for r in rep_performance
        ],
    }


# ============================================================
# ACCOUNT MANAGER DASHBOARD
# ============================================================
@dashboard_router.get("/account")
def account_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    managed_accounts = db.query(func.count(Account.id)).filter(
        Account.manager_id == user_id
    ).scalar()

    # Upcoming renewals (next 30 days)
    from datetime import timedelta
    thirty_days = date.today() + timedelta(days=30)
    upcoming_renewals = db.query(func.count(Renewal.id)).filter(
        Renewal.renewal_date <= thirty_days,
        Renewal.renewal_date >= date.today(),
        Renewal.status.in_(["UPCOMING", "IN_PROGRESS"]),
    ).scalar()

    overdue_renewals = db.query(func.count(Renewal.id)).filter(
        Renewal.renewal_date < date.today(),
        Renewal.status == "OVERDUE",
    ).scalar()

    # Average satisfaction
    avg_sat = db.query(func.avg(SatisfactionRecord.score)).scalar()

    # Low satisfaction customers (score < 5)
    low_sat = db.query(func.count(SatisfactionRecord.id)).filter(
        SatisfactionRecord.score < 5
    ).scalar()

    return {
        "managed_accounts": managed_accounts or 0,
        "upcoming_renewals": upcoming_renewals or 0,
        "overdue_renewals": overdue_renewals or 0,
        "avg_satisfaction": round(_safe_float(avg_sat), 1),
        "low_satisfaction_count": low_sat or 0,
    }


# ============================================================
# MARKETING DASHBOARD
# ============================================================
@dashboard_router.get("/marketing")
def marketing_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_campaigns = db.query(func.count(Campaign.id)).scalar()
    active_campaigns = db.query(func.count(Campaign.id)).filter(Campaign.status == "ACTIVE").scalar()

    total_leads = db.query(func.count(Lead.id)).scalar()
    qualified_leads = db.query(func.count(Lead.id)).filter(Lead.status == LeadStatus.QUALIFIED).scalar()
    converted_leads = db.query(func.count(Lead.id)).filter(Lead.status == LeadStatus.CONVERTED).scalar()

    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

    # Campaign cost vs revenue
    total_cost = db.query(func.coalesce(func.sum(Campaign.actual_cost), 0)).scalar()

    # Revenue from converted leads' opportunities
    revenue_influenced = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).join(
        Lead, Lead.id == Opportunity.lead_id
    ).filter(
        Lead.campaign_id.isnot(None),
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).scalar()

    roi = ((_safe_float(revenue_influenced) - _safe_float(total_cost)) / _safe_float(total_cost) * 100) if _safe_float(total_cost) > 0 else 0

    return {
        "total_campaigns": total_campaigns or 0,
        "active_campaigns": active_campaigns or 0,
        "total_leads": total_leads or 0,
        "qualified_leads": qualified_leads or 0,
        "converted_leads": converted_leads or 0,
        "conversion_rate": round(conversion_rate, 1),
        "total_cost": _safe_float(total_cost),
        "revenue_influenced": _safe_float(revenue_influenced),
        "roi": round(roi, 1),
    }


# ============================================================
# PRODUCT MANAGER DASHBOARD
# ============================================================
@dashboard_router.get("/product")
def product_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_feedback = db.query(func.count(CustomerFeedback.id)).scalar()
    new_feedback = db.query(func.count(CustomerFeedback.id)).filter(CustomerFeedback.status == "NEW").scalar()
    total_features = db.query(func.count(FeatureRequest.id)).scalar()
    pending_features = db.query(func.count(FeatureRequest.id)).filter(
        FeatureRequest.status.in_(["SUBMITTED", "UNDER_REVIEW"])
    ).scalar()

    avg_rating = db.query(func.avg(CustomerFeedback.rating)).filter(
        CustomerFeedback.rating.isnot(None)
    ).scalar()

    upcoming_releases = db.query(func.count(ProductUpdate.id)).filter(
        ProductUpdate.roadmap_status.in_(["PLANNED", "IN_DEVELOPMENT", "BETA"])
    ).scalar()

    return {
        "total_feedback": total_feedback or 0,
        "new_feedback": new_feedback or 0,
        "total_feature_requests": total_features or 0,
        "pending_features": pending_features or 0,
        "avg_product_rating": round(_safe_float(avg_rating), 1),
        "upcoming_releases": upcoming_releases or 0,
    }


# ============================================================
# EXECUTIVE DASHBOARD
# ============================================================
@dashboard_router.get("/executive")
def executive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("EXECUTIVE", "SALES_MANAGER")),
):
    # Total revenue
    total_revenue = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).scalar()

    # Total deals
    total_deals = db.query(func.count(Opportunity.id)).scalar()
    won_deals = db.query(func.count(Opportunity.id)).filter(Opportunity.stage == OpportunityStage.CLOSED_WON).scalar()
    lost_deals = db.query(func.count(Opportunity.id)).filter(Opportunity.stage == OpportunityStage.CLOSED_LOST).scalar()

    win_rate = (won_deals / (won_deals + lost_deals) * 100) if (won_deals + lost_deals) > 0 else 0
    avg_deal = (_safe_float(total_revenue) / won_deals) if won_deals > 0 else 0

    # Pipeline
    pipeline = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.status == OpportunityStatus.OPEN,
    ).scalar()

    # Weighted pipeline (deal_value * probability / 100)
    weighted = db.query(
        func.coalesce(func.sum(Opportunity.deal_value * Opportunity.probability / 100), 0)
    ).filter(Opportunity.status == OpportunityStatus.OPEN).scalar()

    # Target achievement
    today = date.today()
    total_target = db.query(func.coalesce(func.sum(SalesTarget.target_amount), 0)).filter(
        SalesTarget.start_date <= today,
        SalesTarget.end_date >= today,
    ).scalar()
    target_achievement = (_safe_float(total_revenue) / _safe_float(total_target) * 100) if _safe_float(total_target) > 0 else 0

    # Revenue by region
    region_data = db.query(
        Customer.region,
        func.coalesce(func.sum(Opportunity.deal_value), 0).label("revenue"),
        func.count(Opportunity.id).label("deals"),
    ).join(Customer, Customer.id == Opportunity.customer_id).filter(
        Opportunity.stage == OpportunityStage.CLOSED_WON,
    ).group_by(Customer.region).all()

    # Pipeline by stage
    stage_data = db.query(
        Opportunity.stage,
        func.count(Opportunity.id).label("count"),
        func.coalesce(func.sum(Opportunity.deal_value), 0).label("value"),
    ).filter(Opportunity.status == OpportunityStatus.OPEN).group_by(Opportunity.stage).all()

    # Competitive data
    competitive = db.query(
        Competitor.name,
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_WON, 1), else_=0)).label("wins"),
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_LOST, 1), else_=0)).label("losses"),
    ).join(Opportunity, Opportunity.competitor_id == Competitor.id).group_by(Competitor.name).all()

    return {
        "total_revenue": _safe_float(total_revenue),
        "total_deals": total_deals or 0,
        "won_deals": won_deals or 0,
        "lost_deals": lost_deals or 0,
        "win_rate": round(win_rate, 1),
        "avg_deal_size": round(avg_deal, 2),
        "pipeline_value": _safe_float(pipeline),
        "weighted_pipeline": _safe_float(weighted),
        "target_achievement": round(target_achievement, 1),
        "revenue_by_region": [
            {"region": r.region or "Unassigned", "revenue": float(r.revenue), "deals": r.deals}
            for r in region_data
        ],
        "pipeline_by_stage": [
            {"stage": s.stage.value if hasattr(s.stage, 'value') else s.stage, "count": s.count, "value": float(s.value)}
            for s in stage_data
        ],
        "competitive_data": [
            {"competitor": c.name, "wins": int(c.wins), "losses": int(c.losses)}
            for c in competitive
        ],
    }


# ============================================================
# REPORTS
# ============================================================
@reports_router.get("/pipeline")
def pipeline_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    stages = db.query(
        Opportunity.stage,
        func.count(Opportunity.id).label("count"),
        func.coalesce(func.sum(Opportunity.deal_value), 0).label("value"),
        func.coalesce(func.avg(Opportunity.probability), 0).label("avg_probability"),
    ).filter(Opportunity.status == OpportunityStatus.OPEN).group_by(Opportunity.stage).all()

    total_pipeline = db.query(func.coalesce(func.sum(Opportunity.deal_value), 0)).filter(
        Opportunity.status == OpportunityStatus.OPEN
    ).scalar()

    return {
        "stages": [
            {
                "stage": s.stage.value if hasattr(s.stage, 'value') else s.stage,
                "count": s.count,
                "value": float(s.value),
                "avg_probability": round(float(s.avg_probability), 1),
            }
            for s in stages
        ],
        "total_pipeline": _safe_float(total_pipeline),
    }


@reports_router.get("/forecast")
def forecast_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    """Revenue forecast using probability-weighted pipeline values."""
    open_opps = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.OPEN).all()

    monthly_forecast = {}
    for opp in open_opps:
        if opp.expected_close_date:
            key = opp.expected_close_date.strftime("%Y-%m")
        else:
            key = "Unscheduled"
        weighted_value = float(opp.deal_value) * opp.probability / 100
        if key not in monthly_forecast:
            monthly_forecast[key] = {"month": key, "expected_revenue": 0, "deal_count": 0, "total_value": 0}
        monthly_forecast[key]["expected_revenue"] += weighted_value
        monthly_forecast[key]["deal_count"] += 1
        monthly_forecast[key]["total_value"] += float(opp.deal_value)

    forecast_list = sorted(monthly_forecast.values(), key=lambda x: x["month"])
    total_expected = sum(f["expected_revenue"] for f in forecast_list)

    return {
        "monthly_forecast": forecast_list,
        "total_expected_revenue": round(total_expected, 2),
    }


@reports_router.get("/regional")
def regional_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    regions = db.query(
        Customer.region,
        func.count(func.distinct(Customer.id)).label("customers"),
        func.coalesce(func.sum(
            case((Opportunity.stage == OpportunityStage.CLOSED_WON, Opportunity.deal_value), else_=0)
        ), 0).label("revenue"),
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_WON, 1), else_=0)).label("won"),
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_LOST, 1), else_=0)).label("lost"),
        func.coalesce(func.sum(
            case((Opportunity.status == OpportunityStatus.OPEN, Opportunity.deal_value), else_=0)
        ), 0).label("pipeline"),
    ).outerjoin(Opportunity, Opportunity.customer_id == Customer.id).group_by(Customer.region).all()

    return {
        "regions": [
            {
                "region": r.region or "Unassigned",
                "customers": r.customers,
                "revenue": float(r.revenue),
                "won": int(r.won or 0),
                "lost": int(r.lost or 0),
                "win_rate": round(int(r.won or 0) / (int(r.won or 0) + int(r.lost or 0)) * 100, 1) if (int(r.won or 0) + int(r.lost or 0)) > 0 else 0,
                "pipeline": float(r.pipeline),
            }
            for r in regions
        ]
    }


@reports_router.get("/competitive")
def competitive_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SALES_MANAGER", "EXECUTIVE")),
):
    competitors = db.query(
        Competitor.id,
        Competitor.name,
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_WON, 1), else_=0)).label("wins"),
        func.sum(case((Opportunity.stage == OpportunityStage.CLOSED_LOST, 1), else_=0)).label("losses"),
        func.coalesce(func.sum(
            case((Opportunity.stage == OpportunityStage.CLOSED_WON, Opportunity.deal_value), else_=0)
        ), 0).label("won_revenue"),
        func.coalesce(func.sum(
            case((Opportunity.stage == OpportunityStage.CLOSED_LOST, Opportunity.deal_value), else_=0)
        ), 0).label("lost_revenue"),
    ).outerjoin(Opportunity, Opportunity.competitor_id == Competitor.id).group_by(
        Competitor.id, Competitor.name
    ).all()

    return {
        "competitors": [
            {
                "id": c.id,
                "name": c.name,
                "wins": int(c.wins or 0),
                "losses": int(c.losses or 0),
                "win_rate": round(int(c.wins or 0) / (int(c.wins or 0) + int(c.losses or 0)) * 100, 1) if (int(c.wins or 0) + int(c.losses or 0)) > 0 else 0,
                "won_revenue": float(c.won_revenue),
                "lost_revenue": float(c.lost_revenue),
            }
            for c in competitors
        ]
    }
