import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 导入语言资源
import zhCN from "./locales/zh-CN.json";
import enUS from "./locales/en-US.json";
import { applyContentOverride, parseContentOverride } from "./contentOverride";

const contentOverride = parseContentOverride(
    import.meta.env.VITE_CONTENT_OVERRIDE,
);

const resources = {
    "zh-CN": {
        translation: applyContentOverride(zhCN, contentOverride, "zh-CN"),
    },
    "en-US": {
        translation: applyContentOverride(enUS, contentOverride, "en-US"),
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "zh-CN",
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    });

export default i18n;
