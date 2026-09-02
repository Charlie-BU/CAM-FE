import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { CAMService, readOptions } = vi.hoisted(() => ({
    CAMService: { GetApiByIdGET: vi.fn() },
    readOptions: vi.fn((options) => ({ needCache: true, ...options })),
}));

vi.mock("@/services/CAMService", () => ({ CAMService, readOptions }));
vi.mock("@cloud-materials/common", () => ({ Message: { warning: vi.fn() } }));

import useApi from "@/hooks/useApi";

const cachedApi = { id: 1, name: "cached", method: "GET", path: "/cached" };
const updatedApi = { id: 1, name: "updated", method: "GET", path: "/updated" };

afterEach(() => vi.clearAllMocks());

describe("useApi cache integration", () => {
    it("updates a latest API detail when the cache refresh returns newer data", async () => {
        let onCacheUpdated: ((data: unknown) => void) | undefined;
        vi.mocked(CAMService.GetApiByIdGET).mockImplementation(async (_request, options) => {
            onCacheUpdated = options?.onCacheUpdated;
            return { status: 200, message: "", api: cachedApi };
        });
        const { result } = renderHook(() => useApi(1, true));

        await act(async () => undefined);
        expect(result.current.apiDetail).toEqual(cachedApi);
        expect(readOptions).toHaveBeenCalledOnce();

        act(() => onCacheUpdated?.({ status: 200, api: updatedApi }));
        expect(result.current.apiDetail).toEqual(updatedApi);
    });

    it("does not enable cache for a draft API and clears state on a failed response", async () => {
        vi.mocked(CAMService.GetApiByIdGET).mockResolvedValue({ status: 500, message: "failed" });
        const { result } = renderHook(() => useApi(2, false));

        await act(async () => undefined);
        expect(CAMService.GetApiByIdGET).toHaveBeenCalledWith(
            expect.objectContaining({ api_id: 2, is_latest: false }),
            undefined,
        );
        expect(readOptions).not.toHaveBeenCalled();
        expect(result.current.apiDetail).toEqual({});
    });
});
