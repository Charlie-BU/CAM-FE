import { Space, Typography } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";

import styles from "./index.module.less";
import type { UserProfile } from "@/services/user/types";
import { userAvatar } from "@/utils";

const { Title, Text } = Typography;

// 已登录欢迎区块
const WelcomeLoggedIn: React.FC<{
    user: UserProfile;
    loading?: boolean;
}> = ({ user }) => {
    const { t } = useTranslation();
    const displayName = user.nickname || user.username;
    return (
        <div className={styles.hero}>
            <Space size={12} align="center">
                {userAvatar([user] as UserProfile[], 40)}
                <div>
                    <Title heading={4} className={styles.title}>
                        {t("service.welcomeTitle")}
                    </Title>
                    <Text className={styles.subtitle}>
                        {t("service.welcomeBack")}
                        {displayName}
                    </Text>
                </div>
            </Space>
        </div>
    );
};

export { WelcomeLoggedIn };
