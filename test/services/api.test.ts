import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } }));
vi.mock("@/request", () => ({ api }));

import { GetAllApisByServiceId, GetApiById, UpdateApiByApiDraftId } from "@/services/api";
import { CreateNewService, GetMyNewestServices } from "@/services/service";

describe("service request contracts", () => {
    beforeEach(() => vi.clearAllMocks());
    it("constructs service list and creation requests", async () => {
        await GetMyNewestServices(20, 2);
        await CreateNewService({ name: "test", description: "desc" } as never);
        expect(api.get).toHaveBeenCalledWith("/v1/service/getHisNewestServicesByOwnerId", { page_size: 20, current_page: 2, is_my_services: true });
        expect(api.post).toHaveBeenCalledWith("/v1/service/createNewService", { name: "test", description: "desc" });
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
