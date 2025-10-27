import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosHeaders,
  type RawAxiosRequestHeaders,
} from "axios";
import type { QueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL as string;
if (!API_URL) {
  console.error("VITE_API_URL is not defined");
}

export const getAccessToken = (): string | null =>
  localStorage.getItem("access");
export const getRefreshToken = (): string => localStorage.getItem("refresh");
export const setAccessToken = (token: string): void =>
  localStorage.setItem("access", token);
export const setRefreshToken = (token: string): void =>
  localStorage.setItem("refresh", token);
export const clearTokens = (): void => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
});

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

interface RefreshResponse {
  access: string;
  refresh?: string;
}

interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

type AnyHeaders = AxiosHeaders | RawAxiosRequestHeaders | undefined;

const getHeader = (headers: AnyHeaders, name: string): string | undefined => {
  if (!headers) return undefined;

  if (headers instanceof AxiosHeaders) {
    const v = headers.get(name);
    return typeof v === "string" ? v : undefined;
  }

  const key = Object.keys(headers).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  const val = key ? (headers as RawAxiosRequestHeaders)[key] : undefined;
  return typeof val === "string" ? val : undefined;
};

const setHeader = (
  headers: AnyHeaders,
  name: string,
  value: string
): AnyHeaders => {
  if (!headers) {
    return { [name]: value } as RawAxiosRequestHeaders;
  }

  if (headers instanceof AxiosHeaders) {
    headers.set(name, value);
    return headers;
  }

  (headers as RawAxiosRequestHeaders)[name] = value;
  return headers;
};

const setAuthHeader = (headers: AnyHeaders, token: string): AnyHeaders =>
  setHeader(headers, "Authorization", `Bearer ${token}`);

const isAuthUrl = (url?: string): boolean =>
  !!url &&
  (url.includes("/users/api/login") || url.includes("/users/api/get_tokens"));

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = setAuthHeader(config.headers, token) as
      | AxiosHeaders
      | RawAxiosRequestHeaders;
  }
  return config;
});

export function installAuthInterceptor(queryClient: QueryClient): void {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError): Promise<AxiosResponse | never> => {
      const original = (error.config ?? {}) as RetryConfig;

      const status = error.response?.status;
      const skip =
        getHeader(original.headers, "x-skip-auth-interceptor") === "1";
      const url = original.url;

      if (status !== 401 || original._retry || skip || isAuthUrl(url)) {
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        await queryClient.cancelQueries();
        queryClient.clear();
        return Promise.reject(error);
      }

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers = token
                ? (setAuthHeader(original.headers, token) as
                    | AxiosHeaders
                    | RawAxiosRequestHeaders)
                : original.headers;
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post<RefreshResponse>(
          `${API_URL}/users/api/get_tokens/`,
          { refresh: refreshToken }
        );

        const newAccess = res.data?.access;
        if (!newAccess) throw new Error("No access token in refresh response");

        setAccessToken(newAccess);

        const common = apiClient.defaults.headers.common as
          | AxiosHeaders
          | RawAxiosRequestHeaders
          | undefined;
        apiClient.defaults.headers.common = setHeader(
          common,
          "Authorization",
          `Bearer ${newAccess}`
        ) as any;

        processQueue(null, newAccess);

        original.headers = setAuthHeader(original.headers, newAccess) as
          | AxiosHeaders
          | RawAxiosRequestHeaders;

        return apiClient(original);
      } catch (refreshErr: unknown) {
        processQueue(refreshErr, null);
        clearTokens();
        await queryClient.cancelQueries();
        queryClient.clear();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );
}

export default apiClient;
