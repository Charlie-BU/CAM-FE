import { Navigate, Route, Routes } from "react-router-dom";
import ApiManagement from "@/components/ApiManagement";
import ServiceManagement from "@/components/ServiceManagement";

export const CamRoutes = () => (
    <Routes>
        <Route index element={<ServiceManagement />} />
        <Route path="service" element={<ApiManagement />} />
        <Route path="*" element={<Navigate to="/cam" replace />} />
    </Routes>
);
