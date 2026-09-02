import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@cloud-materials/common", () => ({
    Message: { warning: vi.fn() },
    CModal: { openArcoForm: vi.fn() },
    Divider: () => null,
    Tabs: Object.assign(() => null, { TabPane: () => null }),
    Typography: { Title: () => null },
    Button: () => null,
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/useService", () => ({ useService: vi.fn() }));
vi.mock("@/components/ServiceManagement/ServiceList", () => ({ default: () => null }));
vi.mock("@/components/ServiceManagement/UserSelect", () => ({ default: () => null }));
vi.mock("@/components/ServiceManagement/WelcomeView", () => ({
    WelcomeLoggedIn: () => null,
}));

import {
    getStoredServiceRange,
    getServiceRangeStorageKey,
    storeServiceRange,
} from "@/components/ServiceManagement/LoggedInView";

const admin = { id: 1, level: 0 } as never;
const member = { id: 2, level: 1 } as never;

afterEach(() => window.sessionStorage.clear());

describe("service range persistence", () => {
    it("isolates persisted ranges by user ID", () => {
        storeServiceRange("MyDeletedServices", admin);

        expect(window.sessionStorage.getItem(getServiceRangeStorageKey(1))).toBe(
            "MyDeletedServices",
        );
        expect(getStoredServiceRange(member)).toBe("MyServices");
    });

    it("restores AllServices only for an administrator", () => {
        window.sessionStorage.setItem(getServiceRangeStorageKey(1), "AllServices");
        window.sessionStorage.setItem(getServiceRangeStorageKey(2), "AllServices");

        expect(getStoredServiceRange(admin)).toBe("AllServices");
        expect(getStoredServiceRange(member)).toBe("MyServices");
    });

    it("does not persist AllServices for a non-administrator", () => {
        storeServiceRange("AllServices", member);

        expect(window.sessionStorage.getItem(getServiceRangeStorageKey(2))).toBeNull();
    });
});
