import { useCallback } from "react";
import { CAMService } from "@/services/CAMService";
import i18n from "@/i18n";

const t = i18n.t.bind(i18n);

export const useUser = () => {
    const getUserByUsernameOrNicknameOrEmail = useCallback(
        async (usernameOrNicknameOrEmail: string) => {
            const res = await CAMService.GetUserByUsernameOrNicknameOrEmailGET({
                username_or_nickname_or_email: usernameOrNicknameOrEmail,
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || t("user.fetchFailure"));
            }
            return res.users || [];
        },
        [],
    );

    return { getUserByUsernameOrNicknameOrEmail };
};
