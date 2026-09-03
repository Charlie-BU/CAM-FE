import { IconInfoCircle, Tooltip } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";

const MultiTypeParamHint = () => {
    const { t } = useTranslation();
    return <Tooltip content={<div style={{ maxWidth: 420, lineHeight: 1.6, whiteSpace: "pre-line" }}>{t("api.multiTypeParameterHint")}</div>}><IconInfoCircle /></Tooltip>;
};

export default MultiTypeParamHint;
