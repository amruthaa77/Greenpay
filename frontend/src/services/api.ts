// Resolve API base URL:
// 1. If VITE_API_URL environment variable is provided, use it (trim trailing slashes)
// 2. In production build without explicit env var, default to the production Render backend
// 3. In local development without env var, fall back to '/api/v1' (routed via Vite proxy to 127.0.0.1:8000)
const envApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = envApiUrl
  ? envApiUrl.replace(/\/+$/, '')
  : (import.meta.env.PROD ? 'https://greenpay-api.onrender.com/api/v1' : '/api/v1');

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('greenpay_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${cleanEndpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    console.error(`Network error connecting to ${url}:`, networkErr);
    throw new ApiError(
      'Unable to connect to GreenPay services. Please ensure the backend server is running and try again.',
      0,
      networkErr
    );
  }

  if (response.status === 401) {
    // If unauthorized, clear tokens if this is not a login request
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('greenpay_token');
      localStorage.removeItem('greenpay_refresh');
      localStorage.removeItem('greenpay_session');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: Request failed`;
    if (typeof data?.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      errorMsg = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
    } else if (data?.message) {
      errorMsg = data.message;
    } else if (typeof data === 'string' && data.length > 0) {
      errorMsg = data;
    }
    console.error(`API Error [${response.status}] ${url}:`, { message: errorMsg, data });
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
