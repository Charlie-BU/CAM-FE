import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CModal,
    Message,
    Typography,
    Space,
    Popover,
} from "@cloud-materials/common";
import i18n from "@/i18n";

import type {
    GetAllDeletedServicesByUserId200Response,
    GetAllDeletedServicesByUserId200ResponseDeleted_servicesItem,
    GetAllServices200Response,
    GetAllServices200ResponseServicesItem,
    GetAllVersionsByUuid200Response,
    GetHisMaintainedServicesByUserId200Response,
    GetHisMaintainedServicesByUserId200ResponseServicesItem,
    GetHisNewestServicesByOwnerId200Response,
    GetHisNewestServicesByOwnerId200ResponseServicesItem,
    GetIterationById200ResponseIteration,
    GenerateApiProposal200ResponseProposal1,
    GetServiceByUuidAndVersion200Response,
    GetServiceByUuidAndVersion200ResponseService,
    GetServiceByUuidAndVersion200ResponseServiceApi_categoriesItem,
    GetServiceByUuidAndVersion200ResponseServiceApisItem,
    GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem,
    UpdateApiByApiDraftId200Response,
} from "@/cam-auto-generate/CAMService/namespaces";
import {
    CAMService,
    invalidateAfterSuccessfulMutation,
    readOptions,
} from "@/services/CAMService";
import CreateServiceForm from "@/components/ServiceManagement/CreateServiceForm";
import { genApiMethodTag } from "@/utils";
import AddCategoryForm from "@/components/ApiManagement/ApiList/AddCategoryForm";
import AddApiForm from "@/components/ApiManagement/ApiList/AddApiForm";
import SmartCreateApiForm, {
    SmartCreateApiTitle,
} from "@/components/ApiManagement/ApiList/SmartCreateApiForm";
import { IconAiLine } from "@cloud-materials/common/ve-o-iconbox";

import CompleteIterationForm from "@/components/ApiManagement/ApiList/CompleteIterationForm";
import type { ApiReqParamInput, ApiRespParamInput } from "@/components/ApiManagement/ApiEdit/types";

const { Text, Ellipsis } = Typography;
const t = i18n.t.bind(i18n);

/** Pagination：服务列表分页状态。 */
export type Pagination = { page_size: number; current_page: number; total: number };
/** ServiceRange：服务列表筛选范围。 */
export type ServiceRange =
    | "MyServices"
    | "MyMaintainedServices"
    | "HisServices"
    | "AllServices"
    | "MyDeletedServices";
/** ServiceListItem：服务列表接口的统一项目类型。 */
export type ServiceListItem =
    | GetAllServices200ResponseServicesItem
    | GetHisMaintainedServicesByUserId200ResponseServicesItem
    | GetHisNewestServicesByOwnerId200ResponseServicesItem
    | GetAllDeletedServicesByUserId200ResponseDeleted_servicesItem;

// 服务列表 hook
export const useService = () => {
    const navigate = useNavigate();

    const [serviceList, setServiceList] = useState<ServiceListItem[]>([]);
    const [loading, setLoading] = useState(false);
    // 记录最近一次触发的获取服务操作，用于在删除、还原或新增服务后刷新列表
    const refetchRef = useRef<(() => Promise<number>) | null>(null);
    const listRequestIdRef = useRef(0);

    const fetchMyNewestServices = useCallback(
        async (pagination: Pagination) => {
            // 记录最近一次触发的获取服务操作，用于在删除或还原服务后刷新列表
            refetchRef.current = () => fetchMyNewestServices(pagination);

            setLoading(true);
            const requestId = ++listRequestIdRef.current;
            const res = await CAMService.GetHisNewestServicesByOwnerIdGET({
                is_my_services: true,
                page_size: pagination.page_size,
                current_page: pagination.current_page,
            } as never, readOptions({
                onCacheUpdated: (updatedResponse) => {
                    const latest = updatedResponse as GetHisNewestServicesByOwnerId200Response;
                    if (listRequestIdRef.current === requestId && latest.status === 200) {
                        setServiceList(latest.services || []);
                    }
                },
            }));
            if (res.status !== 200) {
                // 在这里不直接通过Message提示用户的原因是，在组件层一并捕获非200未成功和请求失败错误，一并处理
                setLoading(false);
                setServiceList([]);
                throw new Error(res.message || t("service.fetchFailure"));
            }
            setServiceList(res.services || []);
            setLoading(false);
            // 返回服务总数，用于分页
            return res.total || 0;
        },
        [],
    );

    const fetchMyMaintainedServices = useCallback(
        async (pagination: Pagination) => {
            // 记录最近一次触发的获取服务操作，用于在删除或还原服务后刷新列表
            refetchRef.current = () => fetchMyMaintainedServices(pagination);

            setLoading(true);
            const requestId = ++listRequestIdRef.current;
            const res = await CAMService.GetHisMaintainedServicesByUserIdGET({
                page_size: pagination.page_size,
                current_page: pagination.current_page,
            } as never, readOptions({
                onCacheUpdated: (updatedResponse) => {
                    const latest = updatedResponse as GetHisMaintainedServicesByUserId200Response;
                    if (listRequestIdRef.current === requestId && latest.status === 200) {
                        setServiceList(latest.services || []);
                    }
                },
            }));
            if (res.status !== 200) {
                setLoading(false);
                setServiceList([]);
                throw new Error(res.message || t("service.fetchFailure"));
            }
            setServiceList(res.services || []);
            setLoading(false);
            return res.total || 0;
        },
        [],
    );

    const fetchHisNewestServicesByOwnerId = useCallback(
        async (ownerId: number, pagination: Pagination) => {
            // 记录最近一次触发的获取服务操作，用于在删除或还原服务后刷新列表
            refetchRef.current = () =>
                fetchHisNewestServicesByOwnerId(ownerId, pagination);

            setLoading(true);
            const requestId = ++listRequestIdRef.current;
            const res = await CAMService.GetHisNewestServicesByOwnerIdGET({
                is_my_services: false,
                owner_id: ownerId,
                page_size: pagination.page_size,
                current_page: pagination.current_page,
            } as never, readOptions({
                onCacheUpdated: (updatedResponse) => {
                    const latest = updatedResponse as GetHisNewestServicesByOwnerId200Response;
                    if (listRequestIdRef.current === requestId && latest.status === 200) {
                        setServiceList(latest.services || []);
                    }
                },
            }));
            if (res.status !== 200) {
                setLoading(false);
                setServiceList([]);
                throw new Error(res.message || t("service.fetchFailure"));
            }
            setServiceList(res.services || []);
            setLoading(false);
            return res.total || 0;
        },
        [],
    );

    const fetchMyDeletedServices = useCallback(
        async (pagination: Pagination) => {
            // 记录最近一次触发的获取服务操作，用于在删除或还原服务后刷新列表
            refetchRef.current = () => fetchMyDeletedServices(pagination);

            setLoading(true);
            const requestId = ++listRequestIdRef.current;
            const res = await CAMService.GetAllDeletedServicesByUserIdGET({
                page_size: pagination.page_size,
                current_page: pagination.current_page,
            } as never, readOptions({
                onCacheUpdated: (updatedResponse) => {
                    const latest = updatedResponse as GetAllDeletedServicesByUserId200Response;
                    if (listRequestIdRef.current === requestId && latest.status === 200) {
                        setServiceList(latest.deleted_services || []);
                    }
                },
            }));
            if (res.status !== 200) {
                setLoading(false);
                setServiceList([]);
                throw new Error(res.message || t("service.fetchFailure"));
            }
            setServiceList(res.deleted_services || []);
            setLoading(false);
            return res.total || 0;
        },
        [],
    );

    const fetchAllServices = useCallback(async (pagination: Pagination) => {
        // 记录最近一次触发的获取服务操作，用于在删除或还原服务后刷新列表
        refetchRef.current = () => fetchAllServices(pagination);

        setLoading(true);
        const requestId = ++listRequestIdRef.current;
        const res = await CAMService.GetAllServicesGET({
            page_size: pagination.page_size,
            current_page: pagination.current_page,
        } as never, readOptions({
            onCacheUpdated: (updatedResponse) => {
                const latest = updatedResponse as GetAllServices200Response;
                if (listRequestIdRef.current === requestId && latest.status === 200) {
                    setServiceList(latest.services || []);
                }
            },
        }));
        if (res.status !== 200) {
            setLoading(false);
            setServiceList([]);
            throw new Error(res.message || t("service.fetchFailure"));
        }
        setServiceList(res.services || []);
        setLoading(false);
        return res.total || 0;
    }, []);

    const createNewService = useCallback(
        async (formData: { service_uuid: string; description: string }) => {
            const res = await invalidateAfterSuccessfulMutation(
                await CAMService.CreateNewServicePOST(formData as never),
            );
            if (res.status !== 200) {
                throw new Error(res.message || t("service.createFailure"));
            }
            return res;
        },
        [],
    );

    const handleViewService = useCallback(
        (service_uuid: string) => {
            navigate(`/cam/service?uuid=${service_uuid}`);
        },
        [navigate],
    );

    const handleDeleteService = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const res = await invalidateAfterSuccessfulMutation(
                await CAMService.DeleteServiceByIdPOST({ id } as never),
            );
            if (res.status !== 200) {
                setLoading(false);
                throw new Error(res.message || t("service.deleteFailure"));
            }
            Message.success(t("service.deleteSuccess"));
            // 刷新服务列表
            await refetchRef.current?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            Message.warning(msg || t("service.deleteFailure"));
        }
        setLoading(false);
    }, []);

    const handleRestoreService = useCallback(async (id: number) => {
        setLoading(true);
        const res = await invalidateAfterSuccessfulMutation(
            await CAMService.RestoreServiceByIdPOST({ id } as never),
        );
        if (res.status !== 200) {
            setLoading(false);
            throw new Error(res.message || t("service.restoreFailure"));
        }
        Message.success(t("service.restoreSuccess"));
        // 刷新服务列表
        try {
            await refetchRef.current?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            Message.warning(msg || t("service.fetchFailure"));
        }
        setLoading(false);
    }, []);

    const handlePermanentDeleteService = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const res = await invalidateAfterSuccessfulMutation(
                await CAMService.DeleteServicePermanentlyByIdPOST({ id } as never),
            );
            if (res.status !== 200) {
                setLoading(false);
                throw new Error(res.message || t("service.deleteFailure"));
            }
            Message.success(t("service.deleteSuccess"));
            // 刷新服务列表
            await refetchRef.current?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            Message.warning(msg || t("service.deleteFailure"));
        }
        setLoading(false);
    }, []);

    const handleCreateService = useCallback(
        (owner?: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem) => {
            const modal = CModal.openArcoForm({
                title: t("service.create"),
                content: <CreateServiceForm owner={owner} />,
                cancelText: t("common.cancel"),
                okText: t("service.submit"),
                onOk: async (values, form) => {
                    try {
                        await form.validate();
                        const res = await createNewService({
                            service_uuid: values.service_uuid,
                            description: values.description,
                        });
                        if (res.status !== 200) {
                            throw new Error(res.message || t("service.createFailure"));
                        }
                        Message.success(res.message || t("service.createSuccess"));
                        // 显式关闭弹窗，避免依赖隐式行为
                        modal.close();
                        // 刷新服务列表
                        try {
                            await refetchRef.current?.();
                        } catch (err) {
                            const msg =
                                err instanceof Error
                                    ? err.message
                                    : t("service.fetchFailure");
                            Message.warning(msg || t("service.fetchFailure"));
                        }
                    } catch (err: unknown) {
                        const msg =
                            err instanceof Error ? err.message : t("service.createFailure");
                        Message.warning(msg);
                        // 抛出错误以阻止弹窗自动关闭（库内有相关处理）
                        throw err;
                    }
                },
            });
        },
        [createNewService],
    );

    return {
        serviceList,
        loading,
        fetchMyNewestServices,
        fetchMyMaintainedServices,
        fetchHisNewestServicesByOwnerId,
        fetchMyDeletedServices,
        fetchAllServices,
        createNewService,
        handleViewService,
        handleDeleteService,
        handleRestoreService,
        handlePermanentDeleteService,
        handleCreateService,
    };
};

// 某个服务hook
export const useThisService = (service_uuid: string) => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState<
        {
            version: string;
            is_latest: boolean;
        }[]
    >([]);
    const [currentVersion, setCurrentVersion] = useState<string>("");
    const [isLatest, setIsLatest] = useState<boolean>(true);
    const [serviceDetail, setServiceDetail] = useState<
        | GetServiceByUuidAndVersion200ResponseService
        | GetIterationById200ResponseIteration
    >({} as GetServiceByUuidAndVersion200ResponseService);
    const [apiCategories, setApiCategories] = useState<
        GetServiceByUuidAndVersion200ResponseServiceApi_categoriesItem[]
    >([]);
    const [apis, setApis] = useState<
        GetServiceByUuidAndVersion200ResponseServiceApisItem[]
    >([]);

    const fetchAllVersions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await CAMService.GetAllVersionsByUuidGET({
                service_uuid,
            } as never, readOptions({
                onCacheUpdated: (updatedResponse) => {
                    const latest = updatedResponse as GetAllVersionsByUuid200Response;
                    if (latest.status !== 200) return;
                    const latestVersions = latest.versions.filter(
                        (version): version is typeof version & { version: string } =>
                            Boolean(version.version),
                    );
                    setVersions(latestVersions);
                    setCurrentVersion(latest.versions[0]?.version || "");
                    setIsLatest(latest.versions[0]?.is_latest || false);
                },
            }));
            if (res.status !== 200) {
                setLoading(false);
                setVersions([]);
                throw new Error(res.message || t("service.fetchVersionsFailure"));
            }
            setVersions(
                res.versions.filter(
                    (version): version is typeof version & { version: string } =>
                        Boolean(version.version),
                ),
            ); // 筛选掉正在迭代的，没有版本号的service_iteration
            setCurrentVersion(res.versions?.[0]?.version || "");
            setIsLatest(res.versions?.[0]?.is_latest || false);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : t("service.failure");
            Message.warning(msg || t("service.fetchVersionsFailure"));
            navigate("/cam");
        } finally {
            setLoading(false);
        }
    }, [service_uuid, navigate]);

    useEffect(() => {
        fetchAllVersions();
    }, [fetchAllVersions]);

    const fetchServiceDetail = useCallback(
        async (version: string) => {
            setLoading(true);
            try {
                const res = await CAMService.GetServiceByUuidAndVersionGET({
                    service_uuid,
                    version,
                } as never, readOptions({
                    onCacheUpdated: (updatedResponse) => {
                        const latest = updatedResponse as GetServiceByUuidAndVersion200Response;
                        if (latest.status !== 200) return;
                        setServiceDetail(latest.service || {});
                        setIsLatest(latest.is_latest);
                        if ("api_categories" in latest.service) {
                            setApiCategories(latest.service.api_categories || []);
                        }
                        if ("apis" in latest.service || "api_drafts" in latest.service) {
                            setApis(
                                ("apis" in latest.service
                                    ? latest.service.apis
                                    : "api_drafts" in latest.service
                                      ? latest.service.api_drafts
                                      : []) || [],
                            );
                        }
                    },
                }));
                if (res.status !== 200) {
                    setServiceDetail({} as GetServiceByUuidAndVersion200ResponseService);
                    throw new Error(res.message || t("service.fetchDetailFailure"));
                }
                setServiceDetail(res.service || {});
                setIsLatest(res.is_latest);
                if ("api_categories" in res.service) {
                    setApiCategories(res.service.api_categories || []);
                }
                if ("apis" in res.service || "api_drafts" in res.service) {
                    setApis(
                        ("apis" in res.service
                            ? res.service.apis
                            : "api_drafts" in res.service
                              ? res.service.api_drafts
                              : []) || [],
                    );
                }
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : t("service.fetchDetailFailure");
                Message.warning(msg || t("service.fetchDetailFailure"));
            } finally {
                setLoading(false);
            }
        },
        [service_uuid],
    );

    useEffect(() => {
        if (currentVersion) {
            fetchServiceDetail(currentVersion);
        }
    }, [currentVersion, fetchServiceDetail]);

    const treeData = useMemo(() => {
        if (!apiCategories || !apis) {
            return [] as any[];
        }
        const categoryMap = new Map<number, any>();
        apiCategories.forEach((cat) => {
            categoryMap.set(cat.id, {
                key: `category-${cat.id}`,
                title: (
                    <Popover content={cat.description}>
                        <Text>{cat.name}</Text>
                    </Popover>
                ),
                children: [] as any[],
                selectable: false,
                draggable: false,
            });
        });
        const uncategorizedGroup = {
            key: "category-null",
            title: <Text>{t("api.uncategorized")}</Text>,
            children: [] as any[],
            selectable: false,
            draggable: false,
        };

        apis.sort((a, b) => a.method.localeCompare(b.method)).forEach((api) => {
            const node = {
                key: api.id.toString(),
                title: (
                    <Space style={{ fontWeight: 500 }}>
                        {genApiMethodTag(api.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH", "small")}
                        {api.name}
                        <Ellipsis
                            style={{
                                color: "#6e7687",
                                fontSize: 10,
                            }}
                            rows={1}
                            showTooltip
                        >
                            {api.path}
                        </Ellipsis>
                    </Space>
                ),
                style: {
                    maxWidth: "100%",
                    overflow: "auto",
                    scrollbarWidth: "none",
                },
            };
            if (api.category_id == null) {
                uncategorizedGroup.children.push(node);
            } else {
                const group = categoryMap.get(api.category_id);
                if (group) {
                    group.children.push(node);
                } else {
                    uncategorizedGroup.children.push(node);
                }
            }
        });

        return [...Array.from(categoryMap.values()), uncategorizedGroup];
    }, [apiCategories, apis]);

    const handleAddCategory = useCallback(() => {
        const modal = CModal.openArcoForm({
            title: t("api.addCategory"),
            content: <AddCategoryForm />,
            cancelText: t("common.cancel"),
            okText: t("common.confirm"),
            onOk: async (values, form) => {
                try {
                    await form.validate();
                    const res = await CAMService.AddCategoryByServiceIdPOST({
                        service_id: serviceDetail.id,
                        category_name: values.category_name,
                        description: values.description,
                    } as never);
                    if (res.status !== 200) {
                        throw new Error(res.message || t("api.categoryCreateFailure"));
                    }
                    await invalidateAfterSuccessfulMutation(res);
                    Message.success(res.message || t("api.categoryCreateSuccess"));
                    // 显式关闭弹窗，避免依赖隐式行为
                    modal.close();
                    setApiCategories((prev) => [
                        ...prev,
                        { ...res.category, service_id: serviceDetail.id },
                    ]);
                } catch (err: unknown) {
                    const msg =
                        err instanceof Error ? err.message : t("api.categoryCreateFailure");
                    Message.warning(msg);
                    // 抛出错误以阻止弹窗自动关闭（库内有相关处理）
                    throw err;
                }
            },
        });
    }, [serviceDetail.id, currentVersion, fetchServiceDetail]);

    const handleUpdateApiCategory = useCallback(
        async (api_id: number, category_id: number) => {
            try {
                const res = await CAMService.UpdateApiCategoryByIdPOST({
                    api_id,
                    category_id,
                } as never);
                if (res.status !== 200) {
                    throw new Error(res.message || t("api.categoryUpdateFailure"));
                }
                await invalidateAfterSuccessfulMutation(res);
                setApis((prev) =>
                    prev.map((api) =>
                        api.id === api_id
                            ? {
                                  ...api,
                                  category_id:
                                      category_id >= 0 ? category_id : null,
                              }
                            : api,
                    ),
                );
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : t("api.categoryUpdateFailure");
                Message.warning(msg);
                throw err;
            }
        },
        [currentVersion, fetchServiceDetail],
    );

    const handleDeleteCategory = useCallback(
        async (category_id: number) => {
            try {
                const res = await CAMService.DeleteCategoryByIdPOST({ category_id } as never);
                if (res.status !== 200) {
                    throw new Error(res.message || t("api.categoryDeleteFailure"));
                }
                await invalidateAfterSuccessfulMutation(res);
                Message.success(res.message || t("api.categoryDeleteSuccess"));
                setApiCategories((prev) =>
                    prev.filter((cat) => cat.id !== category_id),
                );
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : t("api.categoryDeleteFailure");
                Message.warning(msg);
            }
        },
        [currentVersion, fetchServiceDetail],
    );

    const checkIsServiceMaintainer = useCallback(
        async (candidate_id: number) => {
            try {
            const res = await CAMService.IsServiceMaintainerGET({
                service_id: serviceDetail.id,
                candidate_id,
            } as never);
                if (res.status !== 200) {
                    throw new Error(res.message || t("service.maintainerCheckFailure"));
                }
                return res.is_current_maintainer;
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : t("service.maintainerCheckFailure");
                Message.warning(msg);
                return false;
            }
        },
        [serviceDetail.id],
    );

    const handleAddOrRemoveServiceMaintainerById = useCallback(
        async (candidate_id: number) => {
            try {
            const res = await invalidateAfterSuccessfulMutation(
                await CAMService.AddOrRemoveServiceMaintainerByIdPOST({
                    service_id: serviceDetail.id,
                    candidate_id,
                } as never),
            );
                if (res.status !== 200) {
                    throw new Error(res.message || t("service.maintainerOperationFailure"));
                }
                Message.success(res.message || t("service.maintainerOperationSuccess"));
                return res.is_current_maintainer;
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : t("service.maintainerOperationFailure");
                Message.warning(msg);
                return false;
            }
        },
        [serviceDetail.id, currentVersion, fetchServiceDetail],
    );

    const handleExportOpenAPI = useCallback(async () => {
        try {
            const res = await CAMService.ExportOpenapiByUuidAndVersionGET({
                service_uuid,
                version: currentVersion,
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || t("api.exportFailure"));
            }
            return res.openapi_object;
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : t("api.exportFailure");
            Message.warning(msg);
            return null;
        }
    }, [service_uuid, currentVersion]);

    // 迭代相关
    const [inIteration, setInIteration] = useState(false);
    const [iterationId, setIterationId] = useState<number>(-1);

    const handleStartIteration = useCallback(async () => {
        try {
            const res = await invalidateAfterSuccessfulMutation(
                await CAMService.StartIterationPOST({
                    service_id: serviceDetail.id,
                } as never),
            );
            if (res.status !== 200 && res.status !== 201) {
                throw new Error(res.message || t("iteration.startFailure"));
            }
            Message.success(res.message || t("iteration.startSuccess"));
            setInIteration(true);
            setIterationId(res.service_iteration_id);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t("iteration.startFailure");
            Message.warning(msg);
        }
    }, [serviceDetail.id, currentVersion, fetchServiceDetail]);

    // onCompleted 由页面层传入，用于在提交成功后同步清理旧草稿的 UI 选择状态。
    const handleCompleteIteration = useCallback((onCompleted?: () => void) => {
        const modal = CModal.openArcoForm({
            title: t("iteration.complete"),
            content: <CompleteIterationForm currentVersion={currentVersion} />,
            cancelText: t("common.cancel"),
            okText: t("common.confirm"),
            onOk: async (values, form) => {
                try {
                    await form.validate();
                    const res = await invalidateAfterSuccessfulMutation(
                        await CAMService.CommitIterationPOST({
                            service_iteration_id: iterationId,
                            new_version: values.new_version,
                        } as never),
                    );
                    if (res.status !== 200) {
                        throw new Error(res.message || t("iteration.submitFailure"));
                    }
                    Message.success(res.message || t("iteration.submitSuccess"));
                    modal.close();
                    // 仅刷新 CAM 内容数据，保留基座和当前 SPA 路由。
                    // 先通知页面层清空草稿 API ID，再切换迭代状态；
                    // 否则 useApi 会带着已失效的草稿 ID 查询最新版本，产生“Api not found”提示。
                    onCompleted?.();
                    setInIteration(false);
                    setIterationId(-1);
                    setCurrentVersion(values.new_version);
                    await Promise.all([
                        fetchAllVersions(),
                        fetchServiceDetail(values.new_version),
                    ]);
                } catch (err: unknown) {
                    const msg =
                        err instanceof Error ? err.message : t("iteration.submitFailure");
                    Message.warning(msg);
                    // 抛出错误以阻止弹窗自动关闭（库内有相关处理）
                    throw err;
                }
            },
        });
    }, [iterationId, currentVersion, fetchAllVersions, fetchServiceDetail]);

    const exitIteration = () => {
        setInIteration(false);
        setIterationId(-1);
    };

    return {
        loading,
        versions,
        currentVersion,
        isLatest,
        serviceDetail,
        apiCategories,
        apis,
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
        setInIteration,
        handleStartIteration,
        handleCompleteIteration,
        exitIteration,
    };
};

// 迭代相关（只用于一次迭代周期内，与服务历史版本无关）
export const useServiceIteration = (
    iterationId: number,
    apiCategories: GetServiceByUuidAndVersion200ResponseServiceApi_categoriesItem[],
) => {
    const [loading, setLoading] = useState(false);
    const [iterationDetail, setIterationDetail] = useState<
        GetIterationById200ResponseIteration | null
    >(null);
    const [apiDrafts, setApiDrafts] = useState<
        GetServiceByUuidAndVersion200ResponseServiceApisItem[]
    >([]);

    const fetchIterationDetail = useCallback(async () => {
        if (iterationId <= 0) return;
        setLoading(true);
        try {
            const res = await CAMService.GetIterationByIdGET({ id: iterationId } as never);
            if (res.status !== 200) {
                setIterationDetail(null);
                throw new Error(res.message || t("iteration.fetchDetailFailure"));
            }
            setIterationDetail(res.iteration || null);
            setApiDrafts(res.iteration?.api_drafts || []);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : t("iteration.fetchDetailFailure");
            Message.warning(msg);
        } finally {
            setLoading(false);
        }
    }, [iterationId]);

    useEffect(() => {
        // 未拿到当前 iterationId 对应的草稿前，不保留旧迭代树。
        // 否则 APIList 会在“已进入迭代、仍展示正式树”的过渡帧自动选中正式 API。
        if (iterationId <= 0) {
            setIterationDetail(null);
            setApiDrafts([]);
            return;
        }
        setIterationDetail(null);
        setApiDrafts([]);
        void fetchIterationDetail();
    }, [iterationId, fetchIterationDetail]);

    const iterationTreeData = useMemo(() => {
        if (!apiCategories || !apiDrafts) {
            return [] as any[];
        }
        const categoryMap = new Map<number, any>();
        apiCategories.forEach((cat) => {
            categoryMap.set(cat.id, {
                key: `category-${cat.id}`,
                title: (
                    <Popover content={cat.description}>
                        <Text>{cat.name}</Text>
                    </Popover>
                ),
                children: [] as any[],
                selectable: false,
                draggable: false,
            });
        });
        const uncategorizedGroup = {
            key: "category-null",
            title: <Text>{t("api.uncategorized")}</Text>,
            children: [] as any[],
            selectable: false,
            draggable: false,
        };

        apiDrafts
            .sort((a, b) => a.method.localeCompare(b.method))
            .forEach((apiDraft) => {
                const node = {
                    key: apiDraft.id.toString(),
                    title: (
                        <Space style={{ fontWeight: 500 }}>
                            {genApiMethodTag(apiDraft.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH", "small")}
                            {apiDraft.name}
                            <Ellipsis
                                style={{
                                    color: "#6e7687",
                                    fontSize: 10,
                                    maxWidth: 160,
                                }}
                                rows={1}
                                showTooltip
                            >
                                {apiDraft.path}
                            </Ellipsis>
                        </Space>
                    ),
                    style: {
                        maxWidth: "100%",
                        overflow: "auto",
                        scrollbarWidth: "none",
                    },
                };
                if (apiDraft.category_id == null) {
                    uncategorizedGroup.children.push(node);
                } else {
                    const group = categoryMap.get(apiDraft.category_id);
                    if (group) {
                        group.children.push(node);
                    } else {
                        uncategorizedGroup.children.push(node);
                    }
                }
            });

        return [...Array.from(categoryMap.values()), uncategorizedGroup];
    }, [apiCategories, apiDrafts]);

    const handleAddApi = useCallback(() => {
        const modal = CModal.openArcoForm({
            title: t("api.create"),
            content: <AddApiForm apiCategories={apiCategories} />,
            cancelText: t("common.cancel"),
            okText: t("common.confirm"),
            onOk: async (values, form) => {
                try {
                    await form.validate();
                    const data: {
                        service_iteration_id: number;
                        name: string;
                        method: string;
                        path: string;
                        description: string;
                        level: string;
                        category_id?: number;
                    } = {
                        service_iteration_id: iterationId,
                        name: values.name,
                        method: values.method,
                        path: values.path,
                        description: values?.description || "",
                        level: values.level || "P2",
                    };
                    if (values.category_id > 0) {
                        data.category_id = values.category_id;
                    }
                    const res = await CAMService.AddApiPOST(data as never);
                    if (res.status !== 200) {
                        throw new Error(res.message || t("api.createFailure"));
                    }
                    await invalidateAfterSuccessfulMutation(res);
                    Message.success(res.message || t("api.createSuccess"));
                    // 显式关闭弹窗，避免依赖隐式行为
                    modal.close();
                    // 刷新
                    /* 
                        这里应当加await：
                        1. 异步函数 ： fetchIterationDetail 是一个 async 函数（定义在第 595 行），它返回一个 Promise。
                        2. 执行顺序 ：加上 await 可以确保在 onOk 函数结束前，数据刷新操作已经完成。虽然在此处弹窗已经关闭（ modal.close() ），但等待刷新完成可以保证后续逻辑（如果有）是在数据更新后执行的。
                        3. 代码规范 ：在 async 函数中调用另一个 async 函数时，通常建议使用 await ，除非明确希望“触发即忘”（Fire-and-forget）。这有助于避免潜在的竞态条件，并使执行流程更清晰。
                    */
                    await fetchIterationDetail();
                } catch (err: unknown) {
                    const msg =
                        err instanceof Error ? err.message : t("api.createFailure");
                    Message.warning(msg);
                    // 抛出错误以阻止弹窗自动关闭（库内有相关处理）
                    throw err;
                }
            },
        });
    }, [iterationId, fetchIterationDetail]);

    const handleSmartCreateApi = useCallback(
        (
            onCreated: (data: {
                apiDraftId: number;
                proposal: GenerateApiProposal200ResponseProposal1;
            }) => void,
        ) => {
            const modal = CModal.openArcoForm({
                title: <SmartCreateApiTitle />,
                content: <SmartCreateApiForm />,
                cancelText: t("common.cancel"),
                okText: t("api.aiRecognize"),
                okButtonProps: {
                    icon: <IconAiLine />,
                },
                onOk: async (values, form) => {
                    try {
                        await form.validate();
                        const res = await CAMService.GenerateApiProposalPOST({
                            service_iteration_id: iterationId,
                            prompt: values.prompt.trim(),
                        } as never, { timeout: 5 * 60 * 1000 });
                        if (res.status !== 200 || !res.proposal) {
                            throw new Error(res.message || t("api.aiRecognitionFailure"));
                        }

                        if ("missing_fields" in res.proposal) {
                            const fieldNames = res.proposal.missing_fields.map(
                                (field) =>
                                    field === "method"
                                        ? t("api.method")
                                        : t("api.path"),
                            );
                            Message.warning(
                                t("api.missingFields", { fields: fieldNames.join(t("common.listSeparator")) }),
                            );
                            throw new Error(t("api.aiIncomplete"));
                        }
                        if ("duplicate_api" in res.proposal) {
                            Message.warning(
                                res.proposal.message || t("api.alreadyExists"),
                            );
                            throw new Error(t("api.alreadyExists"));
                        }

                        const proposal = res.proposal;
                        const addRes = await CAMService.AddApiPOST({
                            service_iteration_id: iterationId,
                            ...proposal.add_api,
                        } as never);
                        if (addRes.status !== 200 || !addRes.api) {
                            throw new Error(addRes.message || t("api.createFailure"));
                        }
                            await invalidateAfterSuccessfulMutation(addRes);

                        await fetchIterationDetail();
                        modal.close();
                        onCreated({
                            apiDraftId: addRes.api.id,
                            proposal,
                        });
                        Message.success(t("api.aiCreateSuccess"));
                    } catch (err: unknown) {
                        const msg =
                            err instanceof Error ? err.message : t("api.aiRecognitionFailure");
                        if (
                            msg !== t("api.aiIncomplete") &&
                            msg !== t("api.alreadyExists")
                        ) {
                            Message.warning(msg);
                        }
                        // 抛出错误以阻止弹窗关闭，保留用户输入。
                        throw err;
                    }
                },
            });
        },
        [iterationId, fetchIterationDetail],
    );

    const handleCopyApi = useCallback(
        async (apiDraftId: number) => {
            const res = await CAMService.CopyApiByApiDraftIdPOST({
                service_iteration_id: iterationId,
                api_draft_id: apiDraftId,
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || t("api.copyFailure"));
            }
            await invalidateAfterSuccessfulMutation(res);
            Message.success(res.message || t("api.copySuccess"));
            // 刷新
            await fetchIterationDetail();
        },
        [iterationId, fetchIterationDetail],
    );

    const handleDeleteApi = useCallback(
        async (apiDraftId: number) => {
            const res = await CAMService.DeleteApiByApiDraftIdPOST({
                service_iteration_id: iterationId,
                api_draft_id: apiDraftId,
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || t("api.deleteFailure"));
            }
            await invalidateAfterSuccessfulMutation(res);
            Message.success(res.message || t("api.deleteSuccess"));
            // 刷新
            await fetchIterationDetail();
        },
        [iterationId, fetchIterationDetail],
    );

    const handleSaveApiDraft = useCallback(
        async (
            data: {
                api_draft_id: number;
                name: string;
                method: string;
                path: string;
                description: string;
                level: string;
                req_params: ApiReqParamInput[];
                resp_params: ApiRespParamInput[];
            },
        ): Promise<UpdateApiByApiDraftId200Response> => {
            const res = await CAMService.UpdateApiByApiDraftIdPOST({
                ...data,
                service_iteration_id: iterationId,
                req_params: JSON.stringify(data.req_params),
                resp_params: JSON.stringify(data.resp_params),
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || t("api.saveFailure"));
            }
            await invalidateAfterSuccessfulMutation(res);
            // 刷新
            await fetchIterationDetail();
            return res;
        },
        [iterationId, fetchIterationDetail],
    );

    return {
        loading,
        iterationDetail,
        apiDrafts,
        iterationTreeData,
        fetchIterationDetail,
        handleAddApi,
        handleSmartCreateApi,
        handleCopyApi,
        handleDeleteApi,
        handleSaveApiDraft,
    };
};
