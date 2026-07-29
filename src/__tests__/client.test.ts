// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

import { HttpError, SnowLeopardClient } from '../client';
import { ResponseStatus } from '../models';

// Mock fetch globally
global.fetch = jest.fn();

describe('SnowLeopardClient', () => {
  const mockApiKey = 'test-api-key';
  const mockInstanceId = 'test-instance-id';
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
      });

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
      });

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

      await client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery, knownData: knownData });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/datafiles/${mockDatafileId}/retrieve`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery, knownData }),
        }),
      );
    });

    it('should handle empty userQuery', async () => {
      const cases = ['', ' '];

      cases.forEach(async (testCase) => {
        await expect(client.retrieve({ userQuery: testCase })).rejects.toThrow(
          'userQuery field must not be empty/whitespace',
        );
      });
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

      const result = await client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery });

      expect(result.responseStatus).toBe(ResponseStatus.NOT_FOUND_IN_SCHEMA);
    });

    it('should handle error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery })).rejects.toThrow(
        'HTTP Error: 500',
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery })).rejects.toThrow(
        'Network Error',
      );
    });

    it('should handle non-200/409 status codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery })).rejects.toThrow(
        'HTTP Error: 404',
      );
    });

    it('should throw HttpError with response object on error', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'x-error-code': 'INVALID_API_KEY' }),
        json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      try {
        await client.retrieve({ datafileId: mockDatafileId, userQuery: mockQuery });
        fail('Expected HttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        const httpError = error as HttpError;
        expect(httpError.status).toBe(403);
        expect(httpError.response).toBe(mockResponse);
        expect(httpError.name).toBe('HttpError');
        expect(httpError.message).toBe('HTTP Error: 403');
      }
    });

    it('should retrieve data using instanceId URL path', async () => {
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

      await client.retrieve({ instanceId: mockInstanceId, userQuery: mockQuery });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/v1/instances/${mockInstanceId}/retrieve`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery }),
        }),
      );
    });

    it('should prefer instanceId over datafileId when both are set', async () => {
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

      await client.retrieve({ instanceId: mockInstanceId, datafileId: mockDatafileId, userQuery: mockQuery });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/v1/instances/${mockInstanceId}/retrieve`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
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
      for await (const chunk of client.response({ datafileId: mockDatafileId, userQuery: mockQuery })) {
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
      for await (const chunk of client.response({
        datafileId: mockDatafileId,
        userQuery: mockQuery,
        knownData: knownData,
      })) {
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
      for await (const chunk of client.response({ datafileId: mockDatafileId, userQuery: mockQuery })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].__type__).toBe('responseStart');
    });

    it('should handle streaming errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const generator = client.response({ datafileId: mockDatafileId, userQuery: mockQuery });

      await expect(generator.next()).rejects.toThrow('Network Error');
    });

    it('should handle empty userQuery', async () => {
      const cases = ['', ' '];

      cases.forEach(async (testCase) => {
        const generator = client.response({ userQuery: testCase });

        await expect(generator.next()).rejects.toThrow('userQuery field must not be empty/whitespace');
      });
    });

    it('should handle non-200 status in streaming', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        body: null,
      });

      const generator = client.response({ datafileId: mockDatafileId, userQuery: mockQuery });

      await expect(generator.next()).rejects.toThrow('HTTP Error: 500');
    });

    it('should throw HttpError with response object on streaming error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'www-authenticate': 'Bearer' }),
        body: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const generator = client.response({ datafileId: mockDatafileId, userQuery: mockQuery });

      try {
        await generator.next();
        fail('Expected HttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        const httpError = error as HttpError;
        expect(httpError.status).toBe(401);
        expect(httpError.response).toBe(mockResponse);
        expect(httpError.name).toBe('HttpError');
      }
    });

    it('should skip lines that fail to parse and not yield null', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('{"__type__":"responseStart","callId":"call-1","userQuery":"test"}\n'),
          );
          controller.enqueue(new TextEncoder().encode('not valid json\n'));
          controller.enqueue(
            new TextEncoder().encode('{"__type__":"responseStart","callId":"call-2","userQuery":"test"}\n'),
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
      for await (const chunk of client.response({ datafileId: mockDatafileId, userQuery: mockQuery })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].__type__).toBe('responseStart');
      expect(chunks[1].__type__).toBe('responseStart');
      chunks.forEach((chunk) => expect(chunk).not.toBeNull());
    });

    it('should stream responses using instanceId URL path', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ __type__: 'responseStart', callId: 'call-1', userQuery: mockQuery }) + '\n',
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
      for await (const chunk of client.response({ instanceId: mockInstanceId, userQuery: mockQuery })) {
        chunks.push(chunk);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/v1/instances/${mockInstanceId}/response`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userQuery: mockQuery }),
        }),
      );
      expect(chunks).toHaveLength(1);
      expect(chunks[0].__type__).toBe('responseStart');
    });
  });

  describe('feedback', () => {
    let client: SnowLeopardClient;
    const mockFeedbackText = 'the revenue totals looked wrong';

    beforeEach(() => {
      client = new SnowLeopardClient({ apiKey: mockApiKey });
    });

    it('should successfully submit feedback', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 202,
        json: jest.fn().mockResolvedValue({ ok: true, feedbackId: 'fb_123', gateStatus: 'raw' }),
      });

      const result = await client.feedback({ feedbackText: mockFeedbackText });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/feedback`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feedbackText: mockFeedbackText }),
        }),
      );
      expect(result).toEqual({
        ok: true,
        feedbackId: 'fb_123',
        gateStatus: 'raw',
        truncated: false,
      });
    });

    it('should submit feedback using instanceId URL path', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 202,
        json: jest.fn().mockResolvedValue({ ok: true, feedbackId: 'fb_123', gateStatus: 'raw' }),
      });

      await client.feedback({ instanceId: mockInstanceId, feedbackText: mockFeedbackText });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/v1/instances/${mockInstanceId}/feedback`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ feedbackText: mockFeedbackText }),
        }),
      );
    });

    it('should send optional datasourceId and schemaId fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 202,
        json: jest.fn().mockResolvedValue({ ok: true, feedbackId: 'fb_123', gateStatus: 'raw' }),
      });

      await client.feedback({
        feedbackText: mockFeedbackText,
        datasourceId: 'ds-42',
        schemaId: 'orders_v2',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.snowleopard.ai/feedback`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            feedbackText: mockFeedbackText,
            datasourceId: 'ds-42',
            schemaId: 'orders_v2',
          }),
        }),
      );
    });

    it('should surface truncated flag when the server sets it', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 202,
        json: jest.fn().mockResolvedValue({
          ok: true,
          feedbackId: 'fb_123',
          gateStatus: 'raw',
          truncated: true,
        }),
      });

      const result = await client.feedback({ feedbackText: mockFeedbackText });

      expect(result.truncated).toBe(true);
    });

    it('should handle empty feedbackText', async () => {
      const cases = ['', ' '];

      for (const testCase of cases) {
        await expect(client.feedback({ feedbackText: testCase })).rejects.toThrow(
          'feedbackText field must not be empty/whitespace',
        );
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle non-string feedbackText', async () => {
      await expect(client.feedback({ feedbackText: 42 as unknown as string })).rejects.toThrow(
        'feedbackText field must not be empty/whitespace',
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw the description from a 400 apiError response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          __type__: 'apiError',
          callId: 'call-1',
          responseStatus: ResponseStatus.BAD_REQUEST,
          description: 'feedbackText field must not be empty/whitespace',
        }),
      });

      await expect(client.feedback({ feedbackText: mockFeedbackText })).rejects.toThrow(
        'feedbackText field must not be empty/whitespace',
      );
    });

    it('should throw HttpError for a 400 response with no __type__ field', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ some: 'other shape' }),
      });

      await expect(client.feedback({ feedbackText: mockFeedbackText })).rejects.toThrow('HTTP Error: 400');
    });

    it('should throw HttpError for a 400 response that parses to a non-apiError type', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          __type__: 'responseStart',
          callId: 'call-1',
          userQuery: mockFeedbackText,
        }),
      });

      await expect(client.feedback({ feedbackText: mockFeedbackText })).rejects.toThrow('HTTP Error: 400');
    });

    it('should throw HttpError for a 500 response without reading the body', async () => {
      const jsonMock = jest.fn().mockResolvedValue({ ok: false, error: 'something broke' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jsonMock,
      });

      await expect(client.feedback({ feedbackText: mockFeedbackText })).rejects.toThrow('HTTP Error: 500');
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should throw HttpError with response object on error', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'x-error-code': 'INVALID_API_KEY' }),
        json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      try {
        await client.feedback({ feedbackText: mockFeedbackText });
        fail('Expected HttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        const httpError = error as HttpError;
        expect(httpError.status).toBe(403);
        expect(httpError.response).toBe(mockResponse);
        expect(httpError.name).toBe('HttpError');
        expect(httpError.message).toBe('HTTP Error: 403');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(client.feedback({ feedbackText: mockFeedbackText })).rejects.toThrow('Network Error');
    });
  });

  describe('close', () => {
    it('should close without errors', async () => {
      const client = new SnowLeopardClient({ apiKey: mockApiKey });

      await expect(client.close()).resolves.toBeUndefined();
    });
  });
});
