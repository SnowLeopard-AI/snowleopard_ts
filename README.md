# Snow Leopard SDK for TypeScript/JavaScript

Universal TypeScript/JavaScript client library for [Snow Leopard Playground](https://try.snowleopard.ai) APIs.

**Works in both Node.js and browser environments!**

## Installation

```bash
npm install @snowleopard/client
# or
yarn add @snowleopard/client
# or
pnpm add @snowleopard/client
```

## Quick Start

### TypeScript

```typescript
import { SnowLeopardPlaygroundClient } from '@snowleopard/client';

// Initialize the client
const client = new SnowLeopardPlaygroundClient({
  apiKey: 'your-api-key'
});

// Query your data in natural language
const response = await client.retrieve(
  'your-datafile-id',
  'How many users signed up last month?'
);

console.log(response.data);

// Stream responses
for await (const chunk of client.response(
  'your-datafile-id',
  'Show me top 10 customers'
)) {
  console.log(chunk);
}

await client.close();
```

### JavaScript (CommonJS)

```javascript
const { SnowLeopardPlaygroundClient } = require('@snowleopard/client');

const client = new SnowLeopardPlaygroundClient({
  apiKey: 'your-api-key'
});

// Use async/await
(async () => {
  const response = await client.retrieve(
    'your-datafile-id',
    'What is the total revenue?'
  );
  console.log(response.data);
})();
```

## Getting Started

1. **Get your API key** from [https://auth.snowleopard.ai/account/api_keys](https://auth.snowleopard.ai/account/api_keys)
2. **Upload your datafiles** at [https://try.snowleopard.ai](https://try.snowleopard.ai)
3. **Set your API key**:
   * Via environment variable:
      **Node.js** - 
       ```bash
       export SNOWLEOPARD_API_KEY="your-api-key"
       ```

      **Browser & Node.js** - Pass it directly to the client:
       ```typescript
       new SnowLeopardPlaygroundClient({ apiKey: 'your-api-key' })
       ```

   >    **Note**: In browser environments, you must pass the API key in the constructor options. Environment variables are only supported in Node.js.

## Usage

### Basic Usage

```typescript
import { SnowLeopardPlaygroundClient } from '@snowleopard/client';

const client = new SnowLeopardPlaygroundClient();

// Get data directly from a natural language query
const response = await client.retrieve(
  'datafile-id',
  "What's the total revenue?"
);
console.log(response.data);

// Stream natural language summary of live data
for await (const chunk of client.response(
  'datafile-id',
  'Show me top 10 customers'
)) {
  console.log(chunk);
}

await client.close();
```

### With Known Data

You can provide additional context with the `knownData` parameter:

```typescript
const response = await client.retrieve(
  'datafile-id',
  'Show sales for this region',
  { region: 'North America' }
);
```

### Configuration Options

```typescript
const client = new SnowLeopardPlaygroundClient({
  apiKey: 'your-api-key',          // Optional if SNOWLEOPARD_API_KEY is set
  baseURL: 'https://api.snowleopard.ai',  // Optional, defaults to production
  timeout: {
    connect: 5000,    // Connection timeout in ms (default: 5000)
    read: 600000,     // Read timeout in ms (default: 600000)
    write: 10000      // Write timeout in ms (default: 10000)
  }
});
```



### Error Handling

```typescript
import { SnowLeopardPlaygroundClient } from '@snowleopard/client';

const client = new SnowLeopardPlaygroundClient({ apiKey: 'your-api-key' });

try {
  const response = await client.retrieve(
    'datafile-id',
    'Your query here'
  );

  // Check response status
  if (response.responseStatus === 'SUCCESS') {
    console.log('Query successful:', response.data);
  } else {
    console.error('Query failed:', response.responseStatus);
  }
} catch (error) {
  console.error('API Error:', error);
}
```



##  Compatibility

This package is designed to work in both Node.js and modern browsers:

- ✅ **Node.js** 20.0.0 or higher
- ✅ **Modern Browsers** with ES2020 support:
    - Chrome 80+
    - Firefox 74+
    - Safari 13.1+
    - Edge 80+

### Key Features for Browser Support

- Uses native `fetch` API for HTTP requests (works in both environments)
- Browser-safe environment variable handling
- TypeScript definitions include DOM types
- Zero external dependencies for production

## API Reference

### SnowLeopardPlaygroundClient

#### `constructor(options?)`

Create a new client instance.

- `options.apiKey?: string` - API key (defaults to `SNOWLEOPARD_API_KEY` env var)
- `options.baseURL?: string` - Base API URL (defaults to `https://api.snowleopard.ai`)
- `options.timeout?: TimeoutConfig` - Timeout configuration

#### `retrieve(datafileId, userQuery, knownData?)`

Retrieve data from a datafile using a natural language query.

- `datafileId: string` - The ID of the datafile to query
- `userQuery: string` - Natural language query
- `knownData?: Record<string, any>` - Optional known data
- Returns: `Promise<RetrieveResponseObjects>`

#### `response(datafileId, userQuery, knownData?)`

Stream natural language summary responses from a datafile query.

- `datafileId: string` - The ID of the datafile to query
- `userQuery: string` - Natural language query
- `knownData?: Record<string, any>` - Optional known data
- Returns: `AsyncGenerator<ResponseDataObjects>`

#### `close()`

Close the HTTP client and cleanup resources.

- Returns: `Promise<void>`

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [https://github.com/SnowLeopard-AI/snowleopard_ts/issues](https://github.com/SnowLeopard-AI/snowleopard_ts/issues)
- Email: hello@snowleopard.ai
- Reach out on [Discord](https://discord.gg/WGAyr8NpEX)

