import config from './config';

const isRequestInitLike = (value: unknown): value is RequestInit => {
  if (!value || typeof value !== "object" || value instanceof FormData) {
    return false;
  }

  return (
    "body" in value ||
    "headers" in value ||
    "cache" in value ||
    "credentials" in value ||
    "mode" in value ||
    "redirect" in value ||
    "signal" in value
  );
};

const buildRequestOptions = (
  method: string,
  data?: unknown,
  options: RequestInit = {}
): RequestInit => {
  let resolvedData = data;
  let resolvedOptions = options;

  if (isRequestInitLike(data)) {
    resolvedOptions = data;
    resolvedData = undefined;
  }

  const headers = new Headers(resolvedOptions.headers || {});
  const requestOptions: RequestInit = {
    ...resolvedOptions,
    method,
    headers,
  };

  if (resolvedData instanceof FormData) {
    requestOptions.body = resolvedData;
    headers.delete("Content-Type");
    return requestOptions;
  }

  if (resolvedOptions.body instanceof FormData) {
    headers.delete("Content-Type");
    return requestOptions;
  }

  if (resolvedData !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    requestOptions.body =
      typeof resolvedData === "string"
        ? resolvedData
        : JSON.stringify(resolvedData);
  } else if (!requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return requestOptions;
};

export const apiClient = {
  baseUrl: config.apiBaseUrl,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = new URL(endpoint, apiClient.baseUrl).toString();

    return fetch(url, options);
  },
  
  // Convenience methods
  get: (endpoint: string, options?: RequestInit) => 
    apiClient.request(endpoint, buildRequestOptions('GET', undefined, options)),
    
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, buildRequestOptions('POST', data, options)),
    
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiClient.request(endpoint, buildRequestOptions('PUT', data, options)),
    
  delete: (endpoint: string, options?: RequestInit) =>
    apiClient.request(endpoint, buildRequestOptions('DELETE', undefined, options)),
};

export default apiClient;
