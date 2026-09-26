// Resolve API base URL:
// 1. If VITE_API_BASE_URL or VITE_API_URL is provided, normalize trailing slashes and ensure /api/v1 prefix
// 2. In production build without env var, default to https://greenpay-api.onrender.com/api/v1
// 3. In local development without env var, fall back to '/api/v1' (routed via Vite proxy to 127.0.0.1:8000)
const rawEnvUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

function resolveApiBaseUrl(rawUrl?: string): string {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
    const trimmed = rawUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    if (trimmed.endsWith('/api')) {
      return `${trimmed}/v1`;
    }
    return `${trimmed}/api/v1`;
  }
  return import.meta.env.PROD
    ? 'https://greenpay-api.onrender.com/api/v1'
    : '/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl(rawEnvUrl);

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
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set application/json when not sending FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

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
    if (import.meta.env.DEV) {
      console.error(`Network error connecting to ${url}:`, networkErr);
    }
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
  postFormData: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: 'POST', body: formData }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

import type { VisionClassificationResult, CitizenLookupResult } from '../types';

export const classifyWasteVisionImage = async (file: File): Promise<VisionClassificationResult> => {
  const formData = new FormData();
  formData.append('image', file);
  try {
    return await api.postFormData<VisionClassificationResult>('/admin/vision/classify', formData);
  } catch (err: any) {
    if (import.meta.env.DEV) {
      console.error(`AI Vision real image classification failed at ${API_BASE_URL}/admin/vision/classify:`, err);
    }
    if (err instanceof ApiError) {
      if (err.status === 0) {
        throw new Error('Unable to connect to GreenPay services. Please ensure the backend server is running and try again.');
      }
      if (err.status === 401 || err.status === 403) {
        throw new Error('Your admin session has expired. Please log in again.');
      }
      if (err.status === 413) {
        throw new Error('Image file is too large. Maximum allowable size is 10MB.');
      }
      if (err.status === 422) {
        throw new Error(err.message || 'Invalid image format. Only JPEG, PNG, and WEBP are supported.');
      }
      if (err.status === 503) {
        throw new Error(err.message || 'AI Vision provider is not configured. Please set GEMINI_API_KEY in the environment.');
      }
      if (err.status >= 500) {
        throw new Error('Vision classification failed. Please try again or inspect item manually.');
      }
      throw new Error(err.message || 'Vision classification failed. Please try again.');
    }
    throw new Error('Unable to connect to GreenPay services. Please ensure the backend server is running and try again.');
  }
};

export const classifyWasteVision = async (preset: string): Promise<VisionClassificationResult> => {
  const formData = new FormData();
  formData.append('preset', preset);
  try {
    return await api.postFormData<VisionClassificationResult>('/admin/vision/classify', formData);
  } catch (err: any) {
    if (import.meta.env.DEV) {
      console.error(`AI Vision preset classification request failed at ${API_BASE_URL}/admin/vision/classify:`, err);
    }
    if (err instanceof ApiError) {
      if (err.status === 0) {
        throw new Error('Unable to connect to GreenPay services. Please ensure the backend server is running and try again.');
      }
      if (err.status === 401 || err.status === 403) {
        throw new Error('Your admin session has expired. Please log in again.');
      }
      if (err.status === 422) {
        throw new Error(err.message || 'Invalid vision sample preset selected.');
      }
      if (err.status >= 500) {
        throw new Error('Vision classification failed. Please try again.');
      }
      throw new Error(err.message || 'Vision classification failed. Please try again.');
    }
    throw new Error('Unable to connect to GreenPay services. Please ensure the backend server is running and try again.');
  }
};

export const resolveCitizenByGreenpayId = async (greenpayId: string): Promise<CitizenLookupResult> => {
  try {
    const cleanId = greenpayId.trim();
    return await api.get<CitizenLookupResult>(`/admin/citizens/by-greenpay-id/${encodeURIComponent(cleanId)}`);
  } catch (err: any) {
    if (err instanceof ApiError) {
      if (err.status === 0) {
        throw new Error('Unable to connect to GreenPay services.');
      }
      if (err.status === 401 || err.status === 403) {
        throw new Error('Your admin session has expired. Please log in again.');
      }
      if (err.status === 404) {
        throw new Error('Citizen not found.');
      }
      if (err.status === 400) {
        throw new Error(err.message || 'Citizen account is inactive.');
      }
      if (err.status === 422) {
        throw new Error('Invalid GreenPay QR.');
      }
      throw new Error(err.message || 'Failed to resolve citizen.');
    }
    throw new Error('Unable to connect to GreenPay services.');
  }
};

