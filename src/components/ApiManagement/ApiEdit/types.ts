export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type ParamType = "string" | "int" | "double" | "boolean" | "array" | "object" | "binary";
export type ParamLocation = "query" | "path" | "header" | "cookie" | "body";

export interface ApiReqParamInput {
    name: string;
    type: ParamType;
    location?: ParamLocation;
    required?: boolean;
    nullable?: boolean;
    default_value?: string | null;
    description?: string | null;
    example?: string | null;
    array_child_type?: ParamType | null;
    children?: ApiReqParamInput[];
}

export interface ApiRespParamInput {
    status_code?: number;
    name: string;
    type: ParamType;
    required?: boolean;
    nullable?: boolean;
    description?: string | null;
    example?: string | null;
    array_child_type?: ParamType | null;
    children?: ApiRespParamInput[];
}

export interface ParamItem {
    id: string;
    name: string;
    type: ParamType | string;
    required: boolean;
    nullable: boolean;
    description: string;
    default_value?: string;
    example: string;
    children?: ParamItem[];
    array_child_type?: ParamType | string;
}

export const HTTP_METHODS: HttpMethod[] = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
];

export const PARAM_TYPES: ParamType[] = [
    "string",
    "int",
    "double",
    "boolean",
    "array",
    "object",
    "binary",
];
