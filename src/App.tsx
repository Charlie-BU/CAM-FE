import React, { useEffect, useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.less";
import { useUser } from "@/hooks/useUser";
import CamApp from "@/remote";
import type { PlatformContextValue } from "@/platform";
import i18n from "@/i18n";

const App: React.FC = () => {
    const {
        user,
        fetchUser,
        openLoginModal,
        openRegisterModal,
        logout,
    } = useUser();
    const accessToken = localStorage.getItem("cam_access_token") || "";

    useEffect(() => {
        const token = localStorage.getItem("cam_access_token");
        if (token && !user) {
            fetchUser();
        }
    }, [fetchUser, user]);

    const platform = useMemo<PlatformContextValue>(
        () => ({
            user,
            accessToken,
            locale: i18n.resolvedLanguage || "zh-CN",
            openLoginModal,
            openRegisterModal,
            logout,
        }),
        [accessToken, logout, openLoginModal, openRegisterModal, user],
    );

    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Navigate to="/cam" replace />} />
                <Route path="cam/*" element={<CamApp platform={platform} />} />
                <Route path="*" element={<Navigate to="/cam" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
