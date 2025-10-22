/**
 * ContentNext API SDK
 *
 * A zero-dependency SDK for retrieving published articles from your ContentNext API.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Article summary returned from list endpoints (without full content)
 */
export interface ArticleSummary {
  id: string;
  websiteId: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  scheduledFor: string | null;
  publishedAt: string | null;
  readTime: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Full article including content
 */
export interface Article extends ArticleSummary {
  content: string;
}

/**
 * Response from list articles endpoint
 */
export interface ListArticlesResponse {
  articles: ArticleSummary[];
  page: number;
  limit: number;
}

/**
 * Options for listing articles
 */
export interface ListArticlesOptions {
  page?: number;
  limit?: number;
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  /**
   * Your API key for authentication
   */
  apiKey: string;
  /**
   * Optional custom server URL (defaults to production)
   */
  serverUrl?: string;
}

/**
 * Error response structure from the API
 */
interface ErrorResponse {
  message?: string;
  status?: number;
  code?: string;
}

/**
 * Error thrown by the SDK
 */
export class ContentNextAPIError extends Error {
  public readonly name = "ContentNextAPIError";
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      details?: unknown;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContentNextAPIError);
    }
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * ContentNext API Client
 *
 * @example
 * ```typescript
 * const client = new ContentNextClient({ apiKey: 'your-api-key' });
 *
 * // List articles
 * const { articles } = await client.articles.list({ page: 1, limit: 10 });
 *
 * // Get article by slug
 * const article = await client.articles.getBySlug('my-article');
 * ```
 */
export class ContentNextClient {
  private readonly apiKey: string;
  private readonly serverUrl: string;

  constructor(options: ClientOptions) {
    if (!options.apiKey || typeof options.apiKey !== "string") {
      throw new ContentNextAPIError("API key is required and must be a string");
    }

    if (options.apiKey.trim().length === 0) {
      throw new ContentNextAPIError("API key cannot be empty");
    }

    this.apiKey = options.apiKey.trim();
    this.serverUrl =
      options.serverUrl?.replace(/\/$/, "") || "https://api.example.com";
  }

  /**
   * Articles API
   */
  public readonly articles = {
    /**
     * List published articles with pagination
     */
    list: async (
      options?: ListArticlesOptions
    ): Promise<ListArticlesResponse> => {
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;

      if (page < 1) {
        throw new ContentNextAPIError("Page number must be greater than 0");
      }

      if (limit < 1 || limit > 100) {
        throw new ContentNextAPIError("Limit must be between 1 and 100");
      }

      return this.call("article/public/list", { page, limit });
    },

    /**
     * Get a specific article by slug
     */
    getBySlug: async (slug: string): Promise<Article> => {
      if (!slug || typeof slug !== "string") {
        throw new ContentNextAPIError("Slug is required and must be a string");
      }

      if (slug.trim().length === 0) {
        throw new ContentNextAPIError("Slug cannot be empty");
      }

      return this.call("article/public/getBySlug", { slug: slug.trim() });
    },
  };

  /**
   * Internal method to make RPC calls
   */
  private async call<T>(method: string, input: unknown): Promise<T> {
    const url = `${this.serverUrl}/rpc/${method}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({ json: input }),
      });

      // Parse response body
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      if (!response.ok) {
        await this.handleErrorResponse(response, isJson);
      }

      if (!isJson) {
        throw new ContentNextAPIError(
          "Invalid response format: expected JSON",
          {
            status: response.status,
          }
        );
      }

      const data = await response.json();
      // ORPC wraps responses in a json property
      return ((data as any).json ?? data) as T;
    } catch (error) {
      // Re-throw ContentNextAPIError as-is
      if (error instanceof ContentNextAPIError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ContentNextAPIError(
          "Network error: Failed to connect to the API server",
          { cause: error as Error }
        );
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new ContentNextAPIError("Failed to parse API response", {
          cause: error as Error,
        });
      }

      // Handle unknown errors
      throw new ContentNextAPIError(
        error instanceof Error ? error.message : "An unknown error occurred",
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(
    response: Response,
    isJson?: boolean
  ): Promise<never> {
    let errorData: ErrorResponse = {};

    if (isJson) {
      try {
        const json = await response.json();
        // ORPC wraps error responses in a json property
        errorData = ((json as any).json ?? json) as ErrorResponse;
      } catch {
        // If JSON parsing fails, continue with empty error data
      }
    }

    // Use error status from the error response or fall back to HTTP status
    const errorStatus = errorData.status ?? response.status;

    const message =
      errorData.message ||
      this.getDefaultErrorMessage(errorStatus) ||
      `Request failed with status ${errorStatus}`;

    throw new ContentNextAPIError(message, {
      status: errorStatus,
      code: errorData.code,
    });
  }

  /**
   * Get default error message based on HTTP status code
   */
  private getDefaultErrorMessage(status: number): string | null {
    switch (status) {
      case 400:
        return "Bad request: The request was invalid";
      case 401:
        return "Unauthorized: Invalid or missing API key";
      case 403:
        return "Forbidden: You don't have permission to access this resource";
      case 404:
        return "Not found: The requested resource does not exist";
      case 429:
        return "Too many requests: Rate limit exceeded";
      case 500:
        return "Internal server error: Something went wrong on the server";
      case 502:
        return "Bad gateway: The server is temporarily unavailable";
      case 503:
        return "Service unavailable: The server is temporarily unavailable";
      default:
        return null;
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ContentNextClient;
