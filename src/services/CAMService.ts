import type { AxiosRequestConfig } from "axios";
import CAMServiceService from "@/cam-auto-generate/CAMService";
import { getAccessToken, http } from "@/request";
import {
    cacheResponse,
    clearCachedResponsesForToken,
    createCacheKey,
    getCachedResponse,
    isSameCachedData,
    type CacheRequestOptions,
} from "@/services/cache";

/** request：执行 CAM 生成客户端的请求。 */
const request = async <T>(
    config: AxiosRequestConfig,
    options?: CacheRequestOptions,
): Promise<T> => {
    const { needCache, cacheKey, onCacheUpdated, ...axiosOptions } = options || {};
    const requestConfig: AxiosRequestConfig = {
        ...axiosOptions,
        ...config,
        headers: { ...axiosOptions.headers, ...config.headers },
    };
    const fetchNetwork = () => http.request<T>(requestConfig).then((response) => response.data);

    if (!needCache || config.method?.toLowerCase() !== "get") return fetchNetwork();

    const key =
        cacheKey ||
        createCacheKey(
            { ...requestConfig, baseURL: requestConfig.baseURL ?? http.defaults.baseURL },
            getAccessToken(),
        );
    let cached;
    try {
        cached = await getCachedResponse(key);
    } catch {
        return fetchNetwork();
    }
    if (!cached) {
        const data = await fetchNetwork();
        void cacheResponse(key, data).catch(() => undefined);
        return data;
    }

    void (async () => {
        try {
            const data = await fetchNetwork();
            if (isSameCachedData(cached.data, data)) return;
            await cacheResponse(key, data).catch(() => undefined);
            onCacheUpdated?.(data);
        } catch {
            // 已返回缓存，后台刷新失败不干扰当前页面。
        }
    })();
    return cached.data as T;
};

/** CAMService：提供 CAM 自动生成接口的客户端实例。 */
export const CAMService = new CAMServiceService<CacheRequestOptions>({ request });

/** readOptions：创建默认启用缓存的读取请求配置。 */
export const readOptions = (options?: CacheRequestOptions): CacheRequestOptions => ({
    needCache: true,
    ...options,
});

/** invalidateCurrentUserCache：清理当前用户的接口缓存。 */
export const invalidateCurrentUserCache = () =>
    clearCachedResponsesForToken(getAccessToken()).catch(() => undefined);

/** invalidateAfterSuccessfulMutation：在写操作成功后失效缓存。 */
export const invalidateAfterSuccessfulMutation = <T extends { status?: number }>(
    response: T,
): T => {
    if (response.status === 200 || response.status === 201) invalidateCurrentUserCache();
    return response;
};

export type { CacheRequestOptions };
