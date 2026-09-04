import { Form, Upload } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";
import styles from "../index.module.less";

/** ImportOpenApiForm：选择待导入的 OpenAPI JSON 文件。 */
const ImportOpenApiForm: React.FC = () => {
    const { t } = useTranslation();
    const formItemLayout = {
        labelCol: { span: 7 },
        wrapperCol: { span: 17 },
    };

    return (
        <Form.Item
            field="openapi_files"
            label={t("iteration.openApiFile")}
            triggerPropName="fileList"
            getValueFromEvent={(fileList) => fileList}
            rules={[
                {
                    required: true,
                    message: t("iteration.openApiFileRequired"),
                },
            ]}
            {...formItemLayout}
        >
            <Upload
                accept=".json,application/json"
                autoUpload={false}
                className={styles.openapiUpload}
                drag
                limit={1}
            >
                <div className={styles.openapiUploadTrigger}>
                    <div className={styles.openapiUploadTitle}>
                        {t("iteration.openApiFileDrag")}
                    </div>
                    <div className={styles.openapiUploadHint}>
                        {t("iteration.openApiFileHint")}
                    </div>
                </div>
            </Upload>
        </Form.Item>
    );
};

export default ImportOpenApiForm;
