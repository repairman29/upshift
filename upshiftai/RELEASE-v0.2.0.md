# UpshiftAI v0.2.0 Release Notes

**Release Date:** February 1, 2026  
**Version:** 0.2.0 (up from 0.1.0)  
**Focus:** Complete multi-ecosystem support with security integration and conversational AI

---

## 🎯 What's New

### Go Ecosystem Support
- **GOPROXY Integration**: Fetch `lastPublish` metadata from Go module proxy (defaults to `proxy.golang.org`)
- **Age Detection**: Go modules now get "ancient" flagging like npm/pip packages
- **Cache Support**: GOPROXY responses cached in `.upshiftai-tmp/cache/go/` with 24h TTL

### Security Vulnerability Scanning
- **pip-audit Integration**: Automatic vulnerability scanning for pip projects when `pip-audit` is available
- **Unified Security Reports**: npm audit + pip-audit results in same report format
- **Security One-Pager**: High/critical vulns shown alongside ancient deps in risk assessment
- **Ecosystem-Aware**: Security section labels and fix commands adapt to npm vs pip

### Automated Fixes for Pip
- **`apply fix`**: Batch automated fixes now work for pip projects (was npm-only)
- **`fix <pkg>`**: One-shot package fixes now work for pip projects  
- **Ecosystem Detection**: Commands auto-detect npm vs pip and use appropriate package managers
- **Pip Operations**: Edit `requirements.txt`/`pyproject.toml`, run `pip install`, verify with `pip check`

### Extended Suggestion Database
- **New Pip Entries**: Added `backports.ssl-match-hostname`, `subprocess32` to replacement suggestions
- **Action Types**: All suggestions include `action` field (`replace`/`upgrade`/`pin`) for automation
- **Custom Suggestions**: Load `.upshiftai-suggestions.json` to extend built-in suggestions

### JARVIS Conversational AI Integration
- **New Skill**: `skills/upshiftai/` with `analyze_dependencies` and `dependency_health` tools
- **Conversational Interface**: Ask JARVIS to "analyze dependencies" or "check for ancient packages"
- **Summary & One-Pager**: Returns structured summaries and risk assessments for conversational use
- **Full Report Support**: Optional full JSON report for detailed analysis

---

## 🚀 Enhanced Features

### CLI Improvements
- **Health Check**: New `health` command for CI integration (OK/WARN/FAIL status)
- **Exit Codes**: `analyze --exit-code` with `--max-ancient`/`--max-deprecated` thresholds
- **Summary Mode**: `analyze --summary` and `report --summary` for concise output
- **Diff Reports**: `report --json --diff` compares current to last run
- **License Analysis**: `report --licenses` adds license breakdown
- **Checkpoint Management**: `checkpoint --list` and `rollback --checkpoint <TS>`

### Report Enhancements  
- **Risk Assessment**: One-pager includes risk badge (🔴 High, 🟡 Medium, 🟢 Low)
- **Blast Radius**: Shows (X direct, Y transitive) package counts
- **Latest vs Installed**: Report table shows available versions for direct deps
- **Ecosystem-Aware**: Labels and commands adapt to npm/pip/go context

### Developer Experience
- **Parallel Fetching**: Registry metadata fetched in batches (10 concurrent) for speed
- **Better Caching**: Registry responses cached with proper TTL and cleanup
- **Robust Networking**: 15s timeout, 2 retries, exponential backoff for registry calls
- **Error Handling**: Defensive parsing for malformed lockfiles and registry responses

---

## 📊 Technical Details

### Supported Ecosystems
- **npm**: `package-lock.json` + npm registry + npm audit
- **pip**: `requirements.txt`/`pyproject.toml` + PyPI + pip-audit  
- **go**: `go.mod` + GOPROXY metadata (age detection)

### Registry Integration
- **npm**: `registry.npmjs.org` for metadata + `npm audit --json`
- **pip**: `pypi.org/pypi` for metadata + `pip-audit --format json`  
- **go**: `proxy.golang.org` (or `$GOPROXY`) for version info

### Caching Strategy
- **Location**: `.upshiftai-tmp/cache/{npm,pypi,go}/`
- **TTL**: 24 hours default (configurable)
- **Format**: JSON files with safe filename encoding
- **Parallel**: 10 concurrent fetches with batching

---

## 🔄 Migration Guide

### From v0.1.x
- **No Breaking Changes**: All existing commands work the same way
- **New Commands**: `health`, `apply fix`, `fix <pkg>` are additive
- **Enhanced Output**: Reports now include security sections (additive)
- **Pip Projects**: Now get age detection and automated fixes (was read-only)
- **Go Projects**: Now get age detection via GOPROXY (was heuristics-only)

### Config Updates (Optional)
```json
{
  "webhooks": ["https://your-server.com/hooks/upshiftai"],
  "approval": {
    "mode": "prompt", 
    "requireFor": ["replace", "major"]
  }
}
```
No config changes required - all new features work with existing `.upshiftai.json`.

---

## 🎯 Use Cases Unlocked

### Security-First Dependency Management
```bash
# Get risk assessment with security vulns
upshiftai-deps report . --summary

# CI gate on security + ancient deps  
upshiftai-deps health . --exit-code --json
```

### Multi-Language Projects
```bash
# Analyze all ecosystems in one repo
upshiftai-deps analyze frontend/   # npm
upshiftai-deps analyze backend/    # pip  
upshiftai-deps analyze service/    # go
```

### Automated Remediation
```bash
# Fix all problematic deps (now works for npm + pip)
upshiftai-deps apply fix . --dry-run

# One-shot fix for specific package
upshiftai-deps fix moment . --yes  # npm: moment → date-fns
upshiftai-deps fix six . --yes     # pip: six → stdlib  
```

### Conversational AI Workflows
```javascript
// JARVIS skill usage
const result = skill.analyze_dependencies({ 
  projectPath: './my-project',
  summaryOnly: true 
});
// Returns: risk assessment + actionable summary
```

---

## 🚦 What's Next

All roadmap items from `CAPABILITIES-AND-ROADMAP.md` are now **complete**. Future versions will focus on:

- **Enterprise Features**: SSO, audit trails, policy enforcement
- **CI/CD Integration**: GitHub Actions, GitLab CI, Jenkins plugins
- **Visualization**: Dependency graphs, risk dashboards
- **ML-Powered**: Predictive vulnerability detection, upgrade impact analysis

---

## 📝 Upgrade Instructions

### Via npm (when published)
```bash
npm install -g upshiftai-deps@0.2.0
```

### Via Git
```bash  
cd CLAWDBOT/upshiftai
git pull origin main
git checkout upshiftai-v0.2.0
npm install
```

### Docker (planned)
```bash
docker run -v $(pwd):/workspace upshiftai/deps:0.2.0 analyze /workspace
```

---

**Full Changelog**: [upshiftai-v0.1.0...upshiftai-v0.2.0](https://github.com/repairman29/CLAWDBOT/compare/upshiftai-v0.1.0...upshiftai-v0.2.0)

**Questions?** Open an issue or contact [@repairman29](https://github.com/repairman29).