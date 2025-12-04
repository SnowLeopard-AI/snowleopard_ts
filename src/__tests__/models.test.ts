// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

import { parse, ResponseStatus } from '../models';
import type {
  SchemaData,
  ErrorSchemaData,
  RetrieveResponse,
  ResponseStart,
  ResponseData,
  EarlyTermination,
  ResponseLLMResult,
} from '../models';

describe('models', () => {
  describe('ResponseStatus enum', () => {
    it('should have all expected status values', () => {
      expect(ResponseStatus.SUCCESS).toBe('SUCCESS');
      expect(ResponseStatus.NOT_FOUND_IN_SCHEMA).toBe('NOT_FOUND_IN_SCHEMA');
      expect(ResponseStatus.UNKNOWN).toBe('UNKNOWN');
      expect(ResponseStatus.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
      expect(ResponseStatus.AUTHORIZATION_FAILED).toBe('AUTHORIZATION_FAILED');
      expect(ResponseStatus.LLM_ERROR).toBe('LLM_ERROR');
      expect(ResponseStatus.LLM_TOKEN_LIMIT_REACHED).toBe('LLM_TOKEN_LIMIT_REACHED');
    });
  });

  describe('parse function', () => {
    it('should parse valid retrieveResponse objects', () => {
      const obj: RetrieveResponse = {
        __type__: 'retrieveResponse',
        callId: 'call-123',
        data: [],
        responseStatus: ResponseStatus.SUCCESS,
      };
      const result = parse(obj);
      expect(result).toEqual(obj);
    });

    it('should parse valid apiError objects', () => {
      const obj = {
        __type__: 'apiError',
        callId: 'call-123',
        responseStatus: 'ERROR',
        description: 'Something went wrong',
      };
      const result = parse(obj);
      expect(result).toEqual(obj);
    });

    it('should parse all valid response types', () => {
      const validTypes = [
        { __type__: 'apiError', callId: 'call-1', responseStatus: 'ERROR', description: 'test' },
        { __type__: 'retrieveResponse', callId: 'call-2', data: [], responseStatus: ResponseStatus.SUCCESS },
        {
          __type__: 'errorSchemaData',
          schemaType: 'table',
          schemaId: 'schema-1',
          query: 'SELECT',
          error: 'error',
          querySummary: {},
        },
        { __type__: 'responseStart', callId: 'call-3', userQuery: 'test query' },
        { __type__: 'responseData', callId: 'call-4', data: [] },
        {
          __type__: 'earlyTermination',
          callId: 'call-5',
          responseStatus: ResponseStatus.LLM_ERROR,
          reason: 'timeout',
          extra: {},
        },
        {
          __type__: 'responseResult',
          callId: 'call-6',
          responseStatus: ResponseStatus.SUCCESS,
          llmResponse: {},
        },
      ];

      validTypes.forEach((obj) => {
        expect(() => parse(obj)).not.toThrow();
        expect(parse(obj)).toEqual(obj);
      });
    });

    it('should parse arrays of valid objects', () => {
      const arr = [
        { __type__: 'responseStart', callId: 'call-1', userQuery: 'query1' },
        { __type__: 'responseData', callId: 'call-2', data: [] },
      ];
      const result = parse(arr);
      expect(result).toEqual(arr);
    });

    it('should throw error for objects missing __type__ field', () => {
      const obj = { value: 123 };
      expect(() => parse(obj)).toThrow('Missing __type__ field');
    });

    it('should throw error for objects with unknown __type__', () => {
      const obj = { __type__: 'unknownType', value: 123 };
      expect(() => parse(obj)).toThrow('Unknown response type unknownType');
    });

    it('should throw error for objects with null __type__', () => {
      const obj = { __type__: null, value: 123 };
      expect(() => parse(obj)).toThrow('Missing __type__ field');
    });

    it('should handle null values', () => {
      const result = parse(null);
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = parse(undefined);
      expect(result).toBeNull();
    });

    it('should handle primitive values', () => {
      expect(parse('string')).toBe('string');
      expect(parse(123)).toBe(123);
      expect(parse(true)).toBe(true);
    });

    it('should parse arrays with nested objects', () => {
      const arr = [
        { __type__: 'responseStart', callId: 'call-1', userQuery: 'query1' },
        { __type__: 'responseData', callId: 'call-2', data: [] },
        {
          __type__: 'responseResult',
          callId: 'call-3',
          responseStatus: ResponseStatus.SUCCESS,
          llmResponse: {},
        },
      ];
      const result = parse(arr);
      expect(result).toEqual(arr);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });
  });

  describe('SchemaData interface', () => {
    it('should type-check valid SchemaData', () => {
      const schemaData: SchemaData = {
        __type__: 'schemaData',
        schemaId: 'schema-123',
        schemaType: 'table',
        query: 'SELECT * FROM users',
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        querySummary: { totalRows: 2 },
        rowMax: 100,
        isTrimmed: false,
        callId: 'call-abc',
      };

      expect(schemaData.__type__).toBe('schemaData');
      expect(schemaData.rows).toHaveLength(2);
    });

    it('should allow optional callId', () => {
      const schemaData: SchemaData = {
        __type__: 'schemaData',
        schemaId: 'schema-123',
        schemaType: 'table',
        query: 'SELECT * FROM users',
        rows: [],
        querySummary: {},
        rowMax: 100,
        isTrimmed: false,
      };

      expect(schemaData.callId).toBeUndefined();
    });
  });

  describe('ErrorSchemaData interface', () => {
    it('should type-check valid ErrorSchemaData', () => {
      const errorData: ErrorSchemaData = {
        __type__: 'errorSchemaData',
        schemaType: 'table',
        schemaId: 'schema-123',
        query: 'INVALID SQL',
        error: 'Syntax error at line 1',
        querySummary: {},
        datastoreExceptionInfo: 'Additional error info',
        callId: 'call-abc',
      };

      expect(errorData.__type__).toBe('errorSchemaData');
      expect(errorData.error).toBe('Syntax error at line 1');
    });
  });

  describe('RetrieveResponse interface', () => {
    it('should type-check valid RetrieveResponse', () => {
      const response: RetrieveResponse = {
        __type__: 'retrieveResponse',
        callId: 'call-123',
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
        responseStatus: ResponseStatus.SUCCESS,
      };

      expect(response.__type__).toBe('retrieveResponse');
      expect(response.responseStatus).toBe(ResponseStatus.SUCCESS);
    });

    it('should allow mixed data array', () => {
      const response: RetrieveResponse = {
        __type__: 'retrieveResponse',
        callId: 'call-123',
        data: [
          {
            __type__: 'schemaData',
            schemaId: 'schema-1',
            schemaType: 'table',
            query: 'SELECT * FROM users',
            rows: [],
            querySummary: {},
            rowMax: 100,
            isTrimmed: false,
          },
          {
            __type__: 'errorSchemaData',
            schemaType: 'table',
            schemaId: 'schema-2',
            query: 'INVALID',
            error: 'Error',
            querySummary: {},
          },
        ],
        responseStatus: ResponseStatus.SUCCESS,
      };

      expect(response.data).toHaveLength(2);
    });
  });

  describe('ResponseStart interface', () => {
    it('should type-check valid ResponseStart', () => {
      const responseStart: ResponseStart = {
        __type__: 'responseStart',
        callId: 'call-123',
        userQuery: 'How many users?',
      };

      expect(responseStart.__type__).toBe('responseStart');
      expect(responseStart.userQuery).toBe('How many users?');
    });
  });

  describe('ResponseData interface', () => {
    it('should type-check valid ResponseData', () => {
      const responseData: ResponseData = {
        __type__: 'responseData',
        callId: 'call-123',
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
      };

      expect(responseData.__type__).toBe('responseData');
      expect(responseData.data).toHaveLength(1);
    });
  });

  describe('EarlyTermination interface', () => {
    it('should type-check valid EarlyTermination', () => {
      const earlyTermination: EarlyTermination = {
        __type__: 'earlyTermination',
        callId: 'call-123',
        responseStatus: ResponseStatus.LLM_ERROR,
        reason: 'Token limit exceeded',
        extra: { tokensUsed: 5000 },
      };

      expect(earlyTermination.__type__).toBe('earlyTermination');
      expect(earlyTermination.reason).toBe('Token limit exceeded');
    });
  });

  describe('ResponseLLMResult interface', () => {
    it('should type-check valid ResponseLLMResult', () => {
      const llmResult: ResponseLLMResult = {
        __type__: 'responseResult',
        callId: 'call-123',
        responseStatus: ResponseStatus.SUCCESS,
        llmResponse: {
          text: 'There are 42 users in the system.',
          confidence: 0.95,
        },
      };

      expect(llmResult.__type__).toBe('responseResult');
      expect(llmResult.responseStatus).toBe(ResponseStatus.SUCCESS);
    });
  });
});
