import { useEffect } from "react";
import { PlatformProvider } from "@/platform";
import type { PlatformContextValue } from "@/platform";
import { setPlatformAuth } from "@/request";
import { CamRoutes } from "@/router";
import i18n from "./i18n";
import "./App.less";

interface CamAppProps {
    platform: PlatformContextValue;
}

const CamApp = ({ platform }: CamAppProps) => {
    setPlatformAuth(() => platform.accessToken, platform.logout);

    useEffect(() => {
        setPlatformAuth(() => platform.accessToken, platform.logout);
        void i18n.changeLanguage(platform.locale);
        return () => setPlatformAuth();
    }, [platform.accessToken, platform.locale, platform.logout]);

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
