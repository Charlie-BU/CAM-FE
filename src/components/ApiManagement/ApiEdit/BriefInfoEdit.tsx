import React, { useState } from "react";
import {
    Input,
    Select,
    Form,
    Space,
    IconCommon,
} from "@cloud-materials/common";
import { HTTP_METHODS } from "./types";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;

const BriefInfoEdit: React.FC = () => {
    const { t } = useTranslation();
    // 仅用作path placeholder
    const { form } = Form.useFormContext();
    const [name, setName] = useState(form.getFieldValue("name"));

    return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> {t("api.info")}
            </div>
            <div style={{ width: "100%" }}>
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
                    style={{ width: "50%" }}
                >
                    <Input
                        placeholder={t("api.nameRequired")}
                        maxLength={50}
                        showWordLimit
                        onChange={(value: string) => {
                            setName(value);
                        }}
                    />
                </Form.Item>
                <Form.Item
                    label={t("api.methodAndPath")}
                    required
                    style={{ width: "50%" }}
                >
                    <Space direction="horizontal" style={{ width: "100%" }}>
                        <Form.Item
                            field="method"
                            rules={[
                                { required: true, message: t("api.methodRequired") },
                            ]}
                            noStyle={{ showErrorTip: true }}
                        >
                            <Select style={{ width: 120 }} placeholder="Method">
                                {HTTP_METHODS.map((method) => (
                                    <Select.Option key={method} value={method}>
                                        {method}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            field="path"
                            rules={[
                                { required: true, message: t("api.pathRequired") },
                                { match: /^\//, message: t("api.pathMustStartWithSlash") },
                                {
                                    match: /^[^\u4e00-\u9fff]*$/,
                                    message: t("api.pathNoChinese"),
                                },
                            ]}
                            noStyle={{ showErrorTip: true }}
                        >
                            <Input
                                placeholder={`/api/${name}`}
                                style={{ flex: 1 }}
                            />
                        </Form.Item>
                    </Space>
                </Form.Item>
                <Form.Item
                    label={t("api.level")}
                    field="level"
                    rules={[{ required: true, message: t("api.levelRequired") }]}
                    style={{ width: "50%" }}
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
                    label={t("api.description")}
                    field="description"
                    style={{ width: "50%" }}
                >
                    <TextArea
                        placeholder={t("api.descriptionRequired")}
                        maxLength={200}
                        showWordLimit
                        autoSize={{ minRows: 3, maxRows: 5 }}
                    />
                </Form.Item>
            </div>
        </Space>
    );
};

export default BriefInfoEdit;
