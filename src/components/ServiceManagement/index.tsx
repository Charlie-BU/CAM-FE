import React from "react";
import { Spin } from "@cloud-materials/common";

import { useUser } from "@/hooks/useUser";
import { usePlatform } from "@/platform";
import LoggedInView from "./LoggedInView";

const ServiceManagement: React.FC = () => {
    const { user } = usePlatform();
    const { getUserByUsernameOrNicknameOrEmail } = useUser();
    if (!user) {
        return <Spin dot loading />;
    }
    return (
        <LoggedInView
            user={user}
            getUserByUsernameOrNicknameOrEmail={
                getUserByUsernameOrNicknameOrEmail
            }
        />
    );
};

export default ServiceManagement;
