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
### Bumping version / Creating tags

For releasing a new version, follow these steps:

1. **Bump the version** using npm version command:

   ```shell
   npm version patch   # For bug fixes (0.1.0 -> 0.1.1)
   # or
   npm version minor   # For new features (0.1.0 -> 0.2.0)
   # or
   npm version major   # For breaking changes (0.1.0 -> 1.0.0)
   ```

   This will automatically update `package.json` and `package-lock.json` and create a git commit.

2. **Create a PR** with the version bump changes (`package.json` and `package-lock.json`)

3. **After the PR is merged**, create and push a version tag:

   ```shell
   # Create an annotated tag (replace X.Y.Z with the new version)
   git tag -a vX.Y.Z -m "Release version X.Y.Z"

   # Push the tag to the remote repository
   git push origin vX.Y.Z
   ```

   Example for version 0.1.2:
   ```shell
   git tag -a v0.1.2 -m "Release version 0.1.2"
   git push origin v0.1.2
   ``` 


### Publishing to npm registry



```shell

# login to npm
npm login

# publish
npm publish --access public

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
