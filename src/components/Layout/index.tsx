import React from "react";
import { Outlet } from "react-router-dom";
import { Layout as ArcoLayout, Watermark } from "@cloud-materials/common";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import styles from "./index.module.less";
import { useUser } from "@/hooks/useUser";

const ArcoHeader = ArcoLayout.Header;
const ArcoSider = ArcoLayout.Sider;
const ArcoContent = ArcoLayout.Content;
const ArcoFooter = ArcoLayout.Footer;

const Layout: React.FC = () => {
    const { user, logout, openLoginModal, openModifyPasswordModal } = useUser();
    return (
        <ArcoLayout className={styles.layout}>
            <ArcoHeader style={{ position: "sticky", top: 0, zIndex: 1000 }}>
                <Header
                    user={user}
                    logout={logout}
                    openLoginModal={openLoginModal}
                    openModifyPasswordModal={openModifyPasswordModal}
                />
            </ArcoHeader>
            <ArcoLayout className={styles.body}>
                <ArcoSider style={{ width: 200 }}>
                    <Sidebar />
                </ArcoSider>
                <ArcoContent className={styles.content}>
                    <div className={styles.page}>
                        <Watermark
                            content={user?.username || "Guest"}
                            fontStyle={{ color: "#9ca2a919" }}
                            style={{ height: "100%" }}
                        >
                            <Outlet />
                        </Watermark>
                    </div>
                </ArcoContent>
            </ArcoLayout>
            <ArcoFooter className={styles.footer}>
                <Footer />
            </ArcoFooter>
        </ArcoLayout>
    );
};

export default Layout;
