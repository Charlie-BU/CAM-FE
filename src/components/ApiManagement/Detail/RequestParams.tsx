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
    GetApiById200ResponseApiRequest_params_by_locationQueryItem,
} from "@/cam-auto-generate/CAMService/namespaces";
import styles from "../index.module.less";
import { getParamTypeTag } from "./utils";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const RequestParams = (props: { apiDetail: GetApiById200ResponseApi }) => {
    const { t } = useTranslation();
    const { apiDetail } = props;
    const requestColumns: any[] = [
        {
            title: t("api.parameterName"),
            dataIndex: "name",
            width: 160,
            render: (v: string, record: GetApiById200ResponseApiRequest_params_by_locationQueryItem) => {
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
                                <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                                    pagination={false}
                                    columns={requestColumns}
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
            render: (v: string, record: GetApiById200ResponseApiRequest_params_by_locationQueryItem) =>
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
        { title: t("api.defaultValue"), dataIndex: "default_value", width: 200, placeholder: "-" },
        { title: t("api.exampleValue"), dataIndex: "example", width: 200, placeholder: "-" },
    ];
    const requestParamsByLocation = apiDetail.request_params_by_location;
    const existLocations = (Object.keys(requestParamsByLocation) as Array<keyof typeof requestParamsByLocation>).filter(
        (location) => requestParamsByLocation[location]?.length > 0
    );

    return (
        <Space direction="vertical" size={12}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> {t("api.requestParameters")}
            </div>
            {existLocations.includes("query") && (
                <Space direction="vertical" size={8}>
                    <Text>{t("api.parameterLocations.query")}</Text>
                    <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                        pagination={false}
                        columns={requestColumns as any}
                        rowKey="name"
                        data={requestParamsByLocation["query"]}
                        size="small"
                    />
                </Space>
            )}
            {existLocations.includes("path") && (
                <Space direction="vertical" size={8}>
                    <Text>{t("api.parameterLocations.path")}</Text>
                    <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                        pagination={false}
                        columns={requestColumns as any}
                        rowKey="name"
                        data={requestParamsByLocation["path"]}
                        size="small"
                    />
                </Space>
            )}
            {existLocations.includes("body") && (
                <Space direction="vertical" size={8}>
                    <Text>{t("api.parameterLocations.body")}</Text>
                    <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                        pagination={false}
                        columns={requestColumns as any}
                        rowKey="name"
                        data={requestParamsByLocation["body"]}
                        size="small"
                    />
                </Space>
            )}
            {existLocations.includes("header") && (
                <Space direction="vertical" size={8}>
                    <Text>{t("api.parameterLocations.header")}</Text>
                    <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                        pagination={false}
                        columns={requestColumns as any}
                        rowKey="name"
                        data={requestParamsByLocation["header"]}
                        size="small"
                    />
                </Space>
            )}
            {existLocations.includes("cookie") && (
                <Space direction="vertical" size={8}>
                    <Text>{t("api.parameterLocations.cookie")}</Text>
                    <Table<GetApiById200ResponseApiRequest_params_by_locationQueryItem>
                        pagination={false}
                        columns={requestColumns as any}
                        rowKey="name"
                        data={requestParamsByLocation["cookie"]}
                        size="small"
                    />
                </Space>
            )}
        </Space>
    );
};

export default RequestParams;
