import { describe, expect, it, vi } from "vitest";
import { transformAiReqParamsToFormValues, transformReqParamsToApiInput, transformRespParamsToApiInput, updateTreeItem, validateMultiTypeParamRules } from "@/components/ApiManagement/ApiEdit/utils";

describe("API parameter utilities", () => {
    it("rejects duplicate union members and inconsistent contracts", () => {
        expect(validateMultiTypeParamRules([{ name: "id", type: "string", required: true, nullable: false }, { name: "id", type: "string", required: true, nullable: false }] as never, "请求参数")).toContain("不同的参数类型");
        expect(validateMultiTypeParamRules([{ name: "id", type: "string", required: true, nullable: false }, { name: "id", type: "number", required: false, nullable: false }] as never, "请求参数")).toContain("是否必填");
    });

    it("normalizes path and nested parameters for API requests", () => {
        const result = transformReqParamsToApiInput({ path: [{ id: "1", name: "id", type: "string", required: true, nullable: true, children: [] }], query: [], header: [], cookie: [], body: [] } as never);
        expect(result).toMatchObject([{ name: "id", location: "path", nullable: false, required: true }]);
        expect(transformRespParamsToApiInput({ "201": [{ id: "2", name: "created", type: "object", required: true, children: [] }] } as never)).toMatchObject([{ status_code: 201, name: "created" }]);
    });

    it("groups AI request params by location and creates independent form ids", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.123456789);
        const result = transformAiReqParamsToFormValues([{ name: "q", type: "string", location: "query", required: false, nullable: false }] as never);
        expect(result.query).toHaveLength(1);
        expect(result.query[0]).toMatchObject({ name: "q", id: expect.any(String) });
    });
});
