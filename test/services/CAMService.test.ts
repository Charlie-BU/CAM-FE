import { afterEach, describe, expect, it, vi } from "vitest";
import { http, setApiBase, setPlatformAuth } from "@/request";
import {
    CAMService,
    invalidateAfterSuccessfulMutation,
    readOptions,
} from "@/services/CAMService";
import {
    cacheResponse,
    clearCachedResponsesForToken,
    createCacheKey,
    getCachedResponse,
} from "@/services/cache";

vi.mock("@/services/cache", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/cache")>();
    return {
        ...actual,
        cacheResponse: vi.fn().mockResolvedValue(undefined),
        clearCachedResponsesForToken: vi.fn().mockResolvedValue(undefined),
        getCachedResponse: vi.fn(),
    };
});

afterEach(() => {
    setPlatformAuth();
    setApiBase("/api");
    http.defaults.adapter = undefined;
    vi.clearAllMocks();
});

describe("CAMService cache adapter", () => {
    it("isolates cache keys by API base and normalizes parameter order", () => {
        const config = { method: "GET", url: "/v1/service", params: { page: 1, size: 20 } };
        expect(createCacheKey({ ...config, baseURL: "/api/team-a" }, "test-access-token")).toBe(
            createCacheKey(
                { method: "GET", url: "/v1/service", params: { size: 20, page: 1 }, baseURL: "/api/team-a" },
                "test-access-token",
            ),
        );
        expect(createCacheKey({ ...config, baseURL: "/api/team-a" }, "test-access-token")).not.toBe(
            createCacheKey({ ...config, baseURL: "/api/team-b" }, "test-access-token"),
        );
    });

    it("returns cached data and refreshes it against the current API base", async () => {
        setPlatformAuth(() => "test-access-token");
        setApiBase("/api/team-a");
        vi.mocked(getCachedResponse).mockResolvedValue({ key: "cache-key", data: { source: "cache" } });
        http.defaults.adapter = async (config) => ({
            data: { source: "network" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        await expect(
            CAMService.GetServiceByIdGET({ id: 1, Authorization: "ignored" }, readOptions()),
        ).resolves.toEqual({ source: "cache" });

        await vi.waitFor(() =>
            expect(cacheResponse).toHaveBeenCalledWith(
                expect.stringContaining(":/api/team-a:get:"),
                { source: "network" },
            ),
        );
    });

    it("falls back to the network when cache storage is unavailable", async () => {
        vi.mocked(getCachedResponse).mockRejectedValue(new Error("IndexedDB is unavailable"));
        http.defaults.adapter = async (config) => ({
            data: { source: "network" },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });

        await expect(
            CAMService.GetServiceByIdGET({ id: 1, Authorization: "ignored" }, readOptions()),
        ).resolves.toEqual({ source: "network" });
    });

    it("invalidates the current user's cache after a successful mutation", () => {
        setPlatformAuth(() => "test-access-token");
        invalidateAfterSuccessfulMutation({ status: 200 });
        expect(clearCachedResponsesForToken).toHaveBeenCalledWith("test-access-token");
    });
});
