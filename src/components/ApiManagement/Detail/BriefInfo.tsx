import { Descriptions, IconCommon, Space } from "@cloud-materials/common";

import type { GetApiById200ResponseApi } from "@/cam-auto-generate/CAMService/namespaces";
import { genApiLevelTag, formatDateOrDateTime, userAvatar } from "@/utils";
import type { GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem } from "@/cam-auto-generate/CAMService/namespaces";

const BriefInfo = (props: { apiDetail: GetApiById200ResponseApi }) => {
    const { apiDetail } = props;
    const apiBriefInfo = [
        {
            label: "接口名称",
            value: apiDetail.name,
        },
        {
            label: "接口 Owner",
            value: userAvatar([apiDetail.owner] as GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem[], 25),
        },
        {
            label: "接口等级",
            value: genApiLevelTag(apiDetail.level as "P0" | "P1" | "P2" | "P3" | "P4", "small"),
        },
        {
            label: "创建时间",
            value: apiDetail.created_at
                ? formatDateOrDateTime(apiDetail.created_at)
                : "-",
        },
        {
            label: "更新时间",
            value: apiDetail.updated_at
                ? formatDateOrDateTime(apiDetail.updated_at)
                : "-",
        },
        {
            label: "接口描述",
            value: apiDetail.description || "-",
        },
    ];

    return (
        <Space direction="vertical" size={12}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> 接口信息
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
