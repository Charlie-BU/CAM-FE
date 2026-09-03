import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Space,
    Typography,
    Divider,
    Form,
    Message,
    Spin,
} from "@cloud-materials/common";
import sharedStyles from "../index.module.less";
import BriefInfoEdit from "./BriefInfoEdit";
import {
    transformReqParamsToApiInput,
    transformRespParamsToApiInput,
    transformAiReqParamsToFormValues,
    transformAiRespParamsToFormValues,
    validateMultiTypeParamRules,
} from "./utils";
import type {
    ApiReqParamInput,
    ApiRespParamInput,
    ParamLocation,
} from "./types";
import type {
    GenerateApiProposal200ResponseProposal1,
    GetApiById200ResponseApi,
    UpdateApiByApiDraftId200Response,
} from "@/cam-auto-generate/CAMService/namespaces";
import RequestParamsEdit from "./RequestParamsEdit";
import ResponseParamsEdit from "./ResponseParamsEdit";
import { handleConfirm } from "@/utils";
import BlankPage from "@/components/BlankPage";
import { useTranslation } from "react-i18next";

// 把请求参数tabs相关逻辑提到本层，便于根据apiDetail处理首个activeTab
export const tabKeys = ["query", "path", "body", "header", "cookie"] as const;

interface ApiEditHandlers {
    handleSaveApiDraft: (
        data: {
            api_draft_id: number;
            name: string;
            method: string;
            path: string;
            description: string;
            level: string;
            req_params: ApiReqParamInput[];
            resp_params: ApiRespParamInput[];
        }
    ) => Promise<UpdateApiByApiDraftId200Response>;
    handleCopyApi: (apiDraftId: number) => Promise<void>;
    handleDeleteApi: (apiDraftId: number) => Promise<void>;
}

interface ApiEditProps {
    loading: boolean;
    apiDetail: GetApiById200ResponseApi;
    aiPrefill?: {
        apiDraftId: number;
        reqParams: GenerateApiProposal200ResponseProposal1["req_params"];
        respParams: GenerateApiProposal200ResponseProposal1["resp_params"];
    } | null;
    handlers: ApiEditHandlers;
}

const ApiEdit: React.FC<ApiEditProps> = ({
    loading,
    apiDetail,
    aiPrefill,
    handlers: { handleSaveApiDraft, handleCopyApi, handleDeleteApi },
}) => {
    const { t } = useTranslation();
    const tabs = tabKeys.map((key) => ({ key, title: t(`api.parameterLocations.${key}`) }));
    const [form] = Form.useForm();
    const [editLoading, setEditLoading] = useState(false);
    const [isDraft, setIsDraft] = useState(false);
    const [reqParamsActiveTab, setReqParamsActiveTab] = useState("query");
    const [rejectSubmit, setRejectSubmit] = useState(false); // 是否由于表单填写不全拒绝提交
    const appliedAiPrefillIdRef = useRef<number | null>(null);

    const getFirstTabWithValue = () => {
        if (!apiDetail.request_params_by_location) {
            return "query";
        }
        for (const tab of tabs) {
            if (
                apiDetail.request_params_by_location[tab.key as ParamLocation]
                    .length > 0
            ) {
                return tab.key;
            }
        }
        return "query";
    };

    useEffect(() => {
        form.setFieldsValue(apiDetail);
        setIsDraft(false);
        setReqParamsActiveTab(getFirstTabWithValue());
    }, [apiDetail, form]);

    useEffect(() => {
        if (
            !aiPrefill ||
            apiDetail.id !== aiPrefill.apiDraftId ||
            appliedAiPrefillIdRef.current === aiPrefill.apiDraftId
        ) {
            return;
        }
        const requestParamsByLocation = transformAiReqParamsToFormValues(
            aiPrefill.reqParams,
        );
        const responseParamsByStatusCode = transformAiRespParamsToFormValues(
            aiPrefill.respParams,
        );
        form.setFieldsValue({
            ...apiDetail,
            request_params_by_location: requestParamsByLocation,
            response_params_by_status_code: responseParamsByStatusCode,
        });
        const firstActiveTab = tabs.find(
            (tab) => requestParamsByLocation[tab.key as ParamLocation].length,
        );
        setReqParamsActiveTab(firstActiveTab?.key || "query");
        setIsDraft(true);
        appliedAiPrefillIdRef.current = aiPrefill.apiDraftId;
    }, [aiPrefill, apiDetail, form]);

    // 提交本次apiDraft改动
    const handleSubmit = async () => {
        if (rejectSubmit) {
            return;
        }
        const values = await form.validate();
        setEditLoading(true);

        try {
            const req_params: ApiReqParamInput[] = transformReqParamsToApiInput(
                values.request_params_by_location
            );
            // 检查是否有请求参数name为空
            if (req_params.some((param) => !param.name)) {
                Message.warning(t("api.emptyRequestParameterName"));
                setEditLoading(false);
                return;
            }
            for (const tab of tabs) {
                const error = validateMultiTypeParamRules(
                    values.request_params_by_location?.[
                    tab.key as ParamLocation
                    ] || [],
                    tab.title
                );
                if (error) {
                    Message.warning(error);
                    setEditLoading(false);
                    return;
                }
            }
            // 检查是否有Path参数
            const hasPathParams = req_params.some(
                (param) => param.location === "path"
            );
            if (hasPathParams) {
                // 检查apiPath是否包含{param}
                const apiPath = values.path;
                const allPathParams = req_params.filter(
                    (param) => param.location === "path"
                );
                // path参数不能为选填
                if (allPathParams.some((param) => param.required === false)) {
                    Message.warning(t("api.pathParameterRequired"));
                    setEditLoading(false);
                    return;
                }
                const allPathParamsShouldInPath = allPathParams.map(
                    (param) => `{${param.name}}`
                );

                if (
                    !allPathParamsShouldInPath.every((param) =>
                        apiPath.includes(param)
                    )
                ) {
                    Message.warning(
                        t("api.pathParameterInPath")
                    );
                    setEditLoading(false);
                    return;
                }
            }
            const resp_params: ApiRespParamInput[] = transformRespParamsToApiInput(
                values.response_params_by_status_code
            );
            // 检查是否有响应参数name为空
            if (resp_params.some((param) => !param.name)) {
                Message.warning(t("api.emptyResponseParameterName"));
                setEditLoading(false);
                return;
            }
            for (const [statusCode, params] of Object.entries(
                values.response_params_by_status_code || {}
            )) {
                const error = validateMultiTypeParamRules(
                    params as any[],
                    t("api.responseParametersForStatus", { statusCode })
                );
                if (error) {
                    Message.warning(error);
                    setEditLoading(false);
                    return;
                }
            }

            const data =
            {
                api_draft_id: apiDetail.id,
                name: values.name,
                method: values.method,
                path: values.path,
                description: values.description,
                level: values.level || "P2",
                req_params,
                resp_params,
            };
            try {
                const res = await handleSaveApiDraft(data);
                setIsDraft(false);
                Message.success(res.message || t("api.saveSuccess"));
            } catch (error) {
                const msg = error instanceof Error ? error.message : t("api.saveFailure");
                Message.error(msg);
            }
        } finally {
            setEditLoading(false);
        }
    };

    if (!apiDetail || Object.keys(apiDetail).length === 0) {
        return <BlankPage message={t("api.emptyCreateHint")} />;
    }

    return (
        <div className={sharedStyles.content}>
            <Spin size={40} loading={loading}>
                <div className={sharedStyles.header}>
                    <Typography.Title heading={5}>
                        {t("iteration.title")}
                    </Typography.Title>
                    <Space>
                        <Button
                            type="default"
                            status="success"
                            onClick={handleSubmit}
                            loading={editLoading}
                            disabled={!isDraft || rejectSubmit}
                        >
                            {isDraft ? t("api.save") : t("api.saved")}
                        </Button>
                        <Button
                            type="default"
                            status="default"
                            onClick={() => handleCopyApi(apiDetail.id)}
                        >
                            {t("api.copy")}
                        </Button>
                        <Button
                            type="default"
                            status="danger"
                            onClick={() =>
                                handleConfirm(
                                    () => handleDeleteApi(apiDetail.id),
                                    t("common.delete"),
                                    t("api.deleteConfirm")
                                )
                            }
                        >
                            {t("api.delete")}
                        </Button>
                    </Space>
                </div>
                <Form
                    form={form}
                    layout="vertical"
                    scrollToFirstError
                    initialValues={apiDetail}
                    onValuesChange={() => {
                        setIsDraft(true);
                    }}
                >
                    <BriefInfoEdit />
                    <Divider />
                    <RequestParamsEdit
                        reqParamsActiveTab={reqParamsActiveTab}
                        setReqParamsActiveTab={setReqParamsActiveTab}
                        setRejectSubmit={setRejectSubmit}
                    />
                    <Divider />
                    <ResponseParamsEdit setRejectSubmit={setRejectSubmit} />
                </Form>
            </Spin>
        </div>
    );
};

export default ApiEdit;
