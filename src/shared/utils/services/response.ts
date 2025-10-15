import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getAccessToken = () => localStorage.getItem("access");
export const getRefreshToken = () => localStorage.getItem("refresh");
export const setAccessToken = (token: string) =>
  localStorage.setItem("access", token);
export const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

interface QueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  if (error) {
    failedQueue.forEach((item) => item.reject(error));
  } else {
    failedQueue.forEach((item) => item.resolve(token));
  }
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/users/api/get_tokens/",
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = response.data.access;
        setAccessToken(newAccessToken);

        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
