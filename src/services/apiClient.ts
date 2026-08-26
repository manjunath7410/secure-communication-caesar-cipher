/**
 * @file apiClient.ts
 * @description Central Production API Client for Military Caesar Cipher Project.
 * Integrates with FastAPI backend (/api/v1) with environment-based configuration,
 * automatic Bearer token injection, structured ApiError handling, and network resilience.
 */

export class ApiError extends Error {
  public status: number;
  public detail: string | unknown;
  public isNetworkError: boolean;
  public isUnauthorized: boolean;
  public isForbidden: boolean;
  public isNotFound: boolean;
  public isConflict: boolean;
  public isValidationError: boolean;
  public field?: string;

  constructor(
    messageOrStatus: string | number,
    statusOrMessage?: number | string,
    detail?: unknown,
    isNetworkError: boolean = false,
    field?: string
  ) {
    let msg: string;
    let status: number;

    if (typeof messageOrStatus === 'number') {
      status = messageOrStatus;
      msg = typeof statusOrMessage === 'string' ? statusOrMessage : `HTTP Error ${status}`;
    } else {
      msg = messageOrStatus;
      status = typeof statusOrMessage === 'number' ? statusOrMessage : 500;
    }

    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetworkError = isNetworkError;
    this.isUnauthorized = status === 401;
    this.isForbidden = status === 403;
    this.isNotFound = status === 404;
    this.isConflict = status === 409;
    this.isValidationError = status === 422;
    this.field = field;
  }
}


export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export class ApiClient {
  private customBaseUrl?: string;
  private authToken: string | null = null;
  private unauthorizedListeners: Set<() => void> = new Set();

  constructor(baseUrl?: string) {
    this.customBaseUrl = baseUrl;
    this.initTokenFromStorage();
  }

  private initTokenFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('caesar_cipher_auth_token_v1');
        if (stored) {
          this.authToken = stored;
        }
      } catch {
        // Storage restricted in sandbox
      }
    }
  }

  /**
   * Resolves base API URL from environment (VITE_API_BASE_URL) or default fallback
   */
  public getBaseUrl(): string {
    if (this.customBaseUrl) return this.customBaseUrl;

    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL;
    }

    if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
      return process.env.VITE_API_BASE_URL;
    }

    return '/api/v1';
  }


  public setBaseUrl(url: string): void {
    this.customBaseUrl = url;
  }

  public setToken(token: string | null): void {
    this.authToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (token) {
          localStorage.setItem('caesar_cipher_auth_token_v1', token);
        } else {
          localStorage.removeItem('caesar_cipher_auth_token_v1');
        }
      } catch {}
    }
  }

  public clearToken(): void {
    this.setToken(null);
  }

  public getToken(): string | null {
    if (this.authToken) return this.authToken;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return localStorage.getItem('caesar_cipher_auth_token_v1');
      } catch {}
    }
    return null;
  }

  public onUnauthorized(listener: () => void): () => void {
    this.unauthorizedListeners.add(listener);
    return () => this.unauthorizedListeners.delete(listener);
  }

  public notifyUnauthorized(): void {
    this.triggerUnauthorized();
  }

  private triggerUnauthorized(): void {
    this.unauthorizedListeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
  }


  /**
   * Serializes query parameters into URL search string
   */
  private buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
    if (!params) return '';
    const queryParts: string[] = [];
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    }
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  }

  /**
   * Core request dispatcher with header injection, error normalization, and network resilience
   */
  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth = false, headers: customHeaders, ...fetchOptions } = options;
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const queryString = this.buildQueryString(params);
    const fullUrl = `${baseUrl}${cleanEndpoint}${queryString}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Attach Authorization header if token is available
    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
      });
    } catch (networkError: any) {
      // Network connectivity or offline failure
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const errorMsg = isOffline
        ? 'Airgap offline mode active. Terminal is disconnected from security gateway.'
        : `Network connection failed. Unable to reach security gateway at ${baseUrl}. Verify server is running.`;
      
      throw new ApiError(errorMsg, 0, networkError, true);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Parse Response Body
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        responseData = await response.text();
      } catch {
        responseData = null;
      }
    }

    // Check for HTTP Error Statuses
    if (!response.ok) {
      let extractedMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorField: string | undefined = undefined;

      if (responseData && typeof responseData === 'object') {
        if (typeof responseData.detail === 'string') {
          extractedMessage = responseData.detail;
        } else if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
          // FastAPI / Pydantic validation error array
          const firstErr = responseData.detail[0];
          extractedMessage = firstErr.msg || 'Validation failed for submitted payload.';
          if (Array.isArray(firstErr.loc)) {
            errorField = firstErr.loc[firstErr.loc.length - 1];
          }
        } else if (responseData.message) {
          extractedMessage = responseData.message;
        }
      }

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        this.triggerUnauthorized();
      }

      throw new ApiError(extractedMessage, response.status, responseData, false, errorField);
    }

    return responseData as T;
  }

  public async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
      ...options,
    });
  }

  public async post<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      params,
      ...options,
    });
  }

  public async put<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public async patch<T, B = unknown>(endpoint: string, body?: B, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  }
}

export const defaultApiClient = new ApiClient();

