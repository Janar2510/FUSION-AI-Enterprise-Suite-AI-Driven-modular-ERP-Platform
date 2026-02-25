from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.contact_tracker import ContactTracker, ActivityType
from .models import CRMContact, CRMCompany, CRMDeal, CRMPipeline, CRMStage
from .schemas import ContactCreate, ContactUpdate, DealCreate, DealUpdate
from .services import CRMService

router = APIRouter(prefix="/api/v1/crm", tags=["crm"])

@router.get("/contacts")
async def get_contacts(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    lead_status: Optional[str] = None,
    tag: Optional[str] = None,
    min_score: Optional[int] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get paginated list of contacts with smart filtering"""
    service = CRMService(db)
    
    filters = {
        'search': search,
        'lead_status': lead_status,
        'tag': tag,
        'min_score': min_score
    }
    
    contacts = await service.get_contacts(
        page=page,
        limit=limit,
        filters=filters,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "status": "success",
        "data": contacts
    }

@router.post("/contacts")
async def create_contact(
    contact_data: ContactCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new contact with AI enrichment"""
    service = CRMService(db)
    
    # Create contact
    contact = await service.create_contact(contact_data.dict())
    
    # Track contact creation
    tracker = ContactTracker(db)
    await tracker.track_activity(
        contact_id=contact.id,
        activity_type=ActivityType.CONTACT_CREATED,
        module="crm",
        entity_type="contact",
        entity_id=contact.id,
        metadata={'email': contact.email, 'source': contact.source}
    )
    
    # Background enrichment
    background_tasks.add_task(
        service.enrich_contact,
        contact.email
    )
    
    # Initial lead scoring
    background_tasks.add_task(
        service.score_lead,
        contact.id
    )
    
    return {
        "status": "success",
        "data": {
            "contact": contact,
            "enrichment_status": "processing",
            "message": "Contact created. AI enrichment in progress."
        }
    }

@router.get("/contacts/{contact_id}")
async def get_contact_detail(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Get complete contact profile with 360° view"""
    service = CRMService(db)
    tracker = ContactTracker(db)
    
    # Get contact data
    contact = await service.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get cross-module insights
    insights = tracker.get_cross_module_insights(contact_id)
    
    # Get AI recommendations
    lead_score = await service.score_lead(contact_id)
    next_action = await service.suggest_next_action(contact_id)
    
    # Get timeline across all modules
    timeline = tracker.get_contact_timeline(contact_id)
    
    return {
        "status": "success",
        "data": {
            "contact": contact,
            "insights": insights,
            "lead_scoring": lead_score,
            "next_best_action": next_action,
            "timeline": timeline,
            "related_deals": await service.get_contact_deals(contact_id),
            "related_companies": await service.get_contact_companies(contact_id)
        }
    }

@router.post("/contacts/{contact_id}/enrich")
async def enrich_contact(
    contact_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger contact enrichment"""
    service = CRMService(db)
    
    contact = await service.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Start enrichment
    enriched_data = await service.enrich_contact(contact.email)
    
    # Update contact with enriched data
    await service.update_contact(contact_id, enriched_data)
    
    return {
        "status": "success",
        "enriched_fields": list(enriched_data.keys()),
        "contact_id": contact_id
    }

@router.post("/contacts/{contact_id}/score")
async def score_lead(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Get AI-powered lead score with explanation"""
    service = CRMService(db)
    
    score_data = await service.score_lead(contact_id)
    
    # Track scoring event
    tracker = ContactTracker(db)
    await tracker.track_activity(
        contact_id=contact_id,
        activity_type=ActivityType.LEAD_SCORED,
        module="crm",
        entity_type="lead_score",
        entity_id=contact_id,
        metadata={'score': score_data['lead_score']}
    )
    
    return {
        "status": "success",
        "data": score_data
    }

@router.post("/contacts/{contact_id}/email")
async def generate_email(
    contact_id: int,
    purpose: str = Query(..., description="follow_up, introduction, proposal, etc."),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Generate personalized email with AI"""
    service = CRMService(db)
    
    # Generate email
    email_data = await service.generate_personalized_email(contact_id, purpose)
    
    return {
        "status": "success",
        "data": {
            "email": email_data['primary_version'],
            "ab_variations": email_data['ab_test_variations'],
            "optimal_send_time": email_data['optimal_send_time'],
            "predicted_open_rate": email_data['predicted_open_rate']
        }
    }

@router.get("/companies")
async def get_companies(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    industry: Optional[str] = None,
    min_revenue: Optional[float] = None,
    account_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get companies with health scores"""
    service = CRMService(db)
    
    companies = await service.get_companies(
        page=page,
        limit=limit,
        filters={
            'search': search,
            'industry': industry,
            'min_revenue': min_revenue,
            'account_status': account_status
        }
    )
    
    # Add health monitoring
    for company in companies['items']:
        if company['account_status'] == 'customer':
            churn_risk = await service.monitor_churn_risk(company['id'])
            company['health_score'] = 100 - (churn_risk['churn_probability'] * 100)
            company['risk_level'] = churn_risk['risk_level']
    
    return {
        "status": "success",
        "data": companies
    }

@router.post("/companies/{company_id}/opportunities")
async def identify_opportunities(
    company_id: int,
    db: Session = Depends(get_db)
):
    """Identify upsell/cross-sell opportunities"""
    service = CRMService(db)
    
    opportunities = await service.identify_upsell_opportunities(company_id)
    
    # Track opportunity identification
    tracker = ContactTracker(db)
    await tracker.track_activity(
        company_id=company_id,
        activity_type=ActivityType.OPPORTUNITY_IDENTIFIED,
        module="crm",
        entity_type="opportunity",
        entity_id=company_id,
        metadata={'opportunities_count': len(opportunities)}
    )
    
    return {
        "status": "success",
        "data": {
            "company_id": company_id,
            "opportunities": opportunities,
            "total_potential_value": sum(opp['estimated_value'] for opp in opportunities),
            "recommended_action": opportunities[0] if opportunities else None
        }
    }

@router.get("/deals")
async def get_deals(
    pipeline_id: Optional[int] = None,
    stage_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get deals with AI predictions"""
    service = CRMService(db)
    
    deals = await service.get_deals(
        filters={
            'pipeline_id': pipeline_id,
            'stage_id': stage_id,
            'owner_id': owner_id,
            'status': status,
            'min_amount': min_amount
        }
    )
    
    # Add AI predictions
    for deal in deals['items']:
        prediction = await service.predict_deal_outcome(deal['id'])
        deal['win_probability'] = prediction['win_probability']
        deal['health_score'] = prediction['health_score']
        deal['top_risk'] = prediction['risks'][0] if prediction['risks'] else None
    
    return {
        "status": "success",
        "data": deals
    }

@router.post("/deals")
async def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db)
):
    """Create new deal"""
    service = CRMService(db)
    new_deal = await service.create_deal(deal.dict())
    
    # Track deal creation
    tracker = ContactTracker(db)
    await tracker.track_activity(
        contact_id=new_deal.contact_id,
        activity_type=ActivityType.DEAL_CREATED,
        module="crm",
        entity_type="deal",
        entity_id=new_deal.id,
        metadata={'deal_name': new_deal.name, 'amount': new_deal.amount}
    )
    
    # AI: Calculate initial probability
    probability = await service.calculate_win_probability(new_deal.id)
    await service.update_deal(new_deal.id, {"probability": probability})
    
    return {
        "status": "success",
        "data": new_deal
    }

@router.get("/deals/{deal_id}")
async def get_deal_detail(
    deal_id: int,
    db: Session = Depends(get_db)
):
    """Get complete deal information with all related data"""
    service = CRMService(db)
    
    # Get deal with all relationships
    deal = await service.get_deal_complete(deal_id)
    
    # Get cross-module data
    cross_module_data = await service.get_cross_module_data(deal_id)
    
    return {
        "status": "success",
        "data": {
            "deal": deal,
            "activities": deal.activities if hasattr(deal, 'activities') else [],
            "documents": deal.documents if hasattr(deal, 'documents') else [],
            "invoices": cross_module_data.get("invoices", []),
            "quotes": cross_module_data.get("quotes", []),
            "orders": cross_module_data.get("orders", []),
            "emails": cross_module_data.get("emails", []),
            "meetings": cross_module_data.get("meetings", []),
            "timeline": await service.get_deal_timeline(deal_id)
        }
    }

@router.post("/deals/{deal_id}/analyze")
async def analyze_deal(
    deal_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive deal analysis"""
    service = CRMService(db)
    
    analysis = await service.predict_deal_outcome(deal_id)
    
    return {
        "status": "success",
        "data": analysis
    }

@router.get("/pipelines")
async def get_pipelines(db: Session = Depends(get_db)):
    """Get all pipelines with stages"""
    service = CRMService(db)
    pipelines = await service.get_all_pipelines()
    return {
        "status": "success",
        "data": pipelines
    }

@router.get("/pipelines/{pipeline_id}/deals")
async def get_pipeline_deals(
    pipeline_id: int,
    db: Session = Depends(get_db)
):
    """Get all deals in a pipeline organized by stages"""
    service = CRMService(db)
    deals = await service.get_pipeline_deals(pipeline_id)
    return {
        "status": "success",
        "data": deals
    }

@router.put("/pipelines/deals/{deal_id}/move")
async def move_deal(
    deal_id: int,
    stage_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Move deal to different stage (drag & drop)"""
    service = CRMService(db)
    
    # Move deal and track activity
    deal = await service.move_deal_to_stage(
        deal_id=deal_id,
        new_stage_id=stage_id,
        user_id=user_id
    )
    
    # Track stage movement
    tracker = ContactTracker(db)
    await tracker.track_activity(
        contact_id=deal.contact_id,
        activity_type=ActivityType.DEAL_UPDATED,
        module="crm",
        entity_type="deal",
        entity_id=deal_id,
        metadata={'new_stage': deal.stage.name, 'stage_probability': deal.stage.probability}
    )
    
    return {
        "status": "success",
        "data": deal
    }

@router.get("/dashboard")
async def get_crm_dashboard(db: Session = Depends(get_db)):
    """Get CRM dashboard with real-time insights"""
    from ....core.global_metrics import GlobalMetricsService
    
    # Use global metrics service instead of just CRM metrics
    global_metrics_service = GlobalMetricsService(db)
    metrics = global_metrics_service.get_module_metrics("crm")
    
    # Get AI insights
    service = CRMService(db)
    insights = await service.generate_executive_insights()
    
    return {
        "status": "success",
        "data": {
            "metrics": metrics,
            "insights": insights,
            "alerts": await service.get_critical_alerts(),
            "trends": await service.get_trend_analysis()
        }
    }