# Contributing to Upshift

Thanks for your interest in contributing to Upshift! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/upshift.git
   cd upshift
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build:
   ```bash
   npm run build
   ```
5. Run locally:
   ```bash
   node dist/cli.js --help
   ```

## Development

### Project Structure

```
src/
├── cli.ts           # Main CLI entry point
├── server.ts        # Billing API server
├── commands/        # CLI command definitions
└── lib/             # Core logic
    ├── scan.ts      # Dependency scanning
    ├── explain.ts   # Breaking change explanations
    ├── upgrade.ts   # Safe upgrades with rollback
    ├── fix.ts       # AI-powered code fixes
    └── ...
```

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## Pull Request Guidelines

1. **Create a branch** for your feature or fix
2. **Write clear commit messages**
3. **Update documentation** if needed
4. **Test your changes** locally
5. **Submit a PR** with a clear description

## Areas We'd Love Help With

- **Package manager support**: Improving yarn and pnpm compatibility
- **Migration templates**: Curated rules for major framework upgrades
- **GitHub Action**: Improvements to CI/CD integration
- **Documentation**: Tutorials, examples, translations

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep functions small and focused
- Add JSDoc comments for public APIs

## Questions?

Open an issue or reach out to [@repairman29](https://github.com/repairman29).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
