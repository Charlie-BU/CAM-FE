import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import type { UserProfile } from "@/services/user/types";

export interface PlatformContextValue {
    user: UserProfile | null;
    accessToken: string;
    apiBase: string;
    locale: string;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider = ({
    value,
    children,
}: PropsWithChildren<{ value: PlatformContextValue }>) => (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
);

// This hook intentionally shares the module with its provider as the public MFE contract.
// eslint-disable-next-line react-refresh/only-export-components
export const usePlatform = () => {
    const value = useContext(PlatformContext);
    if (!value) throw new Error("CAM must be rendered inside PlatformProvider");
    return value;
};
