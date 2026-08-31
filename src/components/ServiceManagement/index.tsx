import React from "react";

import styles from "./index.module.less";
import { useUser } from "@/hooks/useUser";
import { usePlatform } from "@/platform";
import LoggedInView from "./LoggedInView";
import { WelcomeGuest } from "./WelcomeView";

const ServiceManagement: React.FC = () => {
    const { user } = usePlatform();
    const { getUserByUsernameOrNicknameOrEmail } = useUser();
    if (!user) {
        return (
            <div className={styles.home}>
                <WelcomeGuest />
            </div>
        );
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
