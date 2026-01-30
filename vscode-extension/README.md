# Upshift for VS Code

AI-powered dependency upgrades with inline warnings and one-click fixes.

## Features

- **Inline Warnings**: See outdated packages highlighted directly in `package.json`
- **Vulnerability Alerts**: Critical security issues shown with error highlighting
- **Dependency Tree**: View all outdated packages in the sidebar
- **One-Click Upgrades**: Right-click to upgrade individual packages
- **AI Analysis**: Get AI-powered explanations for breaking changes
- **Batch Upgrades**: Upgrade all safe updates with one command

## Installation

1. Install from VS Code Marketplace: Search for "Upshift"
2. Or install from VSIX: Download from releases

## Commands

| Command | Description |
|---------|-------------|
| `Upshift: Scan Dependencies` | Scan for outdated packages and vulnerabilities |
| `Upshift: Explain Package` | Get AI explanation of breaking changes |
| `Upshift: Upgrade Package` | Upgrade a single package |
| `Upshift: Upgrade All (Safe)` | Upgrade all minor/patch updates |
| `Upshift: Security Audit` | Run security audit with AI remediation |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `upshift.apiToken` | `""` | Your Upshift API token for AI features |
| `upshift.autoScan` | `true` | Auto-scan when workspace opens |
| `upshift.showInlineWarnings` | `true` | Show inline diagnostics in package.json |
| `upshift.highlightVulnerabilities` | `true` | Highlight vulnerable packages |

## Requirements

- [Upshift CLI](https://www.npmjs.com/package/upshift-cli) must be installed globally:
  ```bash
  npm install -g upshift-cli
  ```

## Credits

AI features consume credits from your Upshift account:
- Explain with AI: 1 credit
- Audit with AI: 2 credits
- Fix with AI: 3 credits

Get credits at [upshiftai.dev](https://upshiftai.dev)

## Links

- [Documentation](https://upshiftai.dev/start)
- [GitHub](https://github.com/repairman29/upshift)
- [Report Issues](https://github.com/repairman29/upshift/issues)
