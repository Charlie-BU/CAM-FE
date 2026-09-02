import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken, http } = vi.hoisted(() => ({
    getAccessToken: vi.fn(() => ""),
    http: { request: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("@/request", () => ({ getAccessToken, http }));

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
        await CAMService.GetAllApisByServiceIdGET({ service_id: 7, category_id: 9 } as never);
        await CAMService.GetApiByIdGET({ api_id: 5, is_latest: false } as never);
        await CAMService.UpdateApiByApiDraftIdPOST({ api_draft_id: 1, req_params: '[{"name":"q"}]', resp_params: "[]" } as never);
        expect(http.request).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: "/v1/api/getAllApisByServiceId", method: "GET", params: { service_id: 7, category_id: 9 },
        }));
        expect(http.request).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: "/v1/api/getApiById", method: "GET", params: { api_id: 5, is_latest: false },
        }));
        expect(http.request).toHaveBeenLastCalledWith(expect.objectContaining({
            url: "/v1/api/updateApiByApiDraftId", method: "POST", data: expect.objectContaining({ req_params: '[{"name":"q"}]', resp_params: "[]" }),
        }));
    });
    it("uses CAM contracts for user search and AI proposal generation", async () => {
        await CAMService.GetUserByUsernameOrNicknameOrEmailGET({
            username_or_nickname_or_email: "alice",
        } as never);
        await CAMService.GenerateApiProposalPOST({
            service_iteration_id: 7,
            prompt: "Create a user API",
        } as never, { timeout: 5 * 60 * 1000 });
        expect(http.request).toHaveBeenNthCalledWith(1, expect.objectContaining({
            url: "/v1/user/getUserByUsernameOrNicknameOrEmail",
            method: "GET",
            params: { username_or_nickname_or_email: "alice" },
        }));
        expect(http.request).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: "/v1/ai/generateApiProposal",
            method: "POST",
            data: { service_iteration_id: 7, prompt: "Create a user API" },
            timeout: 5 * 60 * 1000,
        }));
    });
});
