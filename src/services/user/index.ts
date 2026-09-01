// service层：只关心http请求，不关心业务逻辑
import { api } from "@/request";
import type {
    GetUserByUsernameOrNicknameOrEmailResponse,
} from "./types";

const prefix = "/v1/user";

// 通过用户名或昵称或邮箱获取用户信息
export const GetUserByUsernameOrNicknameOrEmail = async (
    username_or_nickname_or_email: string
) => {
    return api.get<GetUserByUsernameOrNicknameOrEmailResponse>(
        `${prefix}/getUserByUsernameOrNicknameOrEmail`,
        { username_or_nickname_or_email }
    );
};
