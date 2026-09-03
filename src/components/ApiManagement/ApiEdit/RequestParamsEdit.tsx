import { IconCommon, Space, Tabs, Form } from "@cloud-materials/common";
import ParamTable from "./ParamTable";
import MultiTypeParamHint from "./MultiTypeParamHint";
import { tabKeys } from "./index";
import { useTranslation } from "react-i18next";

interface RequestParamsEditProps {
    reqParamsActiveTab: string;
    setReqParamsActiveTab: (key: string) => void;
    setRejectSubmit: (reject: boolean) => void;
}

const RequestParamsEdit = ({
    reqParamsActiveTab,
    setReqParamsActiveTab,
    setRejectSubmit,
}: RequestParamsEditProps) => {
    const { t } = useTranslation();
    const tabs = tabKeys.map((key) => ({ key, title: t(`api.parameterLocations.${key}`) }));
    return (
        <Space direction="vertical" size={12}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
                <IconCommon /> {t("api.requestParameters")} <MultiTypeParamHint />
            </div>
            <Tabs
                activeTab={reqParamsActiveTab}
                onChange={setReqParamsActiveTab}
            >
                {tabs.map((tab) => (
                    <Tabs.TabPane key={tab.key} title={tab.title} />
                ))}
            </Tabs>

            <div>
                {tabs.map((tab) => (
                    <div
                        key={tab.key}
                        style={{
                            display:
                                reqParamsActiveTab === tab.key
                                    ? "block"
                                    : "none",
                        }}
                    >
                        <Form.Item
                            field={`request_params_by_location.${tab.key}`}
                            triggerPropName="value"
                            noStyle
                        >
                            <ParamTable
                                type="request"
                                location={tab.key}
                                setRejectSubmit={setRejectSubmit}
                            />
                        </Form.Item>
                    </div>
                ))}
            </div>
        </Space>
    );
};

export default RequestParamsEdit;
