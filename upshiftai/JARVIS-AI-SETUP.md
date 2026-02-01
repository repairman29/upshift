# JARVIS AI Setup - UpshiftAI Conversational Intelligence

🤖 **Transform dependency management into natural conversation**

---

## Quick Start

### 1. Get Your API Key
```bash
# Sign up and get API key
open https://upshiftai.dev/pricing

# Or use the dashboard
open https://api.upshiftai.dev/dashboard/ai-usage
```

### 2. Set Environment Variable
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export UPSHIFTAI_API_KEY=uai_pro_your_key_here

# Verify it's set
echo $UPSHIFTAI_API_KEY
```

### 3. Install JARVIS Skill
```bash
# The skill is already in skills/upshiftai/
# Just make sure CLAWDBOT is set up with the skill loaded
```

### 4. Start Talking
```
You: "Hey JARVIS, analyze my dependencies"
JARVIS: "I found 23 ancient dependencies in your project. 
         The biggest risk is lodash@4.17.19 - consider upgrading 
         to lodash-es for better tree-shaking..."

You: "What's my dependency health?"  
JARVIS: "Status: WARN. 5 ancient packages, 2 with security vulns.
         I recommend starting with moment.js → date-fns..."
```

---

## Pricing & Quotas

### Free Tier
- **10 AI queries/month**
- Perfect for trying AI features
- Basic CLI unlimited forever

### Pro Tier ($19/mo)
- **1,000 AI queries/month**
- JARVIS conversational analysis
- Smart risk assessment
- Predictive vulnerability detection

### Team Tier ($99/mo)
- **10,000 AI queries/month**
- Custom ML models
- Upgrade impact analysis

---

## API Usage Examples

### Environment Setup
```bash
# Required for all AI features
export UPSHIFTAI_API_KEY=uai_pro_abc123

# Optional: Set API base (defaults to api.upshiftai.dev)
export UPSHIFTAI_API_BASE=https://your-enterprise.upshiftai.dev
```

### JARVIS Skill Usage
```javascript
// The skill automatically checks quota and tracks usage
const result = await skill.analyze_dependencies({
  projectPath: './my-project',
  summaryOnly: true
});

if (!result.ok) {
  console.log(result.error); // Quota exceeded or invalid key
} else {
  console.log(result.onePager); // AI-generated summary
}
```

### Direct API Calls (Advanced)
```bash
# Check usage
curl -H "Authorization: Bearer $UPSHIFTAI_API_KEY" \
  https://api.upshiftai.dev/api/ai/track-usage

# Track usage (done automatically by skill)
curl -X POST \
  -H "Authorization: Bearer $UPSHIFTAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"feature": "analyze_dependencies"}' \
  https://api.upshiftai.dev/api/ai/track-usage
```

---

## Troubleshooting

### "AI features require UpshiftAI Pro subscription"
- **Issue**: No API key set
- **Fix**: `export UPSHIFTAI_API_KEY=your_key`
- **Get key**: https://upshiftai.dev/pricing

### "Invalid API key format"
- **Issue**: Key doesn't start with `uai_`
- **Fix**: Get valid key from dashboard
- **Format**: `uai_free_xxx`, `uai_pro_xxx`, or `uai_team_xxx`

### "AI quota exceeded"
- **Issue**: Used all monthly queries
- **Fix**: Upgrade tier or wait for monthly reset
- **Check usage**: https://api.upshiftai.dev/dashboard/ai-usage

### "API unavailable" 
- **Behavior**: Skill falls back to basic functionality
- **Reason**: Network issues or API maintenance
- **Fix**: Usually resolves automatically

---

## What Counts as AI Usage

### Counted (Premium)
- ✅ JARVIS `analyze_dependencies()` calls
- ✅ JARVIS `dependency_health()` calls  
- ✅ Smart risk assessment generation
- ✅ ML-powered vulnerability scoring (coming Q2)
- ✅ Custom recommendations (Team tier)

### Free Forever
- ⚡ Basic CLI: `upshiftai-deps analyze`
- ⚡ Standard reports and health checks
- ⚡ Manual checkpoints and rollbacks
- ⚡ Static replacement suggestions
- ⚡ Local processing (no data sent to servers)

---

## Advanced Configuration

### Enterprise Setup
```bash
# Point to your private deployment
export UPSHIFTAI_API_BASE=https://upshift.yourcompany.com

# Use team/enterprise API key
export UPSHIFTAI_API_KEY=uai_team_enterprise_key
```

### JARVIS Integration
```javascript
// In your JARVIS skill configuration
const upshiftaiSkill = {
  name: 'upshiftai',
  description: 'AI-powered dependency intelligence',
  requiresApiKey: true,
  quotaLimits: {
    free: 10,
    pro: 1000, 
    team: 10000
  }
};
```

### Monitoring Usage
```javascript
// Get usage statistics
const usage = await fetch('/api/ai/track-usage', {
  headers: { Authorization: `Bearer ${process.env.UPSHIFTAI_API_KEY}` }
});

console.log(`Used: ${usage.count}/${usage.limit} queries this month`);
console.log(`Resets: ${new Date(usage.resetAt).toLocaleDateString()}`);
```

---

## Business Value

### For Individual Developers
- **Conversational workflow**: Ask questions in natural language
- **Context switching reduction**: No need to memorize CLI flags
- **Intelligent prioritization**: AI tells you what to fix first

### For Teams
- **Onboarding acceleration**: Junior devs can manage deps through conversation
- **Consistent decision making**: AI provides standardized recommendations  
- **Documentation reduction**: Self-explaining dependency decisions

### For Enterprises
- **Custom intelligence**: ML models trained on your specific tech stack
- **Policy automation**: AI enforces dependency standards
- **Risk quantification**: Business impact scoring for technical debt

---

**Ready to try it?** Get your API key at [upshiftai.dev/pricing](https://upshiftai.dev/pricing) and start the conversation! 🤖