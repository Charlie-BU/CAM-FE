import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformProvider, usePlatform, type PlatformContextValue } from "@/platform";

const value: PlatformContextValue = { user: null, accessToken: "token", apiBase: "/api/cam", locale: "zh-CN", onUnauthorized: () => undefined };

describe("PlatformContext", () => {
    it("exposes the host contract unchanged", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <PlatformProvider value={value}>{children}</PlatformProvider>;
        expect(renderHook(() => usePlatform(), { wrapper }).result.current).toBe(value);
    });
});
