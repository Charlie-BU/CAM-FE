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
        if (!apiId || apiId <= 0) {
            setApiDetail({} as GetApiById200ResponseApi);
            return;
        }
        setLoading(true);
        const requestId = ++requestIdRef.current;
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
                setApiDetail({} as GetApiById200ResponseApi);
                throw new Error(res.message || "获取 API 详情失败");
            }
            setApiDetail(res.api || ({} as GetApiById200ResponseApi));
        } catch (error: unknown) {
            setApiDetail({} as GetApiById200ResponseApi);
            const msg =
                error instanceof Error ? error.message : "获取 API 详情失败";
            Message.warning(msg);
        } finally {
            setLoading(false);
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
