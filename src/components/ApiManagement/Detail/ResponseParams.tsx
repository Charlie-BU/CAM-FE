import {
    IconCommon,
    Popover,
    Space,
    Table,
    Tag,
    Typography,
} from "@cloud-materials/common";

import type {
    GetApiById200ResponseApi,
    GetApiById200ResponseApiResponse_params_by_status_code200Item,
} from "@/cam-auto-generate/CAMService/namespaces";
import { genStatusCodeTag } from "@/utils";
import styles from "../index.module.less";
import { getParamTypeTag } from "./utils";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const ResponseParams = (props: { apiDetail: GetApiById200ResponseApi }) => {
    const { t } = useTranslation();
    const { apiDetail } = props;
    const responseColumns: any[] = [
        {
            title: t("api.parameterName"),
            dataIndex: "name",
            width: 160,
            render: (v: string, record: GetApiById200ResponseApiResponse_params_by_status_code200Item) => {
                const childrenParams = record.children_params || [];
                if (!childrenParams.length) return v;
                const popoverText =
                    record.type === "array" && record.array_child_type === "object"
                        ? t("api.viewArrayChildParameters")
                        : t("api.viewChildParameters");
                return (
                    <Popover content={popoverText}>
                        <Popover
                            trigger="click"
                            content={
                                <Table<GetApiById200ResponseApiResponse_params_by_status_code200Item>
                                    pagination={false}
                                    columns={responseColumns}
                                    rowKey="name"
                                    data={childrenParams}
                                    size="small"
                                />
                            }
                            style={{ width: 1000, maxWidth: 1000 }}
                        >
                            <Text type="primary" className={styles.hasChildParamTitle}>
                                {v}
                            </Text>
                        </Popover>
                    </Popover>
                );
            },
        },
        {
            title: t("api.parameterType"),
            dataIndex: "type",
            width: 150,
            render: (v: string, record: GetApiById200ResponseApiResponse_params_by_status_code200Item) =>
                getParamTypeTag(v as never, record.array_child_type as never),
        },
        {
            title: t("api.required"),
            dataIndex: "required",
            width: 120,
            render: (v: boolean) => (
                <Tag color={v ? "red" : "gray"}>{v ? t("api.requiredValue") : t("api.optional")}</Tag>
            ),
        },
        {
            title: t("api.nullable"),
            dataIndex: "nullable",
            width: 120,
            render: (v: boolean) => (
                <Tag color={v ? "blue" : "gray"}>{v ? t("api.nullableValue") : t("api.notNullable")}</Tag>
            ),
        },
        { title: t("common.description"), dataIndex: "description", width: 240, placeholder: "-" },
        { title: t("api.exampleValue"), dataIndex: "example", placeholder: "-" },
    ];
    // 后端按状态码动态返回字段；CAM 当前仅生成了 200 属性，保留运行时完整映射。
    const responseParamsByStatusCode = apiDetail.response_params_by_status_code as unknown as Record<
        number,
        GetApiById200ResponseApiResponse_params_by_status_code200Item[]
    >;
    const existCodes: number[] = Object.keys(responseParamsByStatusCode)
        .filter((status) => responseParamsByStatusCode[Number(status)]?.length > 0)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <Space direction="vertical" size={12}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> {t("api.responseParameters")}
            </div>
            {existCodes.map((code) => (
                <Space direction="vertical" size={8} key={code}>
                    <Text>{t("api.statusCode", { code })}{genStatusCodeTag(code)}</Text>
                    <Table<GetApiById200ResponseApiResponse_params_by_status_code200Item>
                        pagination={false}
                        columns={responseColumns as any}
                        rowKey="name"
                        data={responseParamsByStatusCode[code]}
                        size="small"
                    />
                </Space>
            ))}
        </Space>
    );
};

export default ResponseParams;
