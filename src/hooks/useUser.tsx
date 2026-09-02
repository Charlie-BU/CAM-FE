import { useCallback } from "react";
import { CAMService } from "@/services/CAMService";

export const useUser = () => {
    const getUserByUsernameOrNicknameOrEmail = useCallback(
        async (usernameOrNicknameOrEmail: string) => {
            const res = await CAMService.GetUserByUsernameOrNicknameOrEmailGET({
                username_or_nickname_or_email: usernameOrNicknameOrEmail,
            } as never);
            if (res.status !== 200) {
                throw new Error(res.message || "获取用户信息失败");
            }
            return res.users || [];
        },
        [],
    );

    return { getUserByUsernameOrNicknameOrEmail };
};
