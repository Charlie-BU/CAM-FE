import { useCallback } from "react";
import { GetUserByUsernameOrNicknameOrEmail } from "@/services/user";

export const useUser = () => {
    const getUserByUsernameOrNicknameOrEmail = useCallback(
        async (usernameOrNicknameOrEmail: string) => {
            const res = await GetUserByUsernameOrNicknameOrEmail(
                usernameOrNicknameOrEmail,
            );
            if (res.status !== 200) {
                throw new Error(res.message || "获取用户信息失败");
            }
            return res.users || [];
        },
        [],
    );

    return { getUserByUsernameOrNicknameOrEmail };
};
