// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

import { SnowLeopardClient } from '../client';
import { ResponseStatus } from '../models';

// Mock fetch globally
global.fetch = jest.fn();

describe('SnowLeopardClient', () => {
  const mockApiKey = 'test-api-key';
  const mockDatafileId = 'test-datafile-id';
  const mockQuery = 'How many users signed up?';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    // Reset process.env
    delete process.env.SNOWLEOPARD_API_KEY;
    delete process.env.SNOWLEOPARD_LOC;
  });

  describe('constructor', () => {
    it('should create client with API key from options', () => {
      const client = new SnowLeopardClient({ apiKey: mockApiKey });
      expect(client).toBeDefined();
    });

    it('should create client with API key from environment variable', () => {
      process.env.SNOWLEOPARD_API_KEY = mockApiKey;
      const client = new SnowLeopardClient();
      expect(client).toBeDefined();
    });

    it('should use custom baseURL when provided', () => {
      const customBaseURL = 'https://custom.api.snowleopard.ai';
      const client = new SnowLeopardClient({
        apiKey: mockApiKey,
        baseURL: customBaseURL,
      });
      expect(client).toBeDefined();
    });

    it('should use baseURL from environment variable', () => {
      const envBaseURL = 'https://env.api.snowleopard.ai';
      process.env.SNOWLEOPARD_LOC = envBaseURL;
      const client = new SnowLeopardClient({ apiKey: mockApiKey });
      expect(client).toBeDefined();
    });

    it('should use custom timeout configuration', () => {
      const client = new SnowLeopardClient({
        apiKey: mockApiKey,
        timeout: {
          connect: 10000,
          read: 300000,
          write: 5000,
        },
      });
      expect(client).toBeDefined();
    });

    it('should throw error when API key is not provided', () => {
      expect(() => {
        new SnowLeopardClient();
      }).toThrow('Missing required argument "apiKey"');
    });
  });

  describe('retrieve', () => {
    let client: SnowLeopardClient;

    beforeEach(() => {
      client = new SnowLeopardClient({ apiKey: mockApiKey });
    });

    it('should successfully retrieve data', async () => {
      const mockData = {
        __type__: 'retrieveResponse',
        callId: 'test-call-id',
        responseStatus: ResponseStatus.SUCCESS,
        data: [
          {
            __type__: 'schemaData',
            schemaId: 'schema-1',
            schemaType: 'table',
            query: 'SELECT * FROM users',
            rows: [{ id: 1, name: 'John' }],
            querySummary: {},
            rowMax: 100,
            isTrimmed: false,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await client.retrieve({
          userQuery: mockQuery,
          datafileId: mockDatafileId,
        }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/datafiles/${mockDatafileId}/retrieve`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userQuery: mockQuery }),
        }),
      );
      expect(result).toEqual(mockData);
      expect(result.responseStatus).toBe(ResponseStatus.SUCCESS);
    });

    it('should successfully retrieve data without datafile id', async () => {
      const mockData = {
        __type__: 'retrieveResponse',
        callId: 'test-call-id',
        responseStatus: ResponseStatus.SUCCESS,
        data: [
          {
            __type__: 'schemaData',
            schemaId: 'schema-1',
            schemaType: 'table',
            query: 'SELECT * FROM users',
            rows: [{ id: 1, name: 'John' }],
            querySummary: {},
            rowMax: 100,
            isTrimmed: false,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await client.retrieve({
          userQuery: mockQuery,
        }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/retrieve`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userQuery: mockQuery }),
        }),
      );
      expect(result).toEqual(mockData);
      expect(result.responseStatus).toBe(ResponseStatus.SUCCESS);
    });

    it('should retrieve data with knownData', async () => {
      const knownData = { region: 'North America' };
      const mockData = {
        __type__: 'retrieveResponse',
        callId: 'test-call-id',
        responseStatus: ResponseStatus.SUCCESS,
        data: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      await client.retrieve({datafileId: mockDatafileId, userQuery: mockQuery, knownData: knownData});

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/datafiles/${mockDatafileId}/retrieve`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery, knownData }),
        }),
      );
    });

    it('should handle 409 conflict status', async () => {
      const mockData = {
        __type__: 'retrieveResponse',
        callId: 'test-call-id',
        responseStatus: ResponseStatus.NOT_FOUND_IN_SCHEMA,
        data: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await client.retrieve({datafileId: mockDatafileId, userQuery: mockQuery});

      expect(result.responseStatus).toBe(ResponseStatus.NOT_FOUND_IN_SCHEMA);
    });

    it('should handle error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(client.retrieve({datafileId: mockDatafileId, userQuery: mockQuery})).rejects.toThrow('HTTP Error: 500');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(client.retrieve({datafileId: mockDatafileId, userQuery: mockQuery})).rejects.toThrow('Network Error');
    });

    it('should handle non-200/409 status codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(client.retrieve({datafileId: mockDatafileId, userQuery: mockQuery})).rejects.toThrow('HTTP Error: 404');
    });
  });

  describe('response (streaming)', () => {
    let client: SnowLeopardClient;

    beforeEach(() => {
      client = new SnowLeopardClient({ apiKey: mockApiKey });
    });

    it('should stream responses in Node.js environment', async () => {
      const mockStreamData = [
        { __type__: 'responseStart', callId: 'call-1', userQuery: mockQuery },
        {
          __type__: 'responseData',
          callId: 'call-1',
          data: [
            {
              __type__: 'schemaData',
              schemaId: 'schema-1',
              schemaType: 'table',
              query: 'SELECT * FROM users',
              rows: [{ id: 1 }],
              querySummary: {},
              rowMax: 100,
              isTrimmed: false,
            },
          ],
        },
        {
          __type__: 'responseResult',
          callId: 'call-1',
          responseStatus: ResponseStatus.SUCCESS,
          llmResponse: { text: 'Summary here' },
        },
      ];

      // Create a mock ReadableStream
      const mockBody = new ReadableStream({
        start(controller) {
          for (const item of mockStreamData) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify(item) + '\n'));
          }
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        body: mockBody,
      });

      const chunks = [];
      for await (const chunk of client.response({datafileId: mockDatafileId, userQuery: mockQuery})) {
        chunks.push(chunk);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/datafiles/${mockDatafileId}/response`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery }),
        }),
      );
      expect(chunks).toHaveLength(3);
      expect(chunks[0].__type__).toBe('responseStart');
      expect(chunks[1].__type__).toBe('responseData');
      expect(chunks[2].__type__).toBe('responseResult');
    });

    it('should stream responses with knownData', async () => {
      const knownData = { filter: 'active' };
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                __type__: 'responseStart',
                callId: 'call-1',
                userQuery: mockQuery,
              }) + '\n',
            ),
          );
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        body: mockBody,
      });

      const chunks = [];
      for await (const chunk of client.response({datafileId: mockDatafileId, userQuery: mockQuery, knownData: knownData})) {
        chunks.push(chunk);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/datafiles/${mockDatafileId}/response`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery, knownData }),
        }),
      );
    });

    it('should handle incomplete JSON lines', async () => {
      // Create a mock ReadableStream that sends data in chunks
      const mockBody = new ReadableStream({
        start(controller) {
          // Send data in chunks that split JSON
          controller.enqueue(new TextEncoder().encode('{"__type__":"responseStart","call'));
          controller.enqueue(new TextEncoder().encode('Id":"call-1","userQuery":"test"}\n'));
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        body: mockBody,
      });

      const chunks = [];
      for await (const chunk of client.response({datafileId: mockDatafileId, userQuery: mockQuery})) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].__type__).toBe('responseStart');
    });

    it('should handle streaming errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const generator = client.response({datafileId: mockDatafileId, userQuery: mockQuery});

      await expect(generator.next()).rejects.toThrow('Network Error');
    });

    it('should handle non-200 status in streaming', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        body: null,
      });

      const generator = client.response({datafileId: mockDatafileId, userQuery: mockQuery});

      await expect(generator.next()).rejects.toThrow('HTTP Error: 500');
    });
  });

  describe('close', () => {
    it('should close without errors', async () => {
      const client = new SnowLeopardClient({ apiKey: mockApiKey });

      await expect(client.close()).resolves.toBeUndefined();
    });
  });
});
