# Contributing to Snow Leopard TypeScript SDK

Thank you for your interest in contributing to the Snow Leopard SDK!

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 20.0.0 or higher
- **npm**: 7.0.0 or higher (comes with Node.js)

You can verify your versions with:
```bash
node --version
npm --version
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SnowLeopard-AI/snowleopard_ts.git
   cd snowleopard_ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (For Node.js only) **

   ```bash
   export SNOWLEOPARD_API_KEY="your-api-key"
   ```

## Development Workflow

### Building

```bash
# Build the project
npm run build

# Watch for changes and rebuild automatically
npm run watch
```

### Testing

```bash
# Run tests
npm test

```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
snowleopard_ts/
├── src/
│   ├── index.ts           # Main entry point and exports
│   ├── models.ts          # Type definitions and interfaces
│   ├── client.ts          # Main client implementation (async)
│   └── __tests__/         # Test files
│       ├── client.test.ts # Client tests
│       └── models.test.ts # Model/type tests
├── dist/                  # Compiled JavaScript output (generated)
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest testing configuration
├── .eslint.config.mjs     # ESLint configuration
├── .prettierrc            # Prettier configuration
├── README.md              # User documentation
└── CONTRIBUTING.md        # Contributing guidelines (this file)
```


## Questions?

- Open an issue on GitHub
- Email: hello@snowleopard.ai
- Reach out on [Discord](https://discord.gg/WGAyr8NpEX)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
