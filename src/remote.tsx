import { useEffect } from "react";
import { PlatformProvider } from "@/platform";
import type { PlatformContextValue } from "@/platform";
import { setApiBase, setPlatformAuth } from "@/request";
import { CamRoutes } from "@/router";
import i18n from "./i18n";
import "./App.less";

interface CamAppProps {
    platform: PlatformContextValue;
}

const CamApp = ({ platform }: CamAppProps) => {
    setPlatformAuth(() => platform.accessToken, platform.onUnauthorized);
    setApiBase(platform.apiBase);

    useEffect(() => {
        setPlatformAuth(() => platform.accessToken, platform.onUnauthorized);
        setApiBase(platform.apiBase);
        void i18n.changeLanguage(platform.locale);
        return () => setPlatformAuth();
    }, [
        platform.accessToken,
        platform.apiBase,
        platform.locale,
        platform.onUnauthorized,
    ]);

    return (
        <PlatformProvider value={platform}>
            <div className="cam-app">
                <CamRoutes />
            </div>
        </PlatformProvider>
    );
};

export type { PlatformContextValue };
export default CamApp;
