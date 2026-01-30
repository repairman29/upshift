---
layout: default
title: Getting Started - JARVIS Installation Guide
permalink: /getting-started/
---

# Getting Started with JARVIS

Transform your productivity in under 5 minutes with the world's most intelligent conversational computing system.

## 🎯 Quick Installation

### One-Command Setup
```bash
curl -sSL https://install.jarvis.ai | bash
```

This automated installer will:
- ✅ Install the Clawdbot runtime (JARVIS engine)
- ✅ Download and configure all 10 productivity skills
- ✅ Set up intelligent workspace defaults
- ✅ Configure permissions and platform-specific features
- ✅ Run initial tests to verify everything works

### Manual Installation
If you prefer step-by-step control:

```bash
# 1. Install Clawdbot (JARVIS runtime)
npm install -g clawdbot

# 2. Clone JARVIS repository
git clone https://github.com/repairman29/JARVIS.git
cd JARVIS

# 3. Copy skills to JARVIS directory
cp -r skills/* ~/jarvis/skills/
cp -r jarvis/* ~/jarvis/

# 4. Start JARVIS gateway
clawdbot gateway start
```

## 🔧 Platform-Specific Setup

### macOS Setup
1. **Grant Permissions**: System Preferences → Security & Privacy → Privacy → Accessibility
   - Add Terminal (or your terminal app) for window control
2. **Optional Enhancements**:
   ```bash
   brew install blueutil      # Enhanced Bluetooth control
   brew install brightness    # Screen brightness control
   ```

### Windows Setup  
1. **PowerShell Execution**: Enable script execution for system controls
2. **Windows Defender**: Add JARVIS directory to antivirus exclusions
3. **Voice Control**: Grant microphone permissions when prompted

### Linux Setup
1. **Dependencies**: Install clipboard and audio utilities
   ```bash
   # Ubuntu/Debian
   sudo apt install xclip espeak
   
   # CentOS/RHEL
   sudo yum install xclip espeak
   ```
2. **Desktop Integration**: Configure for your desktop environment (GNOME, KDE, etc.)

## 🎮 Interactive Setup Wizard

For a guided, personalized setup experience:

```bash
node scripts/setup-wizard.js
```

The wizard will:
- 🔍 **Detect your installed applications** and suggest relevant configurations
- 🎯 **Analyze your work style** and create personalized workflows
- ✏️ **Generate text snippets** for your professional information
- 🎙️ **Configure voice control** with your preferred wake word
- 📁 **Set up file search** for your project directories
- 🧪 **Test functionality** to ensure everything works perfectly

## 🎯 Your First Commands

Once installed, try these commands to experience JARVIS intelligence:

### Basic Productivity
```
"Launch Chrome and VS Code"
"Take a screenshot and save it to Desktop"
"What's the weather like today?"
"Calculate 15% tip on $45"
```

### File & Content Management
```
"Find my recent React projects"
"Search for files containing 'API documentation'"
"Show duplicate files in Downloads folder"
"Open my most recent presentation"
```

### Workflow Automation
```
"Create a morning routine workflow"
"Set up my coding environment"
"Prepare for presentation mode"
"Run end-of-day cleanup"
```

### Voice Control (if enabled)
```
"Hey JARVIS, what time is it?"
"JARVIS, start monitoring system performance"
"Hey JARVIS, optimize my workflow"
"JARVIS, create focus mode workspace"
```

## 🛠️ Configuration

### Environment Setup
Edit `~/.clawdbot/.env` to configure:

```bash
# Basic JARVIS Configuration
JARVIS_VOICE_ENABLED=true
JARVIS_VOICE_WAKE_WORD="Hey JARVIS"
JARVIS_FILE_SEARCH_PATHS="/Users/you/Documents,/Users/you/Projects"

# Performance Optimization
JARVIS_PERF_MONITORING_ENABLED=true
JARVIS_CLIPBOARD_MAX_ITEMS=2000

# Privacy Controls
JARVIS_ANALYTICS_ENABLED=false
JARVIS_SYNC_ENABLED=false
```

### Skill Customization
Each skill can be individually configured:

```bash
# File Search Optimization
JARVIS_FILE_SEARCH_PATHS="/your/custom/paths"
JARVIS_FILE_SEARCH_EXCLUDE="node_modules,build,dist"

# Voice Control Tuning
JARVIS_VOICE_CONFIDENCE_THRESHOLD=0.8
JARVIS_VOICE_LANGUAGE="en-US"

# Performance Tuning
JARVIS_WORKFLOW_MAX_CHAINS=50
JARVIS_CLIPBOARD_SYNC_ENABLED=true
```

## 🎓 Learning Path

### Week 1: Foundation
- **Day 1-2**: Master basic commands and explore core skills
- **Day 3-4**: Create your first custom workflows
- **Day 5-7**: Set up voice control and optimize your configuration

### Week 2: Advanced Usage
- **Day 8-10**: Build complex multi-skill workflows
- **Day 11-12**: Explore community skills and marketplace
- **Day 13-14**: Optimize performance and analyze usage patterns

### Month 1: Power User
- **Week 3**: Create custom skills for your specific needs
- **Week 4**: Contribute to the community and help others

## 🆘 Troubleshooting

### Common Issues

**JARVIS not responding**:
```bash
# Check gateway status
clawdbot gateway status

# Restart if needed
clawdbot gateway restart

# Check logs for errors
clawdbot gateway logs
```

**Skills not working**:
```bash
# Verify skill installation
ls ~/jarvis/skills/

# Test skill functionality
node -e "console.log(require('~/jarvis/skills/launcher'))"

# Update skills
git pull && cp -r skills/* ~/jarvis/skills/
```

**Performance issues**:
```bash
# Run optimization
node scripts/optimize-jarvis.js

# Check system health
"JARVIS, check system health and optimize performance"

# Monitor real-time performance
"JARVIS, start monitoring system performance"
```

### Getting Help
- **Documentation**: [Complete guides and references](https://github.com/repairman29/JARVIS/blob/main/docs/README.md)
- **Community**: [GitHub Discussions](https://github.com/repairman29/JARVIS/discussions) for questions
- **Issues**: [Report bugs](https://github.com/repairman29/JARVIS/issues) with detailed information
- **Discord**: Join our community server for real-time help

## 🎉 Welcome to the Future

Congratulations! You've just installed the most advanced productivity system ever created. 

JARVIS will continuously learn your patterns, suggest optimizations, and help you discover new ways to amplify your productivity through intelligent conversation.

**Your journey into conversational computing starts now.** 🧠✨

### What's Next?
- **Explore**: Try different commands and discover JARVIS capabilities
- **Create**: Build workflows that automate your repetitive tasks
- **Share**: Contribute to the community and help others optimize
- **Innovate**: Develop skills for challenges you face daily

**Ready to revolutionize your productivity? Just start talking to JARVIS.**