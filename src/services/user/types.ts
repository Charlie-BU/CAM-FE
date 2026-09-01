export interface UserResponse {
    status: number;
    message: string;
    user: UserProfile;
}

export interface UserProfile {
    id: number;
    username: string;
    nickname: string;
    email: string;
    role: string;
    level: number;
    created_at: string;
}

export interface GetUserByUsernameOrNicknameOrEmailResponse {
    status: number;
    message: string;
    users: UserProfile[];
}

export type UserRole =
    | "frontend"
    | "backend"
    | "fullstack"
    | "qa"
    | "devops"
    | "product_manager"
    | "designer"
    | "architect"
    | "proj_lead"
    | "guest";
