import React from "react";
import { useTranslation } from "react-i18next";
import { Form, Input } from "@cloud-materials/common";

const AddCategoryForm: React.FC = () => {
    const { i18n, t } = useTranslation();
    const currentLanguage = i18n.resolvedLanguage;

    return (
        <>
            <Form.Item
                label={t("api.categoryName")}
                labelCol={currentLanguage === "en-US" ? { span: 7 } : undefined}
                wrapperCol={
                    currentLanguage === "en-US" ? { span: 17 } : undefined
                }
                field="category_name"
                rules={[
                    {
                        required: true,
                        message: t("api.categoryNameRequired"),
                    },
                ]}
            >
                <Input placeholder={t("api.categoryNameRequired")} allowClear />
            </Form.Item>
            <Form.Item
                label={t("api.categoryDescription")}
                labelCol={currentLanguage === "en-US" ? { span: 7 } : undefined}
                wrapperCol={
                    currentLanguage === "en-US" ? { span: 17 } : undefined
                }
                field="description"
                rules={[
                    {
                        required: true,
                        message: t("api.categoryDescriptionRequired"),
                    },
                ]}
            >
                <Input.TextArea placeholder={t("api.categoryDescriptionRequired")} allowClear />
            </Form.Item>
        </>
    );
};

export default AddCategoryForm;
