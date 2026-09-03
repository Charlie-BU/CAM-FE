import React from "react";
import { useTranslation } from "react-i18next";
import "./App.less";

const App: React.FC = () => {
    const { t } = useTranslation();
    return <div>{t("app.loadThroughPedestal")}</div>;
};

export default App;
