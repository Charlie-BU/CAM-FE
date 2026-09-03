import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input } from "@cloud-materials/common";

const CompleteIterationForm: React.FC<{ currentVersion: string }> = ({
    currentVersion,
}) => {
    const { i18n, t } = useTranslation();
    const currentLanguage = i18n.resolvedLanguage;

    const suggestVersionPlaceholder = useMemo(() => {
        if (!currentVersion) return "";
        const parts = currentVersion.split(".");
        if (parts.length === 3) {
            return `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`;
        }
        return "";
    }, [currentVersion]);

    const validateVersion = (
        value: string | undefined,
        callback: (error?: any) => void
    ) => {
        if (!value) {
            callback();
            return;
        }
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(value)) {
            callback(t("api.versionFormatInvalid"));
            return;
        }

        if (!currentVersion) {
            callback();
            return;
        }

        const [major, minor, patch] = value.split(".").map(Number);
        const [currMajor, currMinor, currPatch] = currentVersion
            .split(".")
            .map(Number);

        if (
            major < currMajor ||
            (major === currMajor && minor < currMinor) ||
            (major === currMajor && minor === currMinor && patch < currPatch)
        ) {
            callback(t("api.versionMustNotDecrease"));
            return;
        }
        callback();
    };

    return (
        <>
            <Form.Item
                label={t("api.newVersion")}
                labelCol={currentLanguage === "en-US" ? { span: 7 } : undefined}
                wrapperCol={
                    currentLanguage === "en-US" ? { span: 17 } : undefined
                }
                field="new_version"
                initialValue={suggestVersionPlaceholder}
                rules={[
                    {
                        required: true,
                        message: t("api.newVersionRequired"),
                    },
                    {
                        validator: validateVersion,
                    },
                ]}
            >
                <Input placeholder={suggestVersionPlaceholder} allowClear />
            </Form.Item>
        </>
    );
};

export default CompleteIterationForm;
