import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { CAMService, invalidateAfterSuccessfulMutation, readOptions } = vi.hoisted(() => ({
    CAMService: {
        GetHisNewestServicesByOwnerIdGET: vi.fn(),
        DeleteServiceByIdPOST: vi.fn(),
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
vi.mock("i18next", () => ({ t: (key: string) => key }));
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
vi.mock("@/services/api", () => ({
    AddApi: vi.fn(),
    AddCategoryByServiceId: vi.fn(),
    CopyApiByApiDraftId: vi.fn(),
    DeleteApiByApiDraftId: vi.fn(),
    DeleteCategoryById: vi.fn(),
    UpdateApiByApiDraftId: vi.fn(),
    UpdateApiCategoryById: vi.fn(),
}));
vi.mock("@/services/ai", () => ({ GenerateApiProposal: vi.fn() }));
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
});
