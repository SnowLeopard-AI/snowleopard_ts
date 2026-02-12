// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

export enum ResponseStatus {
  SUCCESS = 'SUCCESS',
  BAD_REQUEST = 'BAD_REQUEST',
  UNABLE_TO_UNDERSTAND_QUESTION = "UNABLE_TO_UNDERSTAND_QUESTION",
  NOT_FOUND_IN_SCHEMA = 'NOT_FOUND_IN_SCHEMA',
  UNKNOWN = 'UNKNOWN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  LLM_ERROR = 'LLM_ERROR',
  LLM_TOKEN_LIMIT_REACHED = 'LLM_TOKEN_LIMIT_REACHED',
  DB_ERROR = 'DB_ERROR',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_SYNTAX_ERROR = 'DB_SYNTAX_ERROR',
}

export interface APIError {
  __type__: 'apiError';
  callId: string;
  responseStatus: string;
  description: string;
}

export interface SchemaData {
  __type__: 'schemaData';
  schemaId: string;
  schemaType: string;
  query: string;
  rows: Array<Record<string, any>>;
  querySummary: Record<string, any>;
  rowMax: number;
  isTrimmed: boolean;
  callId?: string;
}

export interface ErrorSchemaData {
  __type__: 'errorSchemaData';
  schemaType: string;
  schemaId: string;
  query: string;
  error: string;
  querySummary: Record<string, any>;
  datastoreExceptionInfo?: string;
  callId?: string;
}

export interface RetrieveResponse {
  __type__: 'retrieveResponse';
  callId: string;
  data: Array<SchemaData | ErrorSchemaData>;
  responseStatus: ResponseStatus;
}

export interface ResponseStart {
  __type__: 'responseStart';
  callId: string;
  userQuery: string;
}

export interface ResponseData {
  __type__: 'responseData';
  callId: string;
  data: Array<SchemaData | ErrorSchemaData>;
}

export interface EarlyTermination {
  __type__: 'earlyTermination';
  callId: string;
  responseStatus: ResponseStatus;
  reason: string;
  extra: Record<string, any>;
}

export interface ResponseLLMResult {
  __type__: 'responseResult';
  callId: string;
  responseStatus: ResponseStatus;
  llmResponse: Record<string, any>;
}

export function isAPIError(obj: any): obj is APIError {
  return '__type__' in obj && obj.__type__ === 'apiError';
}

export type RetrieveResponseObjects = RetrieveResponse | APIError;

export type ResponseDataObjects =
  | APIError
  | ResponseStart
  | ResponseData
  | EarlyTermination
  | ResponseLLMResult;

export type BaseResponseObject = ResponseDataObjects | RetrieveResponseObjects;

function parseType(obj: any): BaseResponseObject {
  if (!obj?.__type__) {
    throw new Error('Missing __type__ field');
  }

  switch (obj.__type__) {
    case 'apiError':
      return obj as APIError;
    case 'retrieveResponse':
      return obj as RetrieveResponse;
    case 'responseStart':
      return obj as ResponseStart;
    case 'responseData':
      return obj as ResponseData;
    case 'earlyTermination':
      return obj as EarlyTermination;
    case 'responseResult':
      return obj as ResponseLLMResult;
    default:
      throw new Error('Unknown response type ' + obj.__type__);
  }
}

/**
 * Parse API response objects into typed interfaces
 */
export function parse(obj: any): any {
  if (obj == null) {
    return null;
  } else if (typeof obj === 'object' && !Array.isArray(obj)) {
    return parseType(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(parse) as any;
  }
  return obj;
}
