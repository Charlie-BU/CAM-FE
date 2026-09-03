# CAM-FE Agent Guide

## Project scope

CAM-FE is the CAM business frontend. It is consumed by CDI-Pedestal through Module Federation and owns CAM screens, service/API management flows, request-layer behavior, and CAM localization. It does not own the CDI shell navigation or independent platform login state.

## Agent resources

- Repository-local agent skills and related guidance live under `.agents/skills/`. Check that directory for CAM-FE specific review, commitlog, documentation, and React best-practice workflows.

## Toolchain and commands

- Use `pnpm`; this repository includes `pnpm-lock.yaml`.
- `pnpm dev` starts the Vite remote (default port `9100`). Set `CAM_UPSTREAM_BASE_URL` locally; it is a server-side proxy target, not a browser value.
- `pnpm lint` runs ESLint.
- `pnpm build` runs `tsc -b` followed by a production Vite build.
- There is no committed unit-test runner at present. Do not invent test commands or claim a test suite passed. Add focused tests with the test tooling in the same change when introducing it.

## Architecture boundaries

- Expose CAM through `cam/App` in `src/remote.tsx`; preserve the Module Federation public-path and shared dependency configuration.
- `PlatformContextValue` is supplied by CDI-Pedestal. The remote receives the user, access token, CAM API base, locale, and unauthorized callback; it must not create a separate shell session or global navigation.
- Send API traffic through `src/request/index.ts` and the domain modules in `src/services/`. Keep `/api` as the same-origin default and let Vite/Caddy proxy it to `CAM_UPSTREAM_BASE_URL`.
- Keep access-token lookup and 401 handling in the request layer. Components and services must not duplicate `Authorization` headers or suppress `ApiError` details.
- When modifying `PlatformContextValue`, remote mounting, or federation output, coordinate the matching contract and build verification with CDI-Pedestal.
- Never place server secrets in `VITE_*` variables, browser code, fixtures, or logs.

## Implementation conventions

- Use `@/` aliases for source imports. Keep domain behavior in `src/services/`, request concerns in `src/request/`, stateful orchestration in hooks, and rendering in components.
- TypeScript / React 注释：函数、类、接口、类型别名、枚举、常量、导出组件与其他必要声明前建议添加 `/** 声明名称：用途。 */` 形式的中文单行 JSDoc 注释；注释仅说明声明的功能或用途，不描述实现细节、背景或设计理由；对象属性、局部变量与简单 JSX 无需逐项注释。
- Update both `zh-CN.json` and `en-US.json` for user-visible text.
- 禁止在 `src/` 中直接写入用户可见文案（包括 JSX 文本、按钮/菜单标题、表单标签与占位符、弹窗/提示消息及可见错误信息）。必须通过 i18n key 读取，并同步维护 `zh-CN.json` 与 `en-US.json`；品牌名、URL、技术标识和代码注释除外。
- Preserve async loading, error, empty, and cleanup states in interactive flows. Avoid direct backend URL construction in components.
- Preserve existing user changes outside the requested scope. Inspect `git status` before editing and stage explicit files only when committing.

## Validation expectations

- 涉及生产代码、测试、Vite/federation、请求层、remote-host 合同、业务交互或构建入口的改动，先阅读 [`docs/UTSpec.md`](docs/UTSpec.md)，并按其中的分层、隔离和提交前闭环执行。
- Run `pnpm lint` for source changes when the environment permits.
- Run `pnpm build` for TypeScript, Vite configuration, federation, request-layer, asset, or packaging changes.
- For remote-host contract changes, validate both CAM-FE and CDI-Pedestal builds and report any part that could not be run.
- Report executed commands, failures, and skipped checks accurately; static inspection is not an E2E result.
