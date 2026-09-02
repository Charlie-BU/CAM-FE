import { useCallback, useEffect, useRef, useState } from "react";
import { Message } from "@cloud-materials/common";

import type { GetApiById200ResponseApi } from "@/cam-auto-generate/CAMService/namespaces";
import { CAMService, readOptions } from "@/services/CAMService";

const useApi = (apiId: number, isLatest: boolean) => {
    const [loading, setLoading] = useState(false);
    const [apiDetail, setApiDetail] = useState<GetApiById200ResponseApi>(
        {} as GetApiById200ResponseApi
    );
    const requestIdRef = useRef(0);

    const fetchApiDetail = useCallback(async () => {
        // 无论是否会发请求，切换或清空选择都要使之前的请求失效。
        const requestId = ++requestIdRef.current;
        if (!apiId || apiId <= 0) {
            setApiDetail({} as GetApiById200ResponseApi);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const updateDetail = (updatedResponse: unknown) => {
                const latest = updatedResponse as { status: number; api?: GetApiById200ResponseApi };
                if (requestIdRef.current === requestId && latest.status === 200 && latest.api) {
                    setApiDetail(latest.api);
                }
            };
            const res = await CAMService.GetApiByIdGET({
                api_id: apiId,
                is_latest: isLatest,
            } as never, isLatest ? readOptions({ onCacheUpdated: updateDetail }) : undefined);
            if (res.status !== 200) {
                if (requestIdRef.current === requestId) {
                    setApiDetail({} as GetApiById200ResponseApi);
                }
                throw new Error(res.message || "获取 API 详情失败");
            }
            if (requestIdRef.current === requestId) {
                setApiDetail(res.api || ({} as GetApiById200ResponseApi));
            }
        } catch (error: unknown) {
            if (requestIdRef.current !== requestId) return;
            setApiDetail({} as GetApiById200ResponseApi);
            const msg =
                error instanceof Error ? error.message : "获取 API 详情失败";
            Message.warning(msg);
        } finally {
            if (requestIdRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [apiId, isLatest]);

    useEffect(() => {
        fetchApiDetail();
    }, [fetchApiDetail]);

    return {
        loading,
        apiDetail,
    };
};

export default useApi;
