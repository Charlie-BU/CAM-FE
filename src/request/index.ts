import axios, { AxiosHeaders } from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

export const DEFAULT_API_BASE_URL = "/api";

let accessTokenProvider: (() => string) | undefined;
let unauthorizedHandler: (() => void) | undefined;

export const setPlatformAuth = (
    provider?: () => string,
    onUnauthorized?: () => void,
) => {
    accessTokenProvider = provider;
    unauthorizedHandler = onUnauthorized;
};

export const setApiBase = (baseURL: string) => {
    http.defaults.baseURL = baseURL;
};

/** getAccessToken：读取当前平台访问令牌。 */
export const getAccessToken = (): string => {
    try {
        return accessTokenProvider?.() || "";
    } catch {
        return "";
    }
};

export const http: AxiosInstance = axios.create({
    baseURL: DEFAULT_API_BASE_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
});

// 请求拦截器：自动附加 Bearer Token
http.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            const headers = AxiosHeaders.from(config.headers);
            headers.set("Authorization", `Bearer ${token}`);
            config.headers = headers;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export class ApiError extends Error {
    status?: number;
    data?: unknown;
    constructor(message: string, status?: number, data?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

// 响应拦截器：统一错误格式
http.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const message = error.message || "Request error";
        if (status === 401) {
            unauthorizedHandler?.();
        }
        return Promise.reject(new ApiError(message, status, data));
    }
);

// 封装常用请求方法（返回 data）
const get = async <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
): Promise<T> => {
    const res = await http.get<T>(url, { ...config, params });
    return res.data as T;
};

const post = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> => {
    const res = await http.post<T>(url, data, config);
    return res.data as T;
};

const put = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> => {
    const res = await http.put<T>(url, data, config);
    return res.data as T;
};

const del = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> => {
    const res = await http.delete<T>(url, config);
    return res.data as T;
};

const patch = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> => {
    const res = await http.patch<T>(url, data, config);
    return res.data as T;
};

export const api = {
    get,
    post,
    put,
    del,
    patch,
};

export type { AxiosRequestConfig };
