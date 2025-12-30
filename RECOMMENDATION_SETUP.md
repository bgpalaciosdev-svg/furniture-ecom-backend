# AI Recommendation System Setup Guide

## Quick Start

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Required for AI recommendations
OPENAI_API_KEY=your_openai_api_key_here

# Optional - Enable scheduler in development
ENABLE_SCHEDULER=true

# The scheduler automatically starts in production
NODE_ENV=production
```

### 2. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and add to your `.env` file

### 3. Test the System

Start your server and test the endpoints:

```bash
npm run dev
```

### 4. Generate First Recommendations

```bash
# Test system status
curl -H "Authorization: Bearer <your_admin_token>" \
  http://localhost:8080/api/recommendations/system/status

# Generate recommendations manually
curl -X POST \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/recommendations/generate
```

### 5. View Recommendations

```bash
# Get all recommendations
curl -H "Authorization: Bearer <your_admin_token>" \
  http://localhost:8080/api/recommendations

# Get analytics
curl -H "Authorization: Bearer <your_admin_token>" \
  http://localhost:8080/api/recommendations/analytics
```

## Key Features

✅ **AI-Powered Analysis**: Uses GPT-4o-mini for intelligent customer insights  
✅ **Automated Scheduling**: Runs every 2 days automatically  
✅ **7 Recommendation Types**: Churn risk, win-back, upsell, cross-sell, etc.  
✅ **Admin Dashboard**: Full management interface  
✅ **Analytics**: Comprehensive reporting and insights  
✅ **Scalable Architecture**: LangGraph workflow orchestration

## Cost Considerations

- **GPT-4o-mini**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Estimated cost**: ~$2-5 per 1000 customers analyzed
- **Frequency**: Every 2 days (configurable)

## Next Steps

1. **Configure your OpenAI API key**
2. **Test with a few customers first**
3. **Review the generated recommendations**
4. **Integrate with your marketing workflows**
5. **Monitor the analytics dashboard**

For detailed documentation, see `AI_RECOMMENDATION_SYSTEM.md`
