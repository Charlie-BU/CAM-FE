import React, { useMemo } from "react";
import {
    Space,
    Input,
    Popover,
    Button,
    IconCommon,
    Select,
    Switch,
    IconPlus,
    IconDelete,
    Table,
} from "@cloud-materials/common";
import { PARAM_TYPES } from "./types";
import { generateId } from "./utils";
import styles from "./index.module.less";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const requiredFields = ["name", "type", "required"];

interface ParamTableProps {
    type: "request" | "response";
    location?: string;
    value?: any[];
    onChange?: (value: any[]) => void;
    readOnly?: boolean;
    setRejectSubmit?: (reject: boolean) => void;
}

const ParamTable: React.FC<ParamTableProps> = ({
    type,
    location,
    value = [],
    onChange,
    readOnly = false,
    setRejectSubmit,
}) => {
    const { t } = useTranslation();
    // 校验必填数据是否为空或包含空格
    const isLegalValue = (value: any) => {
        if (value === undefined || value === null || value === "") {
            return false;
        }
        if (typeof value === "string" && /\s/.test(value)) {
            return false;
        }
        return true;
    };
    const validateData = (data: any[]) => {
        const hasError = data.some((item) =>
            requiredFields.some((field) => {
                const val = item[field];
                return !isLegalValue(val);
            })
        );
        setRejectSubmit?.(hasError);
    };

    const handleFieldChange = (
        id: string | number,
        field: string,
        val: any
    ) => {
        const newData = value.map((item) => {
            if (item.id === id) {
                return { ...item, [field]: val };
            }
            return item;
        });
        validateData(newData);
        onChange?.(newData);
    };

    const handleRemove = (id: string | number) => {
        const newData = value.filter((item) => item.id !== id);
        validateData(newData);
        onChange?.(newData);
    };

    const handleAdd = () => {
        const newItem: any = {
            id: generateId(),
            name: "",
            type: "string",
            required: true,
            nullable: false,
            description: "",
            default_value: "",
            example: "",
        };
        const newData = [...value, newItem];
        validateData(newData);
        onChange?.(newData);
    };

    const hasArrayParam = useMemo(
        () => value.some((item) => item.type === "array"),
        [value]
    );

    const columns = [
        {
            title: t("api.parameterName"),
            dataIndex: "name",
            width: 220,
            fixed: "left" as const,
            render: (val: string, record: any) => {
                const showSubParams =
                    record.type === "object" ||
                    (record.type === "array" &&
                        record?.array_child_type === "object");
                return (
                    <Space size={4}>
                        <Input
                            placeholder={t("api.parameterName")}
                            value={val}
                            onChange={(v) =>
                                handleFieldChange(record.id, "name", v)
                            }
                            disabled={readOnly}
                            style={{ width: showSubParams ? 120 : undefined }}
                            status={isLegalValue(val) ? undefined : "error"}
                        />
                        {showSubParams && (
                            <Popover
                                trigger="click"
                                content={
                                    <div
                                        style={{
                                            width: 1000,
                                            maxWidth: 1000,
                                        }}
                                    >
                                        <ParamTable
                                            type={type}
                                            location={location}
                                            value={record.children_params || []}
                                            onChange={(newChildren) =>
                                                handleFieldChange(
                                                    record.id,
                                                    "children_params",
                                                    newChildren
                                                )
                                            }
                                            readOnly={readOnly}
                                        />
                                    </div>
                                }
                            >
                                <Button type="text" size="mini">
                                    <Space size={4}>
                                        <IconCommon />
                                        {t("api.childParameters")}
                                    </Space>
                                </Button>
                            </Popover>
                        )}
                    </Space>
                );
            },
        },
        {
            title: t("api.parameterType"),
            dataIndex: "type",
            width: hasArrayParam ? 260 : 150,
            render: (val: string, record: any) => (
                <Space size={4}>
                    <Select
                        placeholder={t("api.type")}
                        style={{ width: 120 }}
                        value={val}
                        onChange={(v) => {
                            handleFieldChange(record.id, "type", v);
                        }}
                        disabled={readOnly}
                        status={val ? undefined : "error"}
                    >
                        {PARAM_TYPES.map((t) => (
                            <Option key={t} value={t}>
                                {t}
                            </Option>
                        ))}
                    </Select>
                    {val === "array" && (
                        <Select
                            placeholder={t("api.childType")}
                            style={{ width: 120 }}
                            value={record.array_child_type}
                            onChange={(v) =>
                                handleFieldChange(
                                    record.id,
                                    "array_child_type",
                                    v
                                )
                            }
                            disabled={readOnly}
                        >
                            {PARAM_TYPES.map((t) => (
                                <Option key={t} value={t}>
                                    {t}
                                </Option>
                            ))}
                        </Select>
                    )}
                </Space>
            ),
        },
        {
            title: t("api.required"),
            dataIndex: "required",
            width: 100,
            render: (val: boolean, record: any) => (
                <Switch
                    checked={val}
                    checkedText={t("api.requiredValue")}
                    uncheckedText={t("api.optional")}
                    onChange={(v) =>
                        handleFieldChange(record.id, "required", v)
                    }
                    disabled={readOnly}
                />
            ),
        },
        {
            title: t("api.nullable"),
            dataIndex: "nullable",
            width: 110,
            render: (val: boolean, record: any) => {
                const isPathParam = type === "request" && location === "path";
                return (
                    <Switch
                        checked={val ?? false}
                        checkedText={t("api.nullableValue")}
                        uncheckedText={t("api.notNullable")}
                        onChange={(v) =>
                            handleFieldChange(record.id, "nullable", v)
                        }
                        disabled={readOnly || isPathParam}
                    />
                );
            },
        },
        {
            title: t("common.description"),
            dataIndex: "description",
            render: (val: string, record: any) => (
                <Input
                    placeholder={t("common.description")}
                    value={val}
                    onChange={(v) =>
                        handleFieldChange(record.id, "description", v)
                    }
                    disabled={readOnly}
                />
            ),
        },
        ...(type === "request"
            ? [
                  {
                      title: t("api.defaultValue"),
                      dataIndex: "default_value",
                      render: (val: string, record: any) => (
                          <Input
                              placeholder={t("api.defaultValue")}
                              value={val}
                              onChange={(v) =>
                                  handleFieldChange(
                                      record.id,
                                      "default_value",
                                      v
                                  )
                              }
                              disabled={readOnly}
                          />
                      ),
                  },
              ]
            : []),
        {
            title: t("api.exampleValue"),
            dataIndex: "example",
            render: (val: string, record: any) => (
                <Input
                    placeholder={t("api.exampleValue")}
                    value={val}
                    onChange={(v) => handleFieldChange(record.id, "example", v)}
                    disabled={readOnly}
                />
            ),
        },
        {
            title: t("common.action"),
            dataIndex: "operation",
            width: 100,
            fixed: "right" as const,
            render: (_: any, record: any) => (
                <Space>
                    {/* {record.type === "object" && (
                        <Button
                            type="outline"
                            shape="circle"
                            size="mini"
                            icon={<IconPlus />}
                            onClick={() => {
                                const currentChildren =
                                    record.children_params || [];
                                const newChild = {
                                    id: generateId(),
                                    name: "",
                                    type: "string",
                                    required: false,
                                };
                                handleFieldChange(
                                    record.id,
                                    "children_params",
                                    [...currentChildren, newChild]
                                );
                            }}
                            disabled={readOnly}
                        />
                    )} */}
                    <Button
                        type="outline"
                        shape="circle"
                        status="danger"
                        size="mini"
                        icon={<IconDelete />}
                        onClick={() => handleRemove(record.id)}
                        disabled={readOnly}
                    />
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" className={styles.paramTable}>
            <Table
                pagination={false}
                columns={columns}
                data={value}
                rowKey="id"
                size="small"
                border={false}
                scroll={{ x: 1200 }}
                noDataElement={<></>}
            />
            {!readOnly && (
                <Button
                    type="dashed"
                    long
                    onClick={handleAdd}
                    icon={<IconPlus />}
                >
                    {t("api.addParameter")}
                </Button>
            )}
        </Space>
    );
};

export default ParamTable;
