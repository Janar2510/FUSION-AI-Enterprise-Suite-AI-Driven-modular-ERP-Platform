# Dashboard Module Documentation

## Overview

The Dashboard module is the central command center of the FusionAI Enterprise Suite, providing real-time analytics, AI-powered insights, and customizable widget management. It serves as the primary interface for users to monitor key performance indicators, track business metrics, and receive intelligent recommendations.

## Features

### Core Functionality
- **Widget Management**: Create, edit, delete, and organize dashboard widgets
- **Real-time Analytics**: Live data updates with configurable refresh intervals
- **AI Insights**: Automated analysis and recommendations powered by AI agents
- **Layout Customization**: Drag-and-drop interface for widget positioning
- **Multi-user Support**: Public and private widget sharing capabilities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Widget Types
- **KPI Cards**: Display key performance indicators with trend analysis
- **Charts**: Interactive data visualizations (line, bar, pie, etc.)
- **Tables**: Tabular data display with sorting and filtering
- **AI Insights**: AI-generated recommendations and alerts
- **Custom Widgets**: User-defined widget types

## Architecture

### Backend Components

#### Models (`backend/src/modules/dashboard/models.py`)
- **DashboardWidget**: Core widget entity with position, configuration, and metadata
- **AIInsight**: AI-generated insights with confidence scores and recommendations
- **DashboardLayout**: User-specific layout configurations
- **DashboardAnalytics**: Time-series analytics data for widgets
- **User**: User entity referenced by dashboard models

#### API Endpoints (`backend/src/modules/dashboard/api.py`)
- `GET /dashboard/` - Get complete dashboard data
- `POST /dashboard/widgets` - Create new widget
- `PUT /dashboard/widgets/{id}` - Update widget
- `DELETE /dashboard/widgets/{id}` - Delete widget
- `GET /dashboard/insights` - Get AI insights
- `POST /dashboard/insights` - Create AI insight
- `PUT /dashboard/insights/{id}/acknowledge` - Acknowledge insight
- `GET /dashboard/analytics/{id}` - Get widget analytics
- `POST /dashboard/analytics/{id}` - Add analytics data
- `POST /dashboard/generate-insights` - Generate AI insights
- `GET /dashboard/templates` - Get widget templates
- `GET /dashboard/health` - Health check
- `WS /dashboard/ws` - WebSocket for real-time updates

#### Services (`backend/src/modules/dashboard/services.py`)
- **DashboardService**: Main business logic for widget operations
- **AnalyticsService**: Analytics data processing and aggregation

#### AI Agent (`backend/src/modules/dashboard/agents.py`)
- **DashboardAgent**: Specialized AI agent for analytics and insights
- Capabilities: trend analysis, anomaly detection, predictive insights, optimization suggestions

### Frontend Components

#### Main Components
- **DashboardLayout** (`components/DashboardLayout.tsx`): Main dashboard interface
- **WidgetCard** (`components/WidgetCard.tsx`): Individual widget display and management
- **WidgetCreator** (`components/WidgetCreator.tsx`): Widget creation and configuration

#### State Management
- **dashboardStore** (`stores/dashboardStore.ts`): Zustand store for dashboard state
- **useDashboard** (`hooks/useDashboard.ts`): Custom hook for dashboard operations

#### Types
- **Widget**: Widget data structure
- **AIInsight**: AI insight data structure
- **DashboardData**: Complete dashboard data structure

## API Reference

### Widget Management

#### Create Widget
```typescript
POST /dashboard/widgets
Content-Type: application/json

{
  "title": "Sales KPI",
  "description": "Monthly sales performance",
  "widget_type": "kpi",
  "position_x": 0,
  "position_y": 0,
  "width": 4,
  "height": 3,
  "config": {
    "show_trend": true,
    "show_percentage": true
  },
  "data_source": "/api/sales/kpi",
  "refresh_interval": 300,
  "theme": "default",
  "color_scheme": "purple",
  "is_public": false
}
```

#### Update Widget
```typescript
PUT /dashboard/widgets/{id}
Content-Type: application/json

{
  "title": "Updated Sales KPI",
  "width": 6,
  "height": 4,
  "is_active": true
}
```

#### Get Dashboard Data
```typescript
GET /dashboard/?include_insights=true&include_analytics=true

Response:
{
  "widgets": [...],
  "insights": [...],
  "layout": {...},
  "analytics": {...}
}
```

### AI Insights

#### Generate Insights
```typescript
POST /dashboard/generate-insights
Content-Type: application/json

{
  "widget_ids": [1, 2, 3],
  "force_refresh": false
}
```

#### Acknowledge Insight
```typescript
PUT /dashboard/insights/{id}/acknowledge
```

### Analytics

#### Add Analytics Data
```typescript
POST /dashboard/analytics/{widget_id}
Content-Type: application/json

{
  "metric_name": "sales_revenue",
  "metric_value": 150000.50,
  "metric_unit": "USD",
  "context": {
    "region": "North America",
    "product": "Software"
  },
  "tags": ["sales", "revenue", "monthly"]
}
```

#### Get Widget Analytics
```typescript
GET /dashboard/analytics/{widget_id}?hours=24&metric_name=sales_revenue
```

## Usage Examples

### Creating a KPI Widget

```typescript
import { useDashboard } from '../modules/dashboard';

const DashboardPage = () => {
  const { handleAddWidget, openWidgetCreator } = useDashboard();

  const createKPIMidget = () => {
    const widget = {
      title: 'Monthly Revenue',
      widget_type: 'kpi',
      position: { x: 0, y: 0, width: 4, height: 3 },
      config: {
        show_trend: true,
        show_percentage: true,
        color_scheme: 'green'
      },
      data_source: '/api/revenue/monthly',
      refresh_interval: 300
    };
    
    handleAddWidget(widget);
  };

  return (
    <div>
      <button onClick={createKPIMidget}>
        Add Revenue KPI
      </button>
      <button onClick={openWidgetCreator}>
        Create Custom Widget
      </button>
    </div>
  );
};
```

### Handling AI Insights

```typescript
import { useDashboard } from '../modules/dashboard';

const InsightsPanel = () => {
  const { 
    dashboardData, 
    handleAcknowledgeInsight,
    handleGenerateInsights 
  } = useDashboard();

  const handleInsightClick = (insightId: number) => {
    handleAcknowledgeInsight(insightId);
  };

  return (
    <div>
      <button onClick={handleGenerateInsights}>
        Generate New Insights
      </button>
      
      {dashboardData.insights.map(insight => (
        <div 
          key={insight.id}
          onClick={() => handleInsightClick(insight.id)}
          className={`insight ${insight.priority}`}
        >
          <h4>{insight.title}</h4>
          <p>{insight.content}</p>
          <span>Confidence: {Math.round(insight.confidence_score * 100)}%</span>
        </div>
      ))}
    </div>
  );
};
```

### Real-time Updates

```typescript
import { useDashboard } from '../modules/dashboard';
import { useWebSocket } from '../hooks/useWebSocket';

const DashboardWithWebSocket = () => {
  const { fetchDashboardData } = useDashboard();
  const { socket, isConnected } = useWebSocket('/dashboard/ws');

  useEffect(() => {
    if (socket) {
      socket.on('dashboard_update', (data) => {
        console.log('Dashboard updated:', data);
        fetchDashboardData();
      });

      return () => {
        socket.off('dashboard_update');
      };
    }
  }, [socket, fetchDashboardData]);

  return (
    <div>
      <div>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Dashboard content */}
    </div>
  );
};
```

## Configuration

### Widget Templates

The dashboard supports predefined widget templates:

```typescript
const templates = [
  {
    id: "kpi_card",
    name: "KPI Card",
    type: "kpi",
    description: "Display key performance indicators",
    default_config: {
      show_trend: true,
      show_percentage: true,
      color_scheme: "purple"
    },
    default_size: { width: 3, height: 2 }
  },
  {
    id: "line_chart",
    name: "Line Chart",
    type: "chart",
    description: "Time series line chart",
    default_config: {
      chart_type: "line",
      show_legend: true,
      show_grid: true
    },
    default_size: { width: 6, height: 4 }
  }
];
```

### Theme Configuration

```typescript
const themeConfig = {
  colors: {
    primary: '#6B46C1',
    secondary: '#9333EA',
    accent: '#EC4899',
    background: '#0F0F23',
    glass: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  }
};
```

## AI Agent Capabilities

### Analysis Types
- **Trend Analysis**: Identifies upward, downward, or stable trends in data
- **Anomaly Detection**: Detects unusual patterns or outliers
- **Predictive Insights**: Forecasts future performance based on historical data
- **Optimization Suggestions**: Recommends widget layout and configuration improvements

### Insight Generation Process
1. **Data Collection**: Gathers analytics data from widgets
2. **Pattern Recognition**: Analyzes data for trends and anomalies
3. **AI Processing**: Uses GPT-4 for intelligent analysis
4. **Recommendation Generation**: Creates actionable insights
5. **Confidence Scoring**: Assigns confidence levels to insights
6. **Priority Assignment**: Categorizes insights by importance

### Example AI Insights
```json
{
  "title": "Revenue Trend Alert",
  "content": "Sales revenue has increased by 15% over the last 30 days, indicating strong growth momentum.",
  "insight_type": "trend",
  "confidence_score": 0.92,
  "priority": "high",
  "recommendations": [
    "Monitor this trend closely for sustainability",
    "Consider increasing marketing investment",
    "Set up automated alerts for trend changes"
  ],
  "metrics": {
    "trend_direction": "upward",
    "trend_strength": 0.85,
    "data_points": 30
  }
}
```

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Widgets load data only when visible
- **Caching**: Analytics data cached for improved performance
- **Debouncing**: API calls debounced to prevent excessive requests
- **Virtual Scrolling**: Large datasets rendered efficiently
- **WebSocket Throttling**: Real-time updates throttled to prevent overload

### Monitoring
- **Widget Load Times**: Tracked and optimized
- **API Response Times**: Monitored for performance issues
- **Error Rates**: Tracked and alerted on
- **User Interactions**: Analyzed for UX improvements

## Security

### Access Control
- **User-based Permissions**: Widgets can be private or public
- **Role-based Access**: Different access levels for different user types
- **API Authentication**: All endpoints require valid authentication
- **Data Encryption**: Sensitive data encrypted in transit and at rest

### Data Protection
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries used throughout
- **XSS Protection**: Content sanitized before display
- **CSRF Protection**: Tokens used for state-changing operations

## Testing

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing

### Test Files
- `backend/tests/test_dashboard.py` - Backend tests
- `frontend/src/modules/dashboard/__tests__/` - Frontend tests
  - `DashboardLayout.test.tsx`
  - `WidgetCard.test.tsx`
  - `dashboardStore.test.ts`
  - `useDashboard.test.ts`

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fusionai

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# WebSocket
WEBSOCKET_URL=ws://localhost:8000/ws
```

### Docker Configuration
```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Common Issues

#### Widget Not Loading Data
- Check data source URL is correct
- Verify API endpoint is accessible
- Check refresh interval configuration
- Review browser console for errors

#### AI Insights Not Generating
- Ensure AI service credentials are configured
- Check widget has sufficient data points
- Verify insight generation permissions
- Review AI agent logs

#### WebSocket Connection Issues
- Check WebSocket URL configuration
- Verify network connectivity
- Review CORS settings
- Check authentication tokens

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug', 'dashboard:*');

// Check store state
console.log(useDashboardStore.getState());

// Monitor WebSocket events
socket.on('*', (event, data) => {
  console.log('WebSocket Event:', event, data);
});
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install` and `pip install -r requirements.txt`
3. Set up environment variables
4. Run development servers: `npm run dev` and `uvicorn src.main:app --reload`
5. Access dashboard at `http://localhost:3000`

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Jest/Vitest**: Testing framework

### Pull Request Process
1. Create feature branch
2. Write tests for new functionality
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to main branch

## Changelog

### Version 1.0.0
- Initial release
- Core widget management
- AI insights generation
- Real-time updates
- Responsive design
- Multi-user support

### Future Roadmap
- Advanced chart types
- Custom widget builder
- Mobile app integration
- Advanced AI capabilities
- Performance optimizations
- Enhanced security features

## Support

For technical support or questions:
- **Documentation**: [docs.fusionai.com](https://docs.fusionai.com)
- **Issues**: [GitHub Issues](https://github.com/fusionai/issues)
- **Discord**: [Community Discord](https://discord.gg/fusionai)
- **Email**: support@fusionai.com




