# Changelog

All notable changes to UpshiftAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-01

### Added
- **Go proxy integration**: Fetch `lastPublish` metadata from GOPROXY for age detection
- **pip-audit integration**: Automatic vulnerability scanning for pip projects  
- **Security reporting**: Unified npm audit + pip-audit results in reports
- **Automated pip fixes**: `apply fix` and `fix <pkg>` now work for pip projects
- **Health check**: New `health` command for CI integration (OK/WARN/FAIL status)
- **JARVIS skill**: Conversational AI integration with `analyze_dependencies` and `dependency_health` tools
- **Extended pip suggestions**: Added `backports.ssl-match-hostname`, `subprocess32` replacements
- **CLI enhancements**:
  - `analyze --summary --exit-code --max-ancient --max-deprecated --no-audit`
  - `report --summary --json --diff --licenses`
  - `checkpoint --list`
  - `rollback --checkpoint <timestamp>`
- **Report improvements**:
  - Risk badge (🔴 High, 🟡 Medium, 🟢 Low) in one-pager
  - Blast radius (X direct, Y transitive) counts
  - Latest vs installed versions for direct deps
  - Security sections with ecosystem-aware labels
- **Performance**: Parallel registry fetching (10 concurrent) with caching
- **Caching**: Registry responses cached in `.upshiftai-tmp/cache/` with 24h TTL
- **Networking**: Robust fetch with 15s timeout, 2 retries, exponential backoff

### Changed
- **Go tree depth**: Now 1=direct, 2=indirect (was 0=direct, 1=indirect)  
- **Report sections**: Security sections now show "npm audit" vs "pip-audit" based on ecosystem
- **One-pager text**: Fix commands now show ecosystem-appropriate tools (npm audit fix vs pip-audit --fix)
- **Apply commands**: Now work for both npm and pip with ecosystem auto-detection
- **Package version**: Bumped to 0.2.0

### Fixed
- **Pip parsing**: Better handling of malformed requirements.txt and pyproject.toml
- **Registry errors**: Defensive parsing for malformed npm/PyPI/GOPROXY responses
- **Cache invalidation**: Proper TTL handling and cleanup for registry cache
- **CLI validation**: Better path validation and error messages for invalid arguments

## [0.1.0] - 2025-08-01

### Added
- Initial release
- **npm support**: package-lock.json parsing with npm registry metadata
- **pip support**: requirements.txt and pyproject.toml parsing with PyPI metadata  
- **go support**: go.mod parsing (no registry integration)
- **Analysis**: Ancient/deprecated/fork-hint detection with configurable thresholds
- **Reports**: JSON, markdown, CSV output formats
- **Full reports**: "Deep throat" reports with transitive dependency chains
- **Checkpoints**: Save manifest + lockfile before changes
- **Rollback**: Restore from checkpoints
- **Apply system**: 
  - `apply upgrade <pkg>` for npm
  - `apply replace <old> <new>` for npm
- **HITL**: Approval workflows with prompt/webhook/none modes
- **Webhooks**: Complete event system for observability
- **Suggestions**: Built-in replacement map for common deprecated packages
- **CLI**: Complete command-line interface
- **Config**: `.upshiftai.json` for webhooks and approval settings

[0.2.0]: https://github.com/repairman29/CLAWDBOT/compare/upshiftai-v0.1.0...upshiftai-v0.2.0
[0.1.0]: https://github.com/repairman29/CLAWDBOT/releases/tag/upshiftai-v0.1.0