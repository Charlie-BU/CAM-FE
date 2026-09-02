import type { AxiosRequestConfig } from "axios";

/** DATABASE_NAME：定义浏览器缓存数据库名称。 */
const DATABASE_NAME = "cam-fe-cache";
/** STORE_NAME：定义缓存响应对象仓库名称。 */
const STORE_NAME = "responses";
/** DATABASE_VERSION：定义缓存数据库版本。 */
const DATABASE_VERSION = 1;

/** CachedResponse：描述一条持久化缓存响应。 */
interface CachedResponse {
    key: string;
    data: unknown;
}

/** CacheRequestOptions：描述读取缓存和静默更新的请求配置。 */
export interface CacheRequestOptions extends AxiosRequestConfig {
    needCache?: boolean;
    cacheKey?: string;
    onCacheUpdated?: (data: unknown) => void;
}

/** stableStringify：稳定序列化缓存键和缓存数据。 */
const stableStringify = (value: unknown): string => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return JSON.stringify(value) || "";
    }
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
                left.localeCompare(right),
            ),
        ),
    );
};

/** hash：生成字符串的短哈希值。 */
const hash = (value: string): string => {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        result ^= value.charCodeAt(index);
        result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
};

/** createCacheKey：根据请求和用户令牌生成缓存键。 */
export const createCacheKey = (
    config: Pick<AxiosRequestConfig, "baseURL" | "method" | "url" | "params">,
    accessToken: string,
): string =>
    [
        "v1",
        hash(accessToken || "anonymous"),
        config.baseURL || "",
        (config.method || "get").toLowerCase(),
        config.url || "",
        stableStringify(config.params),
    ].join(":");

/** openDatabase：打开浏览器缓存数据库。 */
const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB is unavailable"));
            return;
        }
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

/** getCachedResponse：读取指定缓存键的响应。 */
export const getCachedResponse = async (key: string): Promise<CachedResponse | undefined> => {
    const database = await openDatabase();
    try {
        return await new Promise((resolve, reject) => {
            const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
            request.onsuccess = () => resolve(request.result as CachedResponse | undefined);
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
};

/** cacheResponse：保存指定缓存键的响应。 */
export const cacheResponse = async (key: string, data: unknown): Promise<void> => {
    const database = await openDatabase();
    try {
        await new Promise<void>((resolve, reject) => {
            const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put({ key, data });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
};

/** isSameCachedData：比较两份缓存数据是否一致。 */
export const isSameCachedData = (left: unknown, right: unknown) =>
    stableStringify(left) === stableStringify(right);

/** clearCachedResponsesForToken：清理指定用户令牌的缓存响应。 */
export const clearCachedResponsesForToken = async (accessToken: string): Promise<void> => {
    const prefix = `v1:${hash(accessToken || "anonymous")}:`;
    const database = await openDatabase();
    try {
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const request = transaction.objectStore(STORE_NAME).openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;
                if (String(cursor.key).startsWith(prefix)) cursor.delete();
                cursor.continue();
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
};
