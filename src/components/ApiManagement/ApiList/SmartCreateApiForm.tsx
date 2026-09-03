import { Form, Input } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";
import styles from "../index.module.less";

export const SmartCreateApiTitle: React.FC = () => {
    const { t } = useTranslation();
    return <span className={styles.aiMenuContent}><span className={styles.aiMenuGradientText}>{t("api.smartCreate")}</span></span>;
};

const SmartCreateApiForm: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Form.Item
            field="prompt"
            label={t("api.description")}
            rules={[{ required: true, message: t("api.aiDescriptionRequired") }]}
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
