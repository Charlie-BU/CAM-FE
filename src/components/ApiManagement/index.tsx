import React, { useCallback, useMemo, useState } from "react";
import styles from "./index.module.less";
import { useSearchParams } from "react-router-dom";
import { useThisService, useServiceIteration } from "@/hooks/useService";
import useApi from "@/hooks/useApi";
import Detail from "./Detail";
import Header from "./Header";
import ApiList from "./ApiList";
import ApiEdit from "./ApiEdit";
import { Layout, Spin } from "@cloud-materials/common";
import type {
    GenerateApiProposal200ResponseProposal1,
    GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem,
} from "@/cam-auto-generate/CAMService/namespaces";
import { inIterationWarning } from "@/utils";

const ApiManagement: React.FC = () => {
    const [searchParams] = useSearchParams();
    const uuid = searchParams.get("uuid") || "";
    const {
        loading,
        versions,
        currentVersion,
        isLatest,
        serviceDetail,
        apiCategories,
        treeData,
        inIteration,
        iterationId,
        setCurrentVersion,
        handleAddCategory,
        handleUpdateApiCategory,
        handleDeleteCategory,
        checkIsServiceMaintainer,
        handleAddOrRemoveServiceMaintainerById,
        handleExportOpenAPI,
        handleStartIteration,
        handleCompleteIteration,
        handleDeleteIteration,
        exitIteration,
    } = useThisService(uuid);

    const serviceUuid = useMemo(() => {
        if ("service_uuid" in serviceDetail) {
            return serviceDetail.service_uuid || "";
        }
        return "service" in serviceDetail
            ? serviceDetail.service.service_uuid
            : "";
    }, [serviceDetail]);

    const personInCharge = useMemo(() => {
        return "owner" in serviceDetail
            ? (serviceDetail.owner as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem)
            : "creator" in serviceDetail
            ? (serviceDetail.creator as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem)
            : ({} as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem);
    }, [serviceDetail]);

    // 用于控制当前 API 相关逻辑
    const [selectedApi, setSelectedApi] = useState<{
        id: number;
        isLatest: boolean;
    } | null>(null);
    const [aiPrefill, setAiPrefill] = useState<{
        apiDraftId: number;
        reqParams: GenerateApiProposal200ResponseProposal1["req_params"];
        respParams: GenerateApiProposal200ResponseProposal1["resp_params"];
    } | null>(null);

    // 迭代结束后草稿 API 已被提交为正式数据，旧草稿 ID 不可再查询。
    // 必须在切换回正式版本前清空选中项，避免 useApi 用旧 ID 请求并提示“Api not found”。
    const clearIterationSelection = useCallback(() => {
        setSelectedApi(null);
        setAiPrefill(null);
    }, []);

    // 将 API ID 与其所属数据源一起保存。正式 API 与迭代草稿使用不同表，
    // 不能在请求发起时再根据异步更新的 isLatest 推断其来源。
    const selectApi = useCallback(
        (id: number) => {
            if (id <= 0) {
                setSelectedApi(null);
                return;
            }
            setSelectedApi({ id, isLatest: inIteration ? false : isLatest });
        },
        [inIteration, isLatest],
    );

    // 从面包屑退出迭代时也复用同一套清理逻辑，避免残留草稿选择状态。
    const handleExitIteration = useCallback(() => {
        clearIterationSelection();
        exitIteration();
    }, [clearIterationSelection, exitIteration]);

    const { loading: apiLoading, apiDetail } = useApi(
        selectedApi?.id ?? -1,
        selectedApi?.isLatest ?? true,
    );

    const {
        loading: iterationLoading,
        iterationDetail,
        iterationTreeData,
        handleAddApi,
        handleSmartCreateApi,
        handleSaveApiDraft,
        handleCopyApi,
        handleDeleteApi,
    } = useServiceIteration(iterationId, apiCategories);

    // 迭代状态已切换但草稿详情尚未到达时，不能回退显示正式 API 树。
    // 否则 ApiList 的自动选中会把正式 API ID 标成草稿查询。
    const iterationReady =
        inIteration && iterationDetail?.id === iterationId;
    const activeTreeData = inIteration
        ? iterationReady
            ? iterationTreeData
            : []
        : treeData;

    const isLoading =
        loading ||
        !versions ||
        !serviceUuid ||
        !treeData ||
        treeData.length === 0;

    // 单独把loading抽离出来，为了让ApiList中Tree支持autoExpandParent
    // （autoExpandParent 仅在 Tree 第一次挂载的时候生效。如果数据是从远程获取，可以在数据获取完成后，再去渲染 Tree 组件）
    if (isLoading) {
        return (
            <div className={styles.loadingCenter}>
                <Spin dot />
            </div>
        );
    }

    return (
        <Layout className={styles.apiPage}>
            <Layout.Header>
                <Header
                    loading={loading}
                    serviceUuid={serviceUuid}
                    versions={versions}
                    isLatest={isLatest}
                    currentVersion={currentVersion}
                    personInCharge={personInCharge}
                    maintainers={
                        "maintainers" in serviceDetail
                            ? (serviceDetail.maintainers as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem[])
                            : []
                    }
                    inIteration={inIteration}
                    handlers={{
                        setCurrentVersion: (v) =>
                            inIterationWarning(
                                () => {
                                    clearIterationSelection();
                                    setCurrentVersion(v);
                                },
                                inIteration,
                                "reject"
                            ),
                        exitIteration: handleExitIteration,
                        checkIsServiceMaintainer,
                        handleAddOrRemoveServiceMaintainerById,
                        handleExportOpenAPI,
                        handleStartIteration: async () => {
                            // 旧正式 API 的 ID 不能用于草稿表查询。
                            clearIterationSelection();
                            await handleStartIteration();
                        },
                        // 提交成功时先清理草稿选择，再由 Hook 刷新正式版本数据。
                        handleCompleteIteration: () =>
                            handleCompleteIteration(clearIterationSelection),
                        handleDeleteIteration: () =>
                            handleDeleteIteration(clearIterationSelection),
                    }}
                />
            </Layout.Header>
            <Layout className={styles.apiBody}>
                {/* 左侧 API 列表 */}
                <Layout.Sider className={styles.sidebar} width={300}>
                    <ApiList
                        inIteration={inIteration}
                        isLatest={isLatest}
                        treeData={activeTreeData}
                        selectedApiId={selectedApi?.id ?? -1}
                        setSelectedApiId={selectApi}
                        handlers={{
                            handleAddApi,
                            handleSmartCreateApi: () =>
                                handleSmartCreateApi(({ apiDraftId, proposal }) => {
                                    setAiPrefill({
                                        apiDraftId,
                                        reqParams: proposal.req_params,
                                        respParams: proposal.resp_params,
                                    });
                                    selectApi(apiDraftId);
                                }),
                            handleAddCategory,
                            handleUpdateApiCategory,
                            handleDeleteCategory,
                        }}
                    />
                </Layout.Sider>
                <Layout.Content className={styles.apiContent}>
                    {inIteration ? (
                        iterationReady ? (
                        <ApiEdit
                            loading={iterationLoading || apiLoading}
                            apiDetail={apiDetail}
                            aiPrefill={aiPrefill}
                            handlers={{
                                handleSaveApiDraft,
                                handleCopyApi,
                                handleDeleteApi,
                            }}
                        />
                        ) : (
                            <div className={styles.loadingCenter}>
                                <Spin dot />
                            </div>
                        )
                    ) : (
                        <Detail loading={apiLoading} apiDetail={apiDetail} />
                    )}
                </Layout.Content>
            </Layout>
        </Layout>
    );
};

export default ApiManagement;
