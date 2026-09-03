import { Form, Input } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";
import styles from "../index.module.less";

export const SmartCreateApiTitle: React.FC = () => {
    const { t } = useTranslation();
    return <span className={styles.aiMenuContent}><span className={styles.aiMenuGradientText}>{t("api.smartCreate")}</span></span>;
};

const SmartCreateApiForm: React.FC = () => {
    const { i18n, t } = useTranslation();
    const formItemLayout = {
        // 英文标签比中文长；明确分配栅格宽度，避免 "API description" 折行。
        labelCol: i18n.resolvedLanguage === "en-US" ? { span: 7 } : undefined,
        wrapperCol:
            i18n.resolvedLanguage === "en-US" ? { span: 17 } : undefined,
    };
    return (
        <Form.Item
            field="prompt"
            label={t("api.description")}
            rules={[{ required: true, message: t("api.aiDescriptionRequired") }]}
            {...formItemLayout}
        >
            <Input.TextArea
                autoSize={{ minRows: 6, maxRows: 12 }}
                allowClear
                placeholder={t("api.aiDescriptionPlaceholder")}
            />
        </Form.Item>
    );
};

export default SmartCreateApiForm;
