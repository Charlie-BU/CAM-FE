import type {
    ApiReqParamInput,
    ApiRespParamInput,
    ParamLocation,
    ParamType,
} from "@/services/api/types";
import type { ParamItem } from "./types";

export const generateId = () => Math.random().toString(36).substring(2, 9);

type MultiTypeParam = Pick<
    ParamItem,
    | "name"
    | "type"
    | "required"
    | "nullable"
    | "description"
    | "default_value"
    | "example"
    | "array_child_type"
> & {
    children_params?: MultiTypeParam[];
    children?: MultiTypeParam[];
};

const hasValue = (value: unknown) =>
    value !== undefined &&
    value !== null &&
    (typeof value !== "string" || value.trim() !== "");

const hasConflictingValue = (
    params: MultiTypeParam[],
    field: "description" | "default_value" | "example"
) => {
    const values = params
        .map((param) => param[field])
        .filter(hasValue)
        .map(String);
    return new Set(values).size > 1;
};

const getTypeKey = (param: MultiTypeParam) =>
    param.type === "array"
        ? `array:${param.array_child_type ?? ""}`
        : param.type;

/**
 * 同名参数会被代码生成器转换为 TypeScript 联合类型；除类型外的契约必须保持一致。
 */
export const validateMultiTypeParamRules = (
    params: MultiTypeParam[],
    scope: string
): string | null => {
    const paramsByName = new Map<string, MultiTypeParam[]>();
    const paramList = Array.isArray(params) ? params : [];
    paramList.forEach((param) => {
        if (!param.name) return;
        const sameNameParams = paramsByName.get(param.name) || [];
        sameNameParams.push(param);
        paramsByName.set(param.name, sameNameParams);
    });

    for (const [name, sameNameParams] of paramsByName) {
        if (sameNameParams.length > 1) {
            const types = sameNameParams.map(getTypeKey);
            if (new Set(types).size !== types.length) {
                return `${scope}中同名参数「${name}」必须使用不同的参数类型`;
            }
            const first = sameNameParams[0];
            if (
                sameNameParams.some(
                    (param) =>
                        param.required !== first.required ||
                        param.nullable !== first.nullable
                )
            ) {
                return `${scope}中同名参数「${name}」的是否必填和可为 null 必须一致`;
            }
            if (
                hasConflictingValue(sameNameParams, "description") ||
                hasConflictingValue(sameNameParams, "default_value") ||
                hasConflictingValue(sameNameParams, "example")
            ) {
                return `${scope}中同名参数「${name}」的描述、默认值和示例值只能相同或仅一项有值`;
            }
        }

        for (const param of sameNameParams) {
            const children = Array.isArray(param.children_params)
                ? param.children_params
                : Array.isArray(param.children)
                  ? param.children
                  : [];
            const childError = validateMultiTypeParamRules(
                children,
                `${scope}的「${name}」子参数`
            );
            if (childError) return childError;
        }
    }

    return null;
};

export const transformReqParamsToApiInput = (
    requestParams: Record<ParamLocation, ParamItem[]>
): ApiReqParamInput[] => {
    const req_params: ApiReqParamInput[] = [];
    if (!requestParams) return req_params;

    Object.entries(requestParams).forEach(([key, items]) => {
        const location = key as ParamLocation;
        if (Array.isArray(items)) {
            req_params.push(...processReqItems(items, location));
        }
    });
    return req_params;
};

const processReqItems = (
    list: ParamItem[],
    location: ParamLocation
): ApiReqParamInput[] => {
    return list.map((item) => ({
        name: item.name,
        type: item.type as ParamType,
        location: location,
        required: item.required,
        nullable: location === "path" ? false : (item.nullable ?? false),
        default_value: item.default_value || null,
        description: item.description,
        example: item.example,
        array_child_type: (item.array_child_type as ParamType) || null,
        children:
            item.children || (item as any).children_params
                ? processReqItems(
                      item.children || (item as any).children_params,
                      location
                  )
                : undefined,
    }));
};

export const transformRespParamsToApiInput = (
    responseParams: Record<string, ParamItem[]>
): ApiRespParamInput[] => {
    const resp_params: ApiRespParamInput[] = [];
    if (!responseParams) return resp_params;

    Object.entries(responseParams).forEach(([key, items]) => {
        const statusCode = parseInt(key, 10);
        if (Array.isArray(items)) {
            resp_params.push(...processRespItems(items, statusCode));
        }
    });
    return resp_params;
};

type FormParamItem = ParamItem & { children_params?: FormParamItem[] };

const transformReqParamToFormItem = (
    param: ApiReqParamInput,
): FormParamItem => ({
    id: generateId(),
    name: param.name,
    type: param.type,
    required: param.required ?? false,
    nullable: param.nullable ?? false,
    default_value: param.default_value ?? "",
    description: param.description ?? "",
    example: param.example ?? "",
    array_child_type: param.array_child_type ?? undefined,
    children_params: param.children?.map(transformReqParamToFormItem),
});

const transformRespParamToFormItem = (
    param: ApiRespParamInput,
): FormParamItem => ({
    id: generateId(),
    name: param.name,
    type: param.type,
    required: param.required ?? false,
    nullable: param.nullable ?? false,
    description: param.description ?? "",
    example: param.example ?? "",
    array_child_type: param.array_child_type ?? undefined,
    children_params: param.children?.map(transformRespParamToFormItem),
});

export const transformAiReqParamsToFormValues = (
    params: ApiReqParamInput[],
): Record<ParamLocation, FormParamItem[]> => {
    const result: Record<ParamLocation, FormParamItem[]> = {
        query: [],
        path: [],
        header: [],
        cookie: [],
        body: [],
    };
    params.forEach((param) => {
        const location = param.location;
        if (location) {
            result[location].push(transformReqParamToFormItem(param));
        }
    });
    return result;
};

export const transformAiRespParamsToFormValues = (
    params: ApiRespParamInput[],
): Record<string, FormParamItem[]> => {
    return params.reduce<Record<string, FormParamItem[]>>((result, param) => {
        const statusCode = String(param.status_code ?? 200);
        result[statusCode] ||= [];
        result[statusCode].push(transformRespParamToFormItem(param));
        return result;
    }, {});
};

const processRespItems = (
    list: ParamItem[],
    statusCode: number
): ApiRespParamInput[] => {
    return list.map((item) => ({
        name: item.name,
        type: item.type as ParamType,
        status_code: statusCode,
        required: item.required,
        nullable: item.nullable ?? false,
        description: item.description,
        example: item.example,
        array_child_type: (item.array_child_type as ParamType) || null,
        children:
            item.children || (item as any).children_params
                ? processRespItems(
                      item.children || (item as any).children_params,
                      statusCode
                  )
                : undefined,
    }));
};

// Tree manipulation utilities for ParamsTable
export const updateTreeItem = (
    list: ParamItem[],
    id: string,
    field: keyof ParamItem,
    val: any
): ParamItem[] => {
    return list.map((item) => {
        if (item.id === id) {
            return { ...item, [field]: val };
        }
        if (item.children) {
            return {
                ...item,
                children: updateTreeItem(item.children, id, field, val),
            };
        }
        return item;
    });
};

export const addTreeItem = (
    list: ParamItem[],
    parentId?: string
): ParamItem[] => {
    const newItem: ParamItem = {
        id: generateId(),
        name: "",
        type: "string",
        required: true,
        nullable: false,
        description: "",
        default_value: "",
        example: "",
    };

    if (!parentId) {
        return [...list, newItem];
    }

    const addChildren = (items: ParamItem[]): ParamItem[] => {
        return items.map((item) => {
            if (item.id === parentId) {
                return {
                    ...item,
                    children: [...(item.children || []), newItem],
                };
            }
            if (item.children) {
                return {
                    ...item,
                    children: addChildren(item.children),
                };
            }
            return item;
        });
    };
    return addChildren(list);
};

export const deleteTreeItem = (list: ParamItem[], id: string): ParamItem[] => {
    return list.filter((item) => {
        if (item.id === id) return false;
        if (item.children) {
            item.children = deleteTreeItem(item.children, id);
        }
        return true;
    });
};
