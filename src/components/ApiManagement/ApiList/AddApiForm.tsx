import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Select } from "@cloud-materials/common";
import type { GetServiceByUuidAndVersion200ResponseServiceApi_categoriesItem } from "@/cam-auto-generate/CAMService/namespaces";
import { HTTP_METHODS } from "../ApiEdit/types";

interface AddApiFormProps {
    apiCategories?: GetServiceByUuidAndVersion200ResponseServiceApi_categoriesItem[];
}

const AddApiForm: React.FC<AddApiFormProps> = ({ apiCategories = [] }) => {
    const { i18n, t } = useTranslation();
    const currentLanguage = i18n.resolvedLanguage;

    const formItemLayout = {
        labelCol: currentLanguage === "en-US" ? { span: 7 } : undefined,
        wrapperCol: currentLanguage === "en-US" ? { span: 17 } : undefined,
    };

    const categories = [...apiCategories, { id: -1, name: t("api.uncategorized") }];
    const [name, setName] = useState("");

    return (
        <>
            <Form.Item
                label={t("api.name")}
                field="name"
                rules={[
                    { required: true, message: t("api.nameRequired") },
                    {
                        match: /^[^\u4e00-\u9fff]*$/,
                        message: t("api.nameNoChinese"),
                    },
                ]}
                {...formItemLayout}
            >
                <Input
                    placeholder={t("api.nameRequired")}
                    allowClear
                    onChange={setName}
                />
            </Form.Item>
            <Form.Item
                label={t("api.method")}
                field="method"
                initialValue="GET"
                rules={[{ required: true, message: t("api.methodRequired") }]}
                {...formItemLayout}
            >
                <Select placeholder={t("api.methodRequired")}>
                    {HTTP_METHODS.map((m) => (
                        <Select.Option key={m} value={m}>
                            {m}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                label={t("api.path")}
                field="path"
                rules={[
                    { required: true, message: t("api.pathRequired") },
                    { match: /^\//, message: t("api.pathMustStartWithSlash") },
                    {
                        match: /^[^\u4e00-\u9fff]*$/,
                        message: t("api.pathNoChinese"),
                    },
                ]}
                {...formItemLayout}
            >
                <Input placeholder={`/api/${name}`} allowClear />
            </Form.Item>
            <Form.Item
                label={t("api.level")}
                field="level"
                initialValue="P2"
                rules={[{ required: true, message: t("api.levelRequired") }]}
                {...formItemLayout}
            >
                <Select placeholder={t("api.levelRequired")}>
                    {["P0", "P1", "P2", "P3", "P4"].map((l) => (
                        <Select.Option key={l} value={l}>
                            {l}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                label={t("api.category")}
                field="category_id"
                initialValue={-1}
                rules={[{ required: true, message: t("api.categoryRequired") }]}
                {...formItemLayout}
            >
                <Select placeholder={t("api.categoryRequired")}>
                    {categories.map((c) => (
                        <Select.Option key={c.id} value={c.id}>
                            {c.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label={t("api.description")} field="description" {...formItemLayout}>
                <Input.TextArea placeholder={t("api.descriptionRequired")} allowClear />
            </Form.Item>
        </>
    );
};

export default AddApiForm;
