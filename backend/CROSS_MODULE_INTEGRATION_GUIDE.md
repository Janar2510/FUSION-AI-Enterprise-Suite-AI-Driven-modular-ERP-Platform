# Cross-Module Integration Guide

This guide explains how to integrate contact tracking and CRM features across all modules in the FusionAI Enterprise Suite.

## Overview

The cross-module integration system provides:
- **Universal Contact Tracking**: Track all contact activities across modules
- **Cross-Module Data Enrichment**: Enhance data with insights from other modules
- **AI-Powered Insights**: Get intelligent recommendations and predictions
- **Automated Workflows**: Trigger actions based on contact activities
- **360-Degree Contact View**: See complete contact history and interactions

## Architecture

### Core Components

1. **ContactTracker** (`src/core/contact_tracker.py`)
   - Tracks all contact activities
   - Manages contact engagement metrics
   - Triggers automated workflows

2. **CrossModuleIntegration** (`src/core/cross_module_integration.py`)
   - Main integration orchestrator
   - Provides 360-degree contact views
   - Manages cross-module analytics

3. **Module-Specific Integrations**
   - Each module has its own integration layer
   - Example: `src/modules/sales/contact_integration.py`

## Quick Start

### 1. Track Activities

```python
from src.core.cross_module_integration import cross_module, ActivityType, ModuleType

# Track a quote creation
cross_module.track_activity(
    contact_id=123,
    activity_type=ActivityType.QUOTE_CREATED,
    module=ModuleType.SALES,
    details={"quote_id": 456, "amount": 5000.00}
)
```

### 2. Get Contact 360 View

```python
# Get complete contact information across all modules
contact_view = cross_module.get_contact_360_view(123)
print(contact_view['ai_insights']['recommended_actions'])
```

### 3. Use Decorators for Automatic Tracking

```python
from src.modules.sales.contact_integration import ContactIntegration

@ContactIntegration.track_sales_activity("QUOTE_CREATED")
async def create_quote(quote: QuoteCreate, ...):
    # Quote creation logic
    pass
```

## Module Integration Examples

### Sales Module Integration

```python
# In sales/api.py
from .contact_integration import ContactIntegration

@router.post("/quotes")
@ContactIntegration.track_sales_activity("QUOTE_CREATED")
async def create_quote(quote: QuoteCreate, ...):
    # Quote creation logic
    pass

@router.get("/customers/{customer_id}/insights")
async def get_customer_insights(customer_id: int):
    insights = ContactIntegration.get_customer_insights(customer_id)
    return {"insights": insights}
```

### Project Module Integration

```python
# In project/api.py
from .contact_integration import ContactIntegration

@router.post("/projects")
@ContactIntegration.track_project_activity("PROJECT_CREATED", client_id=project.client_id)
async def create_project(project: ProjectCreate, ...):
    # Project creation logic
    pass

@router.get("/projects/{project_id}/team-insights")
async def get_project_team_insights(project_id: int):
    insights = ContactIntegration.get_project_team_insights(project_id)
    return {"team_insights": insights}
```

## Activity Types

### Sales Activities
- `QUOTE_CREATED`, `QUOTE_SENT`, `QUOTE_ACCEPTED`
- `ORDER_CREATED`, `ORDER_COMPLETED`
- `PAYMENT_RECEIVED`

### Project Activities
- `PROJECT_CREATED`, `PROJECT_STARTED`, `PROJECT_COMPLETED`
- `TASK_ASSIGNED`, `TASK_COMPLETED`
- `PROJECT_MILESTONE_REACHED`

### Communication Activities
- `EMAIL_SENT`, `EMAIL_OPENED`, `EMAIL_CLICKED`
- `CALL_MADE`, `MEETING_SCHEDULED`

### Document Activities
- `DOCUMENT_UPLOADED`, `DOCUMENT_DOWNLOADED`
- `CONTRACT_SIGNED`

## API Endpoints

### Cross-Module Analytics
```
GET /api/v1/cross-module/analytics
```
Returns analytics across all modules including:
- Total contacts and engagement metrics
- Revenue by module
- Conversion funnel data
- Cross-module insights

### Contact 360 View
```
GET /api/v1/cross-module/contacts/{contact_id}/360
```
Returns complete contact information including:
- Basic contact information
- Sales data (quotes, orders, revenue)
- Project data (active projects, history, satisfaction)
- Support data (tickets, resolution times)
- Marketing data (engagement, campaigns)
- AI insights and recommendations

## AI-Powered Features

### Lead Scoring
- Automatic lead scoring based on activities across modules
- Real-time score updates
- Predictive analytics for conversion probability

### Next Best Actions
- AI-recommended actions for each contact
- Optimal timing and channel suggestions
- Personalized communication strategies

### Churn Prediction
- Early warning system for at-risk customers
- Automated retention workflows
- Proactive outreach recommendations

## Workflow Automation

### Automated Triggers
Activities automatically trigger workflows:
- Quote created → Send confirmation email + Schedule follow-up
- Project completed → Request feedback + Generate invoice
- Payment received → Update deal status + Send receipt

### Custom Workflows
Create custom workflows based on:
- Contact activities
- Module interactions
- Time-based triggers
- Conditional logic

## Data Enrichment

### Automatic Enrichment
Contact data is automatically enriched with:
- Cross-module activity history
- Engagement metrics
- Performance indicators
- AI-generated insights

### Manual Enrichment
```python
# Enrich customer data with CRM insights
enriched_data = ContactIntegration.enrich_customer_data(customer_data)
```

## Best Practices

### 1. Consistent Activity Tracking
- Track all significant contact interactions
- Use standardized activity types
- Include relevant details and metadata

### 2. Error Handling
- Don't let contact tracking errors break main functionality
- Use try-catch blocks around tracking calls
- Log tracking failures for debugging

### 3. Performance Considerations
- Use asynchronous tracking where possible
- Batch multiple activities when appropriate
- Cache frequently accessed contact data

### 4. Privacy and Security
- Respect contact privacy preferences
- Secure sensitive contact data
- Comply with data protection regulations

## Troubleshooting

### Common Issues

1. **Contact tracking not working**
   - Check if cross_module is properly initialized
   - Verify contact_id is valid
   - Check for import errors

2. **Missing contact data**
   - Ensure contact exists in CRM system
   - Check data synchronization between modules
   - Verify API endpoint connectivity

3. **Performance issues**
   - Check database query performance
   - Consider caching strategies
   - Monitor API response times

### Debug Mode
Enable debug logging to troubleshoot issues:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

### Planned Features
- Real-time notifications via WebSockets
- Advanced AI models for predictions
- Integration with external CRM systems
- Mobile app support
- Advanced reporting and dashboards

### Contributing
To add new modules or enhance existing integrations:
1. Create module-specific integration file
2. Add new activity types if needed
3. Update cross-module integration system
4. Add tests for new functionality
5. Update documentation

## Support

For questions or issues with cross-module integration:
- Check the API documentation
- Review the example implementations
- Contact the development team
- Submit issues via the project repository


