import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const apiEnv = loadEnv(mode, process.cwd(), "CAM_UPSTREAM_");
    const PORT = Number(env.VITE_FE_PORT) || 9100;
    const cloudMaterialsPath = fileURLToPath(
        new URL("./cloud-materials-common/@cloud-materials/common", import.meta.url)
    );
    const nativeMapShimPath = fileURLToPath(
        new URL("./src/shims/babel-runtime-map.ts", import.meta.url)
    );

    return {
        base:
            env.VITE_CAM_PUBLIC_BASE_URL ||
            (mode === "development" ? `http://localhost:${PORT}` : "/"),
        plugins: [
            react(),
            federation({
                name: "cam",
                filename: "remoteEntry.js",
                manifest: true,
                dts: false,
                exposes: {
                    "./App": "./src/remote.tsx",
                },
                shared: {
                    react: { singleton: true },
                    // Vite dev 的共享 facade 不暴露 createPortal 等具名导出；
                    // 仅让生产构建共享 react-dom，避免公共组件库预构建失败。
                    ...(command === "build"
                        ? { "react-dom": { singleton: true } }
                        : {}),
                    "react-router-dom": { singleton: true },
                },
            }),
        ],
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
                "@cloud-materials/common": cloudMaterialsPath,
                // `@storage-fe/formily-arco` 会引入这个 core-js-pure 包装模块。
                // Vite 在生产构建时转换 CommonJS，可能将其默认导出转换为不可构造的对象。
                // 现代浏览器已原生支持 Map，因此这里将该模块解析为原生 Map 构造函数。
                "@babel/runtime-corejs3/core-js-stable/map": nativeMapShimPath,
            },
            dedupe: ["react", "react-dom"],
        },
        server: {
            port: PORT,
            origin: `http://localhost:${PORT}`,
            cors: true,
            proxy: {
                "/api": {
                    target: apiEnv.CAM_UPSTREAM_BASE_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ""),
                },
            },
        },
        build: { target: "chrome89" },
    };
});
