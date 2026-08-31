import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ApiManagement from "@/components/ApiManagement";
import ServiceManagement from "@/components/ServiceManagement";
import { Message } from "@cloud-materials/common";
import { t } from "i18next";
import { usePlatform } from "@/platform";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    const { accessToken } = usePlatform();

    useEffect(() => {
        if (!accessToken) {
            Message.warning(t("common.loginFirst"));
        }
    }, [accessToken]);

    if (!accessToken) {
        return <Navigate to="/cam" replace />;
    }
    return children;
};

export const CamRoutes = () => (
    <Routes>
        <Route index element={<ServiceManagement />} />
        <Route
            path="service"
            element={
                <RequireAuth>
                    <ApiManagement />
                </RequireAuth>
            }
        />
        <Route path="*" element={<Navigate to="/cam" replace />} />
    </Routes>
);
