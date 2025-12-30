# AI-Powered Customer Recommendation System

This document provides a comprehensive guide to the AI-powered customer recommendation system built with LangChain and LangGraph for identifying customers that need remarketing.

## 🎯 Overview

The recommendation system analyzes customer behavior patterns using AI to identify customers who need remarketing attention. It uses LangChain for AI processing and LangGraph for workflow orchestration, automatically refreshing recommendations every 2 days.

## 🏗️ Architecture

### Core Components

1. **Customer Behavior Analysis Service** (`customer-behavior.service.ts`)

   - Analyzes purchase history, spending patterns, and engagement metrics
   - Calculates customer lifetime value and churn risk scores

2. **AI Recommendation Service** (`ai-recommendation.service.ts`)

   - Uses OpenAI GPT-4o-mini for intelligent analysis
   - Generates personalized recommendations based on behavior patterns

3. **LangGraph Workflow Service** (`recommendation-workflow.service.ts`)

   - Orchestrates the entire recommendation generation process
   - Handles batch processing and error recovery

4. **Scheduler Service** (`recommendation-scheduler.service.ts`)

   - Automatically runs recommendations every 2 days
   - Manages cleanup of expired recommendations

5. **Database Model** (`recommendation.model.ts`)
   - Stores AI-generated recommendations with TTL indexing
   - Tracks recommendation status and analytics

## 🚀 Getting Started

### Prerequisites

1. **OpenAI API Key**: Set `OPENAI_API_KEY` in your environment variables
2. **MongoDB**: Ensure your MongoDB connection is configured
3. **Dependencies**: All required packages are installed via npm

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
ENABLE_SCHEDULER=true  # Enable scheduler in development
NODE_ENV=production    # Scheduler auto-starts in production
```

### Installation

The system is already integrated into your existing project. No additional installation steps required.

## 📊 Recommendation Types

The system generates 7 types of recommendations:

1. **CHURN_RISK** - Customers likely to stop purchasing
2. **WIN_BACK** - Inactive customers to re-engage
3. **UPSELL** - Customers ready for higher-value purchases
4. **CROSS_SELL** - Customers who might buy complementary items
5. **LOYALTY_REWARD** - High-value customers to retain
6. **FIRST_TIME_BUYER** - New customers needing nurturing
7. **HIGH_VALUE_INACTIVE** - Valuable customers who've gone quiet

## 🔄 API Endpoints

### Recommendation Management

```http
# Generate recommendations
POST /api/recommendations/generate
{
  "customer_ids": ["optional", "array"],
  "force_refresh": false,
  "recommendation_types": ["optional", "filter"]
}

# Get all recommendations (with pagination)
GET /api/recommendations?page=1&limit=20&recommendation_type=churn_risk&priority_min=70

# Get customer-specific recommendations
GET /api/recommendations/customer/:customer_id

# Update recommendation status
PATCH /api/recommendations/:recommendation_id/status
{
  "status": "processed",
  "notes": "Customer contacted via email"
}

# Get analytics dashboard
GET /api/recommendations/analytics

# System status
GET /api/recommendations/system/status
```

### Scheduler Management (Admin Only)

```http
# Get scheduler status
GET /api/admin/scheduler/status

# Start/stop scheduler
POST /api/admin/scheduler/start
POST /api/admin/scheduler/stop

# Manually trigger generation
POST /api/admin/scheduler/trigger
{
  "force_refresh": true
}

# Update schedule
PUT /api/admin/scheduler/config
{
  "cron_expression": "0 2 */2 * *"
}
```

## 🤖 AI Analysis Process

### 1. Customer Behavior Analysis

The system analyzes:

- **Purchase History**: Order frequency, amounts, and patterns
- **Engagement Metrics**: Days since last order, seasonal preferences
- **Category Preferences**: Most purchased product categories
- **Spending Trends**: Monthly spending patterns and CLV calculation

### 2. AI-Powered Insights

Using LangChain and OpenAI, the system:

- Identifies behavioral patterns and engagement levels
- Predicts next purchase windows
- Generates personalized action recommendations
- Calculates priority scores (1-100)

### 3. LangGraph Workflow

The workflow orchestrates:

1. **Initialize** - Load customer list for analysis
2. **Check Customer** - Validate and filter customers
3. **Analyze Behavior** - Extract behavioral data
4. **Generate AI Recommendations** - Create AI insights
5. **Save Recommendations** - Store in database
6. **Next Customer** - Process next in queue
7. **Finalize** - Complete and report results

## 📈 Analytics & Insights

### Dashboard Metrics

- Total and active recommendations count
- Recommendations by type distribution
- Priority score distribution
- Top customers by recommendation count
- Recent activity timeline

### Customer Insights

Each recommendation includes:

- **Customer Metrics**: Total orders, spending, AOV, CLV
- **Behavioral Patterns**: Purchase frequency, favorite categories
- **AI Analysis**: Engagement level, predicted purchase window
- **Action Items**: Specific remarketing suggestions

## 🔧 Configuration & Customization

### Scheduler Configuration

Default: Runs every 2 days at 2:00 AM

```javascript
// Cron expression: "0 2 */2 * *"
// Customize via admin API or environment variables
```

### AI Model Settings

```javascript
// Current configuration in ai-recommendation.service.ts
{
  modelName: "gpt-4o-mini",  // Cost-effective model
  temperature: 0.3,          // Consistent recommendations
  maxTokens: 1500           // Adequate for detailed analysis
}
```

### Recommendation Expiry

- **Default TTL**: 2 days (matches refresh cycle)
- **Auto-cleanup**: Expired recommendations are automatically removed
- **Status Tracking**: Active → Processed/Dismissed → Expired

## 🛠️ Monitoring & Maintenance

### Health Checks

```http
GET /api/recommendations/system/status
```

Returns:

- AI configuration status
- Last generation timestamp
- Recommendations expiring soon
- Overall system health

### Cleanup Operations

```http
DELETE /api/recommendations/cleanup
```

Removes expired and old processed recommendations.

### Error Handling

The system includes comprehensive error handling:

- **Graceful Degradation**: Failed customers are logged but don't stop the process
- **Retry Logic**: Workflow can be re-run with force refresh
- **Detailed Logging**: All operations are logged for debugging

## 🎯 Use Cases & Examples

### 1. Churn Prevention

**Scenario**: Customer hasn't ordered in 90 days but has high CLV

```json
{
  "recommendation_type": "churn_risk",
  "priority_score": 85,
  "reasons": [
    "High-value customer (CLV: $2,400) inactive for 90 days",
    "Previously ordered every 30 days",
    "Favorite category: Living Room Furniture"
  ],
  "suggested_actions": [
    "Send personalized email with living room furniture deals",
    "Offer 15% discount on next purchase",
    "Schedule follow-up call from sales team"
  ]
}
```

### 2. Upsell Opportunity

**Scenario**: Customer with increasing order values

```json
{
  "recommendation_type": "upsell",
  "priority_score": 72,
  "reasons": [
    "Order value increased 40% over last 3 purchases",
    "Recently purchased dining table",
    "High engagement with premium products"
  ],
  "suggested_actions": [
    "Showcase premium dining room sets",
    "Offer room design consultation",
    "Present financing options for larger purchases"
  ]
}
```

## 🔐 Security & Privacy

### Data Protection

- All customer data is processed securely within your infrastructure
- AI analysis uses aggregated behavioral patterns, not personal details
- Recommendations are stored with appropriate access controls

### API Security

- All endpoints require authentication
- Admin endpoints require admin role
- Rate limiting and input validation applied

## 📚 Learning Resources

This system demonstrates several AI/ML concepts:

1. **LangChain Integration**: Prompt engineering and chain composition
2. **LangGraph Workflows**: State management and workflow orchestration
3. **Behavioral Analytics**: Customer segmentation and pattern recognition
4. **AI-Driven Insights**: Natural language generation for business recommendations

## 🚀 Future Enhancements

Potential improvements:

- **Real-time Recommendations**: WebSocket integration for live updates
- **A/B Testing**: Test different recommendation strategies
- **Advanced ML Models**: Custom models for specific business needs
- **Integration**: CRM and email marketing platform connections
- **Predictive Analytics**: Sales forecasting and inventory optimization

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**

   - Check API key validity
   - Monitor rate limits and usage
   - Verify network connectivity

2. **Scheduler Not Running**

   - Check environment variables
   - Verify cron expression syntax
   - Review server logs for errors

3. **No Recommendations Generated**
   - Ensure customers have completed orders
   - Check AI service configuration
   - Verify database connections

### Debug Commands

```bash
# Check system status
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/recommendations/system/status

# Manually trigger generation
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": true}' \
  http://localhost:8080/api/admin/scheduler/trigger
```

## 📞 Support

For questions or issues:

1. Check the server logs for detailed error messages
2. Review the API documentation above
3. Test with the provided endpoints
4. Monitor the recommendation analytics dashboard

---

**Built with ❤️ using LangChain, LangGraph, and OpenAI GPT-4o-mini**
