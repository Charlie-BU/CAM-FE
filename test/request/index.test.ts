import axios, { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, DEFAULT_API_BASE_URL, http, setApiBase, setPlatformAuth } from "@/request";

afterEach(() => {
    setPlatformAuth();
    setApiBase(DEFAULT_API_BASE_URL);
    http.defaults.adapter = undefined;
});

describe("CAM request adapter", () => {
    it("uses the current platform token and configured API base", async () => {
        setPlatformAuth(() => "token-a");
        setApiBase("/api/cam");
        http.defaults.adapter = async (config) => ({ data: { ok: true }, status: 200, statusText: "OK", headers: {}, config });
        await expect(api.get("/v1/service", { page: 1 })).resolves.toEqual({ ok: true });
        expect(http.defaults.baseURL).toBe("/api/cam");
    });

    it("turns HTTP failures into ApiError and invokes the unauthorized handler", async () => {
        const unauthorized = vi.fn();
        setPlatformAuth(() => "token", unauthorized);
        http.defaults.adapter = async (config) => {
            throw new AxiosError("Unauthorized", undefined, config, undefined, {
                data: { message: "expired" }, status: 401, statusText: "Unauthorized", headers: {}, config,
            });
        };
        await expect(api.get("/v1/me")).rejects.toBeInstanceOf(ApiError);
        expect(unauthorized).toHaveBeenCalledOnce();
    });

    it("does not retain a stale token when the provider throws", async () => {
        setPlatformAuth(() => { throw new Error("unavailable"); });
        http.defaults.adapter = async (config) => {
            expect(config.headers?.Authorization).toBeUndefined();
            return { data: null, status: 200, statusText: "OK", headers: {}, config };
        };
        await api.get("/v1/me");
    });
});
