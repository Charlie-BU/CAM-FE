import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { CAMService, invalidateAfterSuccessfulMutation, readOptions } = vi.hoisted(() => ({
    CAMService: {
        GetHisNewestServicesByOwnerIdGET: vi.fn(),
        DeleteServiceByIdPOST: vi.fn(),
        AddApiPOST: vi.fn(),
        AddCategoryByServiceIdPOST: vi.fn(),
        CopyApiByApiDraftIdPOST: vi.fn(),
        DeleteApiByApiDraftIdPOST: vi.fn(),
        DeleteCategoryByIdPOST: vi.fn(),
        UpdateApiByApiDraftIdPOST: vi.fn(),
        UpdateApiCategoryByIdPOST: vi.fn(),
        GenerateApiProposalPOST: vi.fn(),
        GetIterationByIdGET: vi.fn(),
    },
    invalidateAfterSuccessfulMutation: vi.fn(),
    readOptions: vi.fn((options) => ({ needCache: true, ...options })),
}));

vi.mock("@/services/CAMService", () => ({
    CAMService,
    invalidateAfterSuccessfulMutation,
    readOptions,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/i18n", () => ({
    default: { t: (key: string) => key },
}));
vi.mock("@cloud-materials/common", () => ({
    CModal: { openArcoForm: vi.fn() },
    Message: { success: vi.fn(), warning: vi.fn() },
    Typography: { Text: () => null, Ellipsis: () => null },
    Space: () => null,
    Popover: () => null,
}));
vi.mock("@cloud-materials/common/ve-o-iconbox", () => ({ IconAiLine: () => null }));
vi.mock("@/components/ServiceManagement/CreateServiceForm", () => ({ default: () => null }));
vi.mock("@/components/ApiManagement/ApiList/AddCategoryForm", () => ({ default: () => null }));
vi.mock("@/components/ApiManagement/ApiList/AddApiForm", () => ({ default: () => null }));
vi.mock("@/components/ApiManagement/ApiList/SmartCreateApiForm", () => ({
    default: () => null,
    SmartCreateApiTitle: () => null,
}));
vi.mock("@/components/ApiManagement/ApiList/CompleteIterationForm", () => ({ default: () => null }));
vi.mock("@/utils", () => ({ genApiMethodTag: vi.fn() }));

import { useService } from "@/hooks/useService";

const pagination = { page_size: 10, current_page: 1, total: 0 };
const cachedService = { id: 1, service_uuid: "service-001", owner_id: 1, is_deleted: false };
const updatedService = { id: 2, service_uuid: "service-002", owner_id: 1, is_deleted: false };

afterEach(() => vi.clearAllMocks());

describe("useService cache integration", () => {
    it("applies a background cache refresh to the current service list", async () => {
        let onCacheUpdated: ((data: unknown) => void) | undefined;
        vi.mocked(CAMService.GetHisNewestServicesByOwnerIdGET).mockImplementation(
            async (_request, options) => {
                onCacheUpdated = options?.onCacheUpdated;
                return { status: 200, message: "", services: [cachedService], total: 1 };
            },
        );
        const { result } = renderHook(() => useService());

        await act(async () => {
            await result.current.fetchMyNewestServices(pagination);
        });
        expect(result.current.serviceList).toEqual([cachedService]);

        act(() => onCacheUpdated?.({ status: 200, message: "", services: [updatedService], total: 1 }));
        expect(result.current.serviceList).toEqual([updatedService]);
    });

    it("waits for cache invalidation before refreshing the list after deletion", async () => {
        vi.mocked(CAMService.GetHisNewestServicesByOwnerIdGET)
            .mockResolvedValueOnce({ status: 200, message: "", services: [cachedService], total: 1 })
            .mockResolvedValueOnce({ status: 200, message: "", services: [updatedService], total: 1 });
        vi.mocked(CAMService.DeleteServiceByIdPOST).mockResolvedValue({ status: 200, message: "" });
        let resolveInvalidation: ((response: { status: number; message: string }) => void) | undefined;
        vi.mocked(invalidateAfterSuccessfulMutation).mockImplementation(
            (response) =>
                new Promise((resolve) => {
                    resolveInvalidation = () => resolve(response);
                }),
        );
        const { result } = renderHook(() => useService());

        await act(async () => {
            await result.current.fetchMyNewestServices(pagination);
        });
        const deletion = act(async () => result.current.handleDeleteService(cachedService.id));
        await waitFor(() => expect(CAMService.DeleteServiceByIdPOST).toHaveBeenCalledOnce());
        expect(CAMService.GetHisNewestServicesByOwnerIdGET).toHaveBeenCalledOnce();

        act(() => resolveInvalidation?.({ status: 200, message: "" }));
        await deletion;
        expect(CAMService.GetHisNewestServicesByOwnerIdGET).toHaveBeenCalledTimes(2);
        expect(result.current.serviceList).toEqual([updatedService]);
    });

    it("serializes draft parameters before saving and refreshes the iteration", async () => {
        vi.mocked(CAMService.GetIterationByIdGET).mockResolvedValue({
            status: 200,
            message: "",
            iteration: { api_drafts: [] },
        });
        vi.mocked(CAMService.UpdateApiByApiDraftIdPOST).mockResolvedValue({
            status: 200,
            message: "saved",
        });
        vi.mocked(invalidateAfterSuccessfulMutation).mockImplementation(async (response) => response);
        const { useServiceIteration } = await import("@/hooks/useService");
        const { result } = renderHook(() => useServiceIteration(7, []));

        await act(async () => {
            await result.current.handleSaveApiDraft({
                api_draft_id: 11,
                name: "getUser",
                method: "GET",
                path: "/users/{id}",
                description: "",
                level: "P2",
                req_params: [{ name: "id", type: "string", location: "path" }],
                resp_params: [{ status_code: 200, name: "id", type: "string" }],
            });
        });

        expect(CAMService.UpdateApiByApiDraftIdPOST).toHaveBeenCalledWith(
            expect.objectContaining({
                service_iteration_id: 7,
                api_draft_id: 11,
                req_params: '[{"name":"id","type":"string","location":"path"}]',
                resp_params: '[{"status_code":200,"name":"id","type":"string"}]',
            }),
        );
        expect(CAMService.GetIterationByIdGET).toHaveBeenCalledTimes(2);
    });
});
