import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Message,
    CModal,
    Divider,
    Tabs,
    Typography,
    Button,
} from "@cloud-materials/common";

import styles from "./index.module.less";
import { useService } from "@/hooks/useService";
import type { ServiceRange } from "@/hooks/useService";
import type { GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem } from "@/cam-auto-generate/CAMService/namespaces";
import ServiceList from "./ServiceList";
import UserSelect from "./UserSelect";
import { WelcomeLoggedIn } from "./WelcomeView";

const { Title } = Typography;

const SERVICE_RANGE_STORAGE_KEY_PREFIX = "cam.service-range";

/** getServiceRangeStorageKey：生成用户隔离的服务范围存储键。 */
export const getServiceRangeStorageKey = (userId: number) =>
    `${SERVICE_RANGE_STORAGE_KEY_PREFIX}.${userId}`;

/** getInitialServiceRange：校验当前用户可恢复的服务范围。 */
export const getInitialServiceRange = (
    serviceRange: string | null,
    user: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem,
): ServiceRange => {
    switch (serviceRange) {
        case "MyMaintainedServices":
        case "MyDeletedServices":
            return serviceRange;
        case "AllServices":
            return user.level === 0 ? serviceRange : "MyServices";
        default:
            return "MyServices";
    }
};

/** getStoredServiceRange：读取当前用户可用的持久化服务范围。 */
export const getStoredServiceRange = (
    user: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem,
): ServiceRange => {
    try {
        return getInitialServiceRange(
            window.sessionStorage.getItem(getServiceRangeStorageKey(user.id)),
            user,
        );
    } catch {
        return "MyServices";
    }
};

/** storeServiceRange：持久化当前用户可恢复的服务范围。 */
export const storeServiceRange = (
    serviceRange: ServiceRange,
    user: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem,
) => {
    // “His Services”还依赖当前选择的用户，暂不恢复该 Tab，避免缺少用户 ID 时发出无效请求。
    if (serviceRange === "HisServices") return;
    if (serviceRange === "AllServices" && user.level !== 0) return;
    try {
        window.sessionStorage.setItem(
            getServiceRangeStorageKey(user.id),
            serviceRange,
        );
    } catch {
        // 隐私模式或受限环境禁止 Storage 时，保留默认的 My Services 行为。
    }
};

const LoggedInView: React.FC<{
    user: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem;
    getUserByUsernameOrNicknameOrEmail: (
        username_or_nickname_or_email: string
    ) => Promise<GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem[]>;
}> = ({ user, getUserByUsernameOrNicknameOrEmail }) => {
    const { t } = useTranslation();
    const [serviceRange, setServiceRange] =
        useState<ServiceRange>(() => getStoredServiceRange(user));
    const {
        serviceList,
        loading,
        fetchMyNewestServices,
        fetchMyMaintainedServices,
        fetchMyDeletedServices,
        fetchHisNewestServicesByOwnerId,
        fetchAllServices,
        handleViewService,
        handleDeleteService,
        handleRestoreService,
        handlePermanentDeleteService,
        handleCreateService,
    } = useService();
    const [pagination, setPagination] = useState({
        page_size: 10,
        current_page: 1,
        total: 0,
    });

    const handleTabChange = (key: ServiceRange) => {
        if (key === "HisServices") {
            const modal = CModal.openArcoForm({
                title: "查看他人服务",
                content: (
                    <>
                        <UserSelect
                            getUserByUsernameOrNicknameOrEmail={
                                getUserByUsernameOrNicknameOrEmail
                            }
                            onSelectId={(id) => {
                                hisIdRef.current = id;
                            }}
                        />
                    </>
                ),
                cancelText: t("common.cancel"),
                okText: t("common.confirm"),
                onOk: async () => {
                    try {
                        const selectedId = hisIdRef.current;
                        if (selectedId <= 0) {
                            throw new Error("未选择用户");
                        }
                        setServiceRange("HisServices");
                        setPagination({
                            ...pagination,
                            current_page: 1,
                        });
                        // 显式关闭弹窗，避免依赖隐式行为
                        modal.close();
                    } catch (err: unknown) {
                        const msg =
                            err instanceof Error
                                ? err.message
                                : t("common.failure");
                        Message.warning(msg);
                        // 抛出错误以阻止弹窗自动关闭（库内有相关处理）
                        throw err;
                    }
                },
                onCancel: () => {
                    hisIdRef.current = -1;
                    modal.close();
                    setServiceRange(key);
                    setPagination({
                        ...pagination,
                        current_page: 1,
                    });
                },
            });
        } else {
            setServiceRange(key);
            storeServiceRange(key, user);
            setPagination({
                ...pagination,
                current_page: 1,
            });
        }
    };

    const handlePageChange = (pageSize: number, currentPage?: number) => {
        setPagination((prev) => ({
            ...prev,
            page_size: pageSize,
            current_page: currentPage || prev.current_page,
        }));
    };

    // 用 useRef 储存 hisId，在切换服务范围时使用
    const hisIdRef = useRef<number>(-1);

    useEffect(() => {
        switch (serviceRange) {
            case "MyServices":
                // 方法是异步的，返回 Promise，但在 useEffect 中不能直接 await，
                // 所以需要使用 then 方法处理 Promise .resolve 后的结果
                fetchMyNewestServices(pagination)
                    .then((total) => {
                        setPagination((prev) => ({
                            ...prev,
                            total,
                        }));
                    })
                    .catch((err) => {
                        Message.warning(err.message || "获取服务失败");
                    });
                break;
            case "MyMaintainedServices":
                fetchMyMaintainedServices(pagination)
                    .then((total) => {
                        setPagination((prev) => ({
                            ...prev,
                            total,
                        }));
                    })
                    .catch((err) => {
                        Message.warning(err.message || "获取服务失败");
                    });
                break;
            case "MyDeletedServices":
                fetchMyDeletedServices(pagination)
                    .then((total) => {
                        setPagination((prev) => ({
                            ...prev,
                            total,
                        }));
                    })
                    .catch((err) => {
                        Message.warning(err.message || "获取服务失败");
                    });
                break;
            case "HisServices":
                fetchHisNewestServicesByOwnerId(hisIdRef.current, pagination)
                    .then((total) => {
                        setPagination((prev) => ({
                            ...prev,
                            total,
                        }));
                    })
                    .catch((err) => {
                        Message.warning(err.message || "获取服务失败");
                    });
                break;
            case "AllServices":
                fetchAllServices(pagination)
                    .then((total) => {
                        setPagination((prev) => ({
                            ...prev,
                            total,
                        }));
                    })
                    .catch((err) => {
                        Message.warning(err.message || "获取服务失败");
                    });
                break;
        }
    }, [serviceRange, pagination.page_size, pagination.current_page]);

    return (
        <div className={styles.home}>
            <WelcomeLoggedIn user={user} />
            <Divider />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <Title heading={5} style={{ margin: 0 }}>
                    {t("service.list")}
                </Title>
                <Button
                    type="primary"
                    onClick={() => handleCreateService(user)}
                >
                    {t("service.create")}
                </Button>
            </div>

            <Tabs
                activeTab={serviceRange}
                onChange={(key) => handleTabChange(key as ServiceRange)}
                style={{ marginBottom: 18 }}
            >
                <Tabs.TabPane key="MyServices" title={"My Services"} />
                <Tabs.TabPane
                    key="MyMaintainedServices"
                    title="My Maintained Services"
                />
                <Tabs.TabPane
                    key="MyDeletedServices"
                    title="My Deleted Services"
                />
                {user.level === 0 && (
                    <Tabs.TabPane key="HisServices" title="His Services" />
                )}
                {user.level === 0 && (
                    <Tabs.TabPane key="AllServices" title="All Services" />
                )}
            </Tabs>
            <ServiceList
                serviceList={serviceList}
                range={serviceRange}
                pagination={pagination}
                handlePageChange={handlePageChange}
                handleViewService={handleViewService}
                handleDeleteService={handleDeleteService}
                handleRestoreService={handleRestoreService}
                handlePermanentDeleteService={handlePermanentDeleteService}
                loading={loading}
                user={user}
            />
        </div>
    );
};

export default LoggedInView;
