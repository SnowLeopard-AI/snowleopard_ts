# Snow Leopard SDK for TypeScript

TypeScript client library for [Snow Leopard](https://cloud.snowleopard.ai) APIs.

See our [API documentation](https://docs.snowleopard.ai) for more details.

**Works in both Node.js and browser environments!**

## Installation

```bash
npm install @snowleopard-ai/client
# or
yarn add @snowleopard-ai/client
# or
pnpm add @snowleopard-ai/client
```

## Quick Start


```typescript
import { SnowLeopardClient } from '@snowleopard-ai/client';

// Initialize the client
const client = new SnowLeopardClient({
  apiKey: 'your-api-key'
});

// Query your data in natural language
const response = await client.retrieve({
  userQuery: 'How many users signed up last month?',
  instanceId: 'your-instance-id',
});

console.log(response.data);

// Stream responses
for await (const chunk of client.response({
  userQuery: 'Show me top 10 customers',
  instanceId: 'your-instance-id',
})) {
  console.log(chunk);
}

// Give Snow Leopard feedback in plain text for more accurate answers
await client.feedback({
  feedbackText:
    "The revenue column in the orders table should be labeled 'gross revenue before discounts', not 'net revenue'.",
  instanceId: 'your-instance-id',
});

await client.close();
```

## Getting Started

1. **Try Snow Leopard here** [https://cloud.snowleopard.ai](https://cloud.snowleopard.ai)
2. **Set your API key**:
   * Via environment variable:
      **Node.js** - 
       ```bash
       export SNOWLEOPARD_API_KEY="your-api-key"
       ```

      **Browser & Node.js** - Pass it directly to the client:
       ```typescript
       new SnowLeopardClient({ apiKey: 'your-api-key' })
       ```

   >    **Note**: In browser environments, you must pass the API key in the constructor options. Environment variables are only supported in Node.js.

## Usage

### Basic Usage

```typescript
import { SnowLeopardClient } from '@snowleopard-ai/client';

const client = new SnowLeopardClient();

// Get data directly from a natural language query
const response = await client.retrieve({
  userQuery: "What's the total revenue?",
  instanceId: 'instance-id',
});
console.log(response.data);

// Stream natural language summary of live data
for await (const chunk of client.response({
  userQuery: 'Show me top 10 customers',
  instanceId: 'instance-id',
})) {
  console.log(chunk);
}

// Give Snow Leopard feedback in plain text for more accurate answers
await client.feedback({
  feedbackText:
    "The revenue column in the orders table should be labeled 'gross revenue before discounts', not 'net revenue'.",
  instanceId: 'instance-id',
});

await client.close();
```

### With Known Data

You can provide additional context with the `knownData` parameter:

```typescript
const response = await client.retrieve({
  userQuery: 'Show sales for this region',
  knownData: { region: 'North America' },
  instanceId: 'instance-id',
});
```

### Configuration Options

```typescript
const client = new SnowLeopardClient({
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
import { SnowLeopardClient } from '@snowleopard-ai/client';

const client = new SnowLeopardClient({ apiKey: 'your-api-key' });

try {
  const response = await client.retrieve({
    instanceId: 'instance-id',
    userQuery: 'Your query here'
  });

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

### SnowLeopardClient

#### `constructor(options?)`

Create a new client instance.

- `options.apiKey?: string` - API key (defaults to `SNOWLEOPARD_API_KEY` env var)
- `options.baseURL?: string` - Base API URL (defaults to `https://api.snowleopard.ai`)
- `options.timeout?: TimeoutConfig` - Timeout configuration

#### `retrieve({instanceId: instanceId, datafileId: datafileId, userQuery: userQuery, knownData: knownData?})`

Retrieve data from a datafile using a natural language query.

- `instanceId: string` - (optional) The cloud.snowleopard.ai instanceId
- `datafileId: string` - (optional) The try.snowleopard.ai datafileId
- `userQuery: string` - Natural language query
- `knownData?: Record<string, any>` - Optional known data
- Returns: `Promise<RetrieveResponseObjects>`

#### `response({instanceId: instanceId, datafileId: datafileId, userQuery: userQuery, knownData: knownData?})`

Stream natural language summary responses from a datafile query.

- `instanceId: string` - (optional) The cloud.snowleopard.ai instanceId
- `datafileId: string` - (optional) The try.snowleopard.ai datafileId
- `userQuery: string` - Natural language query
- `knownData?: Record<string, any>` - Optional known data
- Returns: `AsyncGenerator<ResponseDataObjects>`

#### `feedback({feedbackText: feedbackText, instanceId: instanceId, datasourceId: datasourceId?, schemaId: schemaId?})`

Give Snow Leopard feedback in plain text so it can understand your business logic and ontology better for
more accurate answers.

- `feedbackText: string` - Feedback text to record
- `instanceId: string` - The cloud.snowleopard.ai instanceId
- `datasourceId?: string` - (optional) The datasource the feedback relates to
- `schemaId?: string` - (optional) The schema the feedback relates to
- Returns: `Promise<FeedbackResponse>`

Note: unlike `retrieve` and `response`, `feedback` does not take a `datafileId` - the `/feedback` route is
not served by the datafile deployment.

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

