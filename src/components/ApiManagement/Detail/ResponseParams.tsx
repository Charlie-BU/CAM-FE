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

const { Text } = Typography;

const responseColumns = [
    {
        title: "参数名称",
        dataIndex: "name",
        width: 160,
        render: (v: string, record: GetApiById200ResponseApiResponse_params_by_status_code200Item) => {
            const childrenParams = record.children_params || [];
            if (!childrenParams || childrenParams.length === 0) {
                return v;
            }
            const popoverText =
                record.type === "array" && record.array_child_type === "object"
                    ? "点击查看数组元素子参数"
                    : "点击查看子参数";
            return (
                <Popover content={popoverText}>
                    <Popover
                        trigger="click"
                        content={
                            <Table<GetApiById200ResponseApiResponse_params_by_status_code200Item>
                                pagination={false}
                                columns={responseColumns as any}
                                rowKey="name"
                                data={childrenParams}
                                size="small"
                            />
                        }
                        style={{ width: 1000, maxWidth: 1000 }}
                    >
                        <Text
                            type="primary"
                            className={styles.hasChildParamTitle}
                        >
                            {v}
                        </Text>
                    </Popover>
                </Popover>
            );
        },
    },
    {
        title: "参数类型",
        dataIndex: "type",
        width: 150,
        render: (v: string, record: GetApiById200ResponseApiResponse_params_by_status_code200Item) =>
            getParamTypeTag(v as never, record.array_child_type as never),
    },
    {
        title: "是否必填",
        dataIndex: "required",
        width: 120,
        render: (v: boolean) => (
            <Tag color={v ? "red" : "gray"}>{v ? "必填" : "选填"}</Tag>
        ),
    },
    {
        title: "可为 null",
        dataIndex: "nullable",
        width: 120,
        render: (v: boolean) => (
            <Tag color={v ? "blue" : "gray"}>{v ? "可空" : "非空"}</Tag>
        ),
    },
    { title: "描述", dataIndex: "description", width: 240, placeholder: "-" },
    { title: "示例值", dataIndex: "example", placeholder: "-" },
];

const ResponseParams = (props: { apiDetail: GetApiById200ResponseApi }) => {
    const { apiDetail } = props;
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
                <IconCommon /> 响应参数
            </div>
            {existCodes.map((code) => (
                <Space direction="vertical" size={8} key={code}>
                    <Text>状态码：{genStatusCodeTag(code)}</Text>
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
