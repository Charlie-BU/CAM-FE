import { Descriptions, IconCommon, Space } from "@cloud-materials/common";

import type { GetApiById200ResponseApi } from "@/cam-auto-generate/CAMService/namespaces";
import { genApiLevelTag, formatDateOrDateTime, userAvatar } from "@/utils";
import type { GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem } from "@/cam-auto-generate/CAMService/namespaces";
import { useTranslation } from "react-i18next";

const BriefInfo = (props: { apiDetail: GetApiById200ResponseApi }) => {
    const { t } = useTranslation();
    const { apiDetail } = props;
    const apiBriefInfo = [
        {
            label: t("api.name"),
            value: apiDetail.name,
        },
        {
            label: t("api.owner"),
            value: userAvatar([apiDetail.owner] as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem[], 25),
        },
        {
            label: t("api.level"),
            value: genApiLevelTag(apiDetail.level as "P0" | "P1" | "P2" | "P3" | "P4", "small"),
        },
        {
            label: t("api.createTime"),
            value: apiDetail.created_at
                ? formatDateOrDateTime(apiDetail.created_at)
                : "-",
        },
        {
            label: t("api.updateTime"),
            value: apiDetail.updated_at
                ? formatDateOrDateTime(apiDetail.updated_at)
                : "-",
        },
        {
            label: t("api.description"),
            value: apiDetail.description || "-",
        },
    ];

    return (
        <Space direction="vertical" size={12}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> {t("api.info")}
            </div>
            <Descriptions
                data={apiBriefInfo}
                layout="inline-vertical"
                style={{ marginBottom: -10 }}
            />
        </Space>
    );
};

export default BriefInfo;
