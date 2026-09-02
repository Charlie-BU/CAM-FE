import { Space, Typography } from "@cloud-materials/common";
import { useTranslation } from "react-i18next";

import styles from "./index.module.less";
import type { GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem } from "@/cam-auto-generate/CAMService/namespaces";
import { userAvatar } from "@/utils";

const { Title, Text } = Typography;

// 已登录欢迎区块
const WelcomeLoggedIn: React.FC<{
    user: GetUserByUsernameOrNicknameOrEmail200ResponseUsersItem;
    loading?: boolean;
}> = ({ user }) => {
    const { t } = useTranslation();
    const displayName = user.nickname || user.username;
    return (
        <div className={styles.hero}>
            <Space size={12} align="center">
                {userAvatar([user], 40)}
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
