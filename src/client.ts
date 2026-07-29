// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

import {
  FeedbackResponse,
  isAPIError,
  parse,
  parseFeedback,
  ResponseDataObjects,
  RetrieveResponseObjects,
} from './models.js';

export interface TimeoutConfig {
  connect?: number;
  read?: number;
  write?: number;
}

export interface SnowLeopardClientOptions {
  apiKey?: string;
  timeout?: TimeoutConfig;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
}

export interface SnowLeopardClientArgs {
  userQuery: string;
  knownData?: Record<string, any>;
  /** (optional) The cloud.snowleopard.ai instanceId */
  instanceId?: string;
  /** (optional) The try.snowleopard.ai datafileId */
  datafileId?: string;
}

export interface SnowLeopardFeedbackArgs {
  feedbackText: string;
  /** (optional) The cloud.snowleopard.ai instanceId */
  instanceId?: string;
  /** (optional) The datasource the feedback relates to */
  datasourceId?: string;
  /** (optional) The schema the feedback relates to */
  schemaId?: string;
}

export class HttpError extends Error {
  readonly response: Response;
  readonly status: number;

  constructor(response: Response) {
    super(`HTTP Error: ${response.status}`);
    this.name = 'HttpError';
    this.response = response;
    this.status = response.status;
  }
}

/**
 * Client for Snow Leopard API
 *
 * @example
 * ```typescript
 * const client = new SnowLeopardClient({ apiKey: 'your-api-key' });
 *
 * // Query your data
 * const response = await client.retrieve({instanceId: 'instance-id', userQuery: 'How many users signed up?'});
 * console.log(response.data);
 *
 * // Stream responses
 * for await (const chunk of client.response({instanceId: 'instance-id', userQuery: 'Show top customers'})) {
 *   console.log(chunk);
 * }
 *
 * // Give Snow Leopard feedback in plain text for more accurate answers
 * await client.feedback({instanceId: 'instance-id', feedbackText: 'Revenue is gross, before discounts.'});
 *
 * await client.close();
 * ```
 */
export class SnowLeopardClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: { connect: number; read: number; write: number };
  private defaultHeaders: Record<string, string>;

  constructor(options?: SnowLeopardClientOptions) {
    // Try to get API key from options, then environment variable (Node.js only)
    const apiKey = options?.apiKey || (typeof process !== 'undefined' && process.env?.SNOWLEOPARD_API_KEY);

    if (!apiKey) {
      throw new Error('Missing required argument "apiKey". Please provide it in the constructor options.');
    }

    this.apiKey = apiKey;

    this.timeout = {
      connect: options?.timeout?.connect || 5000,
      read: options?.timeout?.read || 600000,
      write: options?.timeout?.write || 10000,
    };

    this.baseURL =
      options?.baseURL ||
      (typeof process !== 'undefined' && process.env?.SNOWLEOPARD_LOC) ||
      'https://api.snowleopard.ai';

    this.defaultHeaders = options?.defaultHeaders ?? {};
  }

  private buildPath(
    instanceId: string | undefined,
    datafileId: string | undefined,
    endpoint: string,
  ): string {
    if (instanceId) {
      return `v1/instances/${instanceId}/${endpoint}`;
    } else if (datafileId) {
      return `datafiles/${datafileId}/${endpoint}`;
    } else {
      return endpoint;
    }
  }

  private buildRequestBody(userQuery: string, knownData?: Record<string, any>): Record<string, any> {
    if (!userQuery.trim()) {
      throw new Error('userQuery field must not be empty/whitespace');
    }
    const body: Record<string, any> = { userQuery };
    if (knownData !== undefined) {
      body.knownData = knownData;
    }
    return body;
  }

  private buildFeedbackBody(
    feedbackText: string,
    datasourceId?: string,
    schemaId?: string,
  ): Record<string, any> {
    if (typeof feedbackText !== 'string' || !feedbackText.trim()) {
      throw new Error('feedbackText field must not be empty/whitespace');
    }
    const body: Record<string, any> = { feedbackText };
    if (datasourceId !== undefined) {
      body.datasourceId = datasourceId;
    }
    if (schemaId !== undefined) {
      body.schemaId = schemaId;
    }
    return body;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseRetrieve(data: any): RetrieveResponseObjects {
    try {
      return parse(data);
    } catch (error) {
      throw new Error(`Failed to parse response: ${error}`);
    }
  }

  /**
   * Retrieve data from a datafile using a natural language query
   *
   * @param options - Query options
   * @param options.instanceId - (optional) The cloud.snowleopard.ai instanceId
   * @param options.datafileId - (optional) The try.snowleopard.ai datafileId
   * @param options.userQuery - Natural language query
   * @param options.knownData - Optional known data to include in the query
   * @returns Promise resolving to RetrieveResponse object
   * @throws {HttpError} When the server returns a non 2xx/409 status
   */
  async retrieve(options: SnowLeopardClientArgs): Promise<RetrieveResponseObjects> {
    const url = `${this.baseURL}/${this.buildPath(options.instanceId, options.datafileId, 'retrieve')}`;
    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
        },
        body: JSON.stringify(this.buildRequestBody(options.userQuery, options.knownData)),
      },
      this.timeout.read,
    );

    if (!response.ok && response.status !== 400 && response.status !== 409) {
      throw new HttpError(response);
    }

    const data = await response.json();
    const resultObj = this.parseRetrieve(data);

    if (isAPIError(resultObj) && response.status === 400) {
      throw new Error(resultObj.description);
    }

    return resultObj;
  }

  /**
   * Stream natural language summary responses from a datafile query
   *
   * @param options - Query options
   * @param options.instanceId - (optional) The cloud.snowleopard.ai instanceId
   * @param options.datafileId - (optional) The try.snowleopard.ai datafileId
   * @param options.userQuery - Natural language query
   * @param options.knownData - Optional known data to include in the query
   * @returns AsyncGenerator yielding response chunks
   * @throws {HttpError} When the server returns a non-2xx status
   */
  async *response(options: SnowLeopardClientArgs): AsyncGenerator<ResponseDataObjects, void, undefined> {
    const url = `${this.baseURL}/${this.buildPath(options.instanceId, options.datafileId, 'response')}`;
    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
        },
        body: JSON.stringify(this.buildRequestBody(options.userQuery, options.knownData)),
      },
      this.timeout.read,
    );

    if (!response.ok && response.status !== 400) {
      throw new HttpError(response);
    }

    if (!response.body) {
      throw new Error('Response body missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let resultObj = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              resultObj = parse(parsed);
            } catch (parseError) {
              console.error('Failed to parse line:', line, parseError);
              continue;
            }
            if (isAPIError(resultObj) && response.status === 400) {
              throw new Error(resultObj.description);
            }
            yield resultObj;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        yield parse(parsed);
      } catch (parseError) {
        console.error('Failed to parse remaining buffer:', buffer, parseError);
      }
    }
  }

  /**
   * Give Snow Leopard feedback in plain text so it can understand your business logic and ontology
   * better for more accurate answers.
   *
   * @param options - Feedback options
   * @param options.feedbackText - Feedback text to record
   * @param options.instanceId - (optional) The cloud.snowleopard.ai instanceId
   * @param options.datasourceId - (optional) The datasource the feedback relates to
   * @param options.schemaId - (optional) The schema the feedback relates to
   * @returns Promise resolving to a FeedbackResponse object
   * @throws {HttpError} When the server returns a non 2xx/400 status
   */
  async feedback(options: SnowLeopardFeedbackArgs): Promise<FeedbackResponse> {
    // /feedback is not served by the datafile deployment, so datafileId is always undefined
    const url = `${this.baseURL}/${this.buildPath(options.instanceId, undefined, 'feedback')}`;
    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
        },
        body: JSON.stringify(
          this.buildFeedbackBody(options.feedbackText, options.datasourceId, options.schemaId),
        ),
      },
      this.timeout.read,
    );

    if (!response.ok && response.status !== 400) {
      throw new HttpError(response);
    }

    const data = await response.json();

    if (response.status === 400) {
      // 400 bodies match /retrieve and /response: an apiError object
      let errObj = null;
      try {
        errObj = parse(data);
      } catch {
        throw new HttpError(response);
      }
      if (errObj !== null && isAPIError(errObj)) {
        throw new Error(errObj.description);
      }
      throw new HttpError(response);
    }

    return parseFeedback(data);
  }

  /**
   * Close the HTTP client and cleanup resources
   */
  async close(): Promise<void> {
    // Fetch API doesn't require explicit cleanup
  }
}
