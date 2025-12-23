// copyright 2025 Snow Leopard, Inc
// released under the MIT license - see LICENSE file

import { parse, RetrieveResponseObjects, ResponseDataObjects } from './models.js';

export interface TimeoutConfig {
  connect?: number;
  read?: number;
  write?: number;
}

export interface SnowLeopardClientOptions {
  apiKey?: string;
  timeout?: TimeoutConfig;
  baseURL?: string;
}

export interface SnowLeopardClientArgs {
  userQuery: string;
  knownData?: Record<string, any>;
  datafileId?: string;
}

/**
 * Client for Snow Leopard API
 *
 * @example
 * ```typescript
 * const client = new SnowLeopardClient({ apiKey: 'your-api-key' });
 *
 * // Query your data
 * const response = await client.retrieve({datafileId: 'datafile-id', userQuery: 'How many users signed up?'});
 * console.log(response.data);
 *
 * // Stream responses
 * for await (const chunk of client.response({datafileId: 'datafile-id', userQuery: 'Show top customers'})) {
 *   console.log(chunk);
 * }
 *
 * await client.close();
 * ```
 */
export class SnowLeopardClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: { connect: number; read: number; write: number };

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
  }

  private buildPath(datafileId: string | undefined, endpoint: string): string {
    if (!datafileId) {
      return endpoint;
    } else {
      return `datafiles/${datafileId}/${endpoint}`;
    }
  }

  private buildRequestBody(userQuery: string, knownData?: Record<string, any>): Record<string, any> {
    const body: Record<string, any> = { userQuery };
    if (knownData !== undefined) {
      body.knownData = knownData;
    }
    return body;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
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
   * @param options.datafileId - The ID of the datafile to query
   * @param options.userQuery - Natural language query
   * @param options.knownData - Optional known data to include in the query
   * @returns Promise resolving to RetrieveResponse object
   */
  async retrieve(options: SnowLeopardClientArgs): Promise<RetrieveResponseObjects> {
    try {
      const url = `${this.baseURL}/${this.buildPath(options.datafileId, 'retrieve')}`;
      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.buildRequestBody(options.userQuery, options.knownData)),
        },
        this.timeout.read,
      );

      if (response.status !== 200 && response.status !== 409) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseRetrieve(data);
    } catch (error: any) {
      if (error.message && error.message.includes('HTTP Error:')) {
        throw error;
      }
      if (error.message && error.message.includes('Request timeout')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Stream natural language summary responses from a datafile query
   *
   * @param options - Query options
   * @param options.datafileId - The ID of the datafile to query
   * @param options.userQuery - Natural language query
   * @param options.knownData - Optional known data to include in the query
   * @returns AsyncGenerator yielding response chunks
   */
  async *response(options: SnowLeopardClientArgs): AsyncGenerator<ResponseDataObjects, void, undefined> {
    try {
      const url = `${this.baseURL}/${this.buildPath(options.datafileId, 'response')}`;
      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.buildRequestBody(options.userQuery, options.knownData)),
        },
        this.timeout.read,
      );

      if (response.status !== 200) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
                yield parse(parsed);
              } catch (parseError) {
                console.error('Failed to parse line:', line, parseError);
              }
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
    } catch (error: any) {
      if (error.message && error.message.includes('HTTP Error:')) {
        throw error;
      }
      if (error.message && error.message.includes('Request timeout')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Close the HTTP client and cleanup resources
   */
  async close(): Promise<void> {
    // Fetch API doesn't require explicit cleanup
  }
}
