import { Button, Dropdown, Menu, Space } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";

import { handleConfirm } from "@/utils";

interface IterationActionsProps {
    inIteration: boolean;
    isLatest: boolean;
    handleStartIteration: () => void;
    handleImportOpenApi: () => void;
    handleCompleteIteration: () => void;
    handleDeleteIteration: () => void;
}

/** IterationActions：展示服务迭代相关操作入口。 */
const IterationActions: React.FC<IterationActionsProps> = ({
    inIteration,
    isLatest,
    handleStartIteration,
    handleImportOpenApi,
    handleCompleteIteration,
    handleDeleteIteration,
}) => {
    const { t } = useTranslation();

    if (inIteration) {
        return (
            <Space size={12}>
                <Button
                    type="default"
                    status="success"
                    onClick={handleCompleteIteration}
                >
                    {t("iteration.complete")}
                </Button>
                <Button
                    type="default"
                    status="danger"
                    onClick={() =>
                        handleConfirm(
                            handleDeleteIteration,
                            t("iteration.delete"),
                            t("iteration.deleteConfirm"),
                        )
                    }
                >
                    {t("iteration.delete")}
                </Button>
            </Space>
        );
    }

    if (!isLatest) {
        return null;
    }

    const startIterationOperations = (
        <Menu>
            <Menu.Item
                key="from-current-version"
                onClick={() =>
                    handleConfirm(
                        handleStartIteration,
                        t("iteration.start"),
                        t("iteration.startConfirm"),
                    )
                }
            >
                {t("iteration.startFromCurrentVersion")}
            </Menu.Item>
            <Menu.Item key="from-openapi" onClick={handleImportOpenApi}>
                {t("iteration.importOpenApi")}
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown
            droplist={startIterationOperations}
            position="bl"
            trigger="click"
        >
            <Button type="primary">{t("iteration.start")}</Button>
        </Dropdown>
    );
};

export default IterationActions;
