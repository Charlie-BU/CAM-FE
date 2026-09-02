import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, getAccessToken, http } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() },
    getAccessToken: vi.fn(() => ""),
    http: { request: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("@/request", () => ({ api, getAccessToken, http }));

import { GetAllApisByServiceId, GetApiById, UpdateApiByApiDraftId } from "@/services/api";
import { CAMService } from "@/services/CAMService";

describe("service request contracts", () => {
    beforeEach(() => vi.clearAllMocks());
    it("constructs service list and creation requests", async () => {
        await CAMService.GetHisNewestServicesByOwnerIdGET({
            is_my_services: true,
            page_size: 20,
            current_page: 2,
        } as never);
        await CAMService.CreateNewServicePOST({
            service_uuid: "service-001",
            description: "desc",
        } as never);
        expect(http.request).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: "/v1/service/getHisNewestServicesByOwnerId",
            method: "GET",
            params: { is_my_services: true, owner_id: undefined, page_size: 20, current_page: 2 },
        }));
        expect(http.request).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: "/v1/service/createNewService",
            method: "POST",
            data: { service_uuid: "service-001", description: "desc" },
        }));
    });
    it("keeps API query options and serializes draft parameter trees", async () => {
        await GetAllApisByServiceId(7, 9);
        await GetApiById(5, false);
        await UpdateApiByApiDraftId({ api_draft_id: 1, req_params: [{ name: "q" }], resp_params: [] } as never);
        expect(api.get).toHaveBeenCalledWith("/v1/api/getAllApisByServiceId", { service_id: 7, category_id: 9 });
        expect(api.get).toHaveBeenCalledWith("/v1/api/getApiById", { api_id: 5, is_latest: false });
        expect(api.post).toHaveBeenLastCalledWith("/v1/api/updateApiByApiDraftId", expect.objectContaining({ req_params: '[{"name":"q"}]', resp_params: "[]" }));
    });
});
