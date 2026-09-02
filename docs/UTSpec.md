# CAM-FE 单元测试规范

本文适用于 CAM-FE：一个 React 18 + TypeScript + Vite 的 CAM Module Federation remote。它负责 CAM Service/API/迭代业务界面、`cam/App` 平台接入、Axios 请求层、服务模块、路由和中英文文案；CDI-Pedestal 负责 Shell 登录与全局导航。本规范不在前端测试中访问真实 CAM 后端、已部署 Pedestal、真实平台 token 或用户数据。

本文不引入 CI。提交前由开发者在本地执行受影响测试与质量检查；将来接入 CI 时应复用本文的命令和边界，不能为 CI 放宽隔离要求。

## 1. 目标与边界

- 用确定性、离线的测试守住 remote-host 合同、认证注入、请求/错误映射、业务服务调用、路由、表单交互和本地化。
- 测试覆盖 `src/` hand-written 代码。依赖生成/外部包时测试其上层适配与可见行为，不测试第三方库内部实现。
- 测试失败应能定位为纯逻辑、组件/Hook、请求适配、remote 合同或页面集成问题，不依赖真实 token、真实 Service/API 数据、Cookie 或外网。
- 单测不替代 CDI-Pedestal + CAM-FE 浏览器 E2E、真实后端联调或发布产物验证；它们应独立标记并在用户授权后执行。

## 2. 基线工具与执行方式

当前仓库尚未接入测试运行器。首次引入测试时，统一使用 **Vitest + jsdom + React Testing Library**，匹配现有 React 18、Vite 7、ESM 与 pnpm 链路；不得混用 Jest、Node 原生测试或多套断言库。

首次接入时增加：

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

并增加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:typecheck": "tsc --noEmit -p tsconfig.test.json",
    "test:coverage": "vitest run --coverage",
    "check": "pnpm test && pnpm test:typecheck && pnpm lint && pnpm build"
  }
}
```

新增 `vitest.config.ts`，复用 React 插件并配置 `environment: "jsdom"`、`include: ["test/**/*.{test,spec}.{ts,tsx}"]`、`setupFiles: ["./test/setup.ts"]`。`test/setup.ts` 导入 `@testing-library/jest-dom/vitest`，提供最小浏览器 API stub；`tsconfig.test.json` 继承 `tsconfig.app.json` 并只纳入 test 与 Vitest 类型，测试不进入生产产物。

接入后使用：

```bash
pnpm test
pnpm test:watch
pnpm exec vitest run test/request/index.test.ts
pnpm exec vitest run --testNamePattern='401 调用平台未授权回调' test/request/index.test.ts
pnpm test:typecheck
pnpm lint
pnpm build
```

## 3. 目录、命名与结构

测试与源码分离，放在仓库根 `test/`：

```text
CAM-FE/
├── src/
│   ├── components/
│   ├── platform/
│   ├── request/
│   └── services/
└── test/
    ├── platform/context.test.tsx
    ├── request/index.test.ts
    ├── remote.test.tsx
    ├── router.test.tsx
    ├── services/service.test.ts
    ├── components/service-management.test.tsx
    ├── integration/remote-host-contract.test.tsx
    ├── fixtures/
    ├── helpers/
    └── setup.ts
```

- 使用 `<module>.test.ts` 或 `<component>.test.tsx`；同一目录保持一种后缀风格。
- `describe` 命名模块或合同，`it`/`test` 描述可观察结果；单文件聚焦一个职责。
- `fixtures/` 只放脱敏 Service/API/user/错误 response；`helpers/` 只放 render wrapper、假 host、请求 Fake 和数据工厂。不得将业务逻辑挪到 helper。
- 跨 `remote.tsx`、平台上下文、request 和路由的组合场景放入 `test/integration/`。

## 4. Mock 与隔离原则

| 边界 | 单测做法 |
| --- | --- |
| Axios / CAM HTTP API | 用受控 Axios adapter 或 mock transport 验证 method、URL、body、params、header、响应和错误映射；禁止真实请求。 |
| CDI-Pedestal host | 用 `PlatformContextValue` Fake 挂载 `CamApp`；不加载真实 Pedestal/manifest。 |
| i18n、Router、组件库 | 使用最小真实 provider 或稳定 Fake，断言用户可见文本、角色、输入与导航，不断言内部 class/动画。 |
| storage、时间、timer | 使用内存 Fake、Vitest fake timer 或显式注入；每例清理 provider、spy、环境变量与模块状态。 |
| 浏览器 API | 在 `test/setup.ts` 提供最小 jsdom stub；只断言可观察 UI 行为。 |

禁止：真实 access token、用户资料、生产地址、私有 API/构建凭据进入 fixture、快照、错误或日志；mock 被测单元核心实现；组件里直接调用真实 Axios；大型页面/完整原始 response 快照；以私有调用次数替代可见结果与请求副作用。

## 5. 分层覆盖要求

### 5.1 平台上下文与 remote：`src/platform/`、`src/remote.tsx`

- `usePlatform` 在 provider 外抛出明确错误，在 provider 内返回原值；`PlatformProvider` 不篡改 user、token、apiBase、locale 或 `onUnauthorized`。
- `CamApp` 初次装载时调用 `setPlatformAuth`/`setApiBase`，更新 props 时刷新 token、API base 与 i18n locale，卸载时清理认证 provider。
- 模拟 `onUnauthorized`，确认远程请求层能回调 host，而 remote 不自行实现 Shell 登录/跳转。
- `CamRoutes` 覆盖默认 Service 页面、`service` 页面和未知路由回退；与 Pedestal `/cam/*` 基路径组合时不产生错误绝对跳转。

### 5.2 请求层：`src/request/index.ts`

- 默认 base 为 `/api`；`setApiBase` 替换实例 base，且后续请求使用最新值。
- 有 token 时唯一地注入 `Authorization: Bearer <token>`；无 token 或 provider 抛错时不添加陈旧 header；provider 改变后不复用前一用户 token。
- 401 调用当前 `onUnauthorized`；其他失败转为含 `message`、`status` 和 `data` 的 `ApiError`，不吞掉 response 信息。
- `get`/`post`/`put`/`patch`/`del` 正确传递 params、body 与 Axios config，只返回 `response.data`；覆盖网络错误、超时和空 response。

### 5.3 服务层：`src/services/`

- 每个 Service/API/User/AI 手写封装覆盖 URL、HTTP method、请求参数/体、响应类型归一与错误透传；组件不能另行拼接相同请求。
- Service 迭代、API 参数树和 AI 草稿等改动至少覆盖正常 response、空集合、非法/缺失字段、后端错误和用户取消/返回路径（适用时）。
- 类型改变时测试请求构造与消费组件是否同步，不用 `as any`、过宽 Mock 或大型 response 快照掩盖合同漂移。

### 5.4 组件与 Hook：`src/components/`、`src/hooks/`

- Service 列表、详情、删除/恢复、迭代、API 编辑和个人资料等受影响交互，覆盖 loading、成功、空态、错误、表单校验、取消/返回和卸载清理。
- 使用 `userEvent` 触发真实输入、点击和键盘行为；断言按钮可访问名称、页面文本、表单值和可观察请求，不绑定组件库内部 DOM。
- 对更新/删除等副作用操作，先验证用户意图、成功刷新和失败后稳定状态；测试不得实际修改后端数据。

### 5.5 federation、构建与本地化合同

- Vite 配置变更至少验证 `cam/App` exposure、manifest、`remoteEntry.js`、public path、CORS、shared React/React Router 和 dedupe 意图；无需请求真实 host。
- `VITE_CAM_PUBLIC_BASE_URL` 在生产构建场景必须生成可从 remote 自身定位资源的 base；`/api` 仅由 Vite/Caddy 代理，不在组件写后端 URL。
- 用户可见新增/修改文案同步覆盖 `zh-CN.json` 与 `en-US.json` key，并验证至少一条实际渲染的翻译。

## 6. 测试数据与断言

- 使用 `test-access-token`、`test-user-001`、`service-001`、`api-001` 等虚构值；不得出现真实用户、token、后端域名或 GitHub 凭据。
- 每例创建可变输入，避免修改共享 fixture；`afterEach` 恢复 mock、timer、storage、环境变量、i18n 语言和 request-level provider。
- 组件优先用 `getByRole`、`getByLabelText`、`findByText` 与 `userEvent`；请求层断言最小 URL/header/body/错误字段。
- 安全相关断言加反向检查，确保 token、机密字段不出现在 UI、错误消息或序列化输出。

## 7. 提交前本地闭环

当前未接入测试运行器时，新增或显著改变 hand-written 逻辑应优先同时落地本节测试基线与最小测试，而不能把“暂无测试”当作永久豁免。

接入后：

1. 确定改动属于平台合同、请求、服务、组件/表单、路由、i18n 或 federation，并列出正常、边界、失败与清理路径。
2. 先运行最小受影响测试；失败时最小化修复实现/预期并重跑。
3. 运行 `pnpm test`、`pnpm test:typecheck`、`pnpm lint` 和 `pnpm build`；可用 `pnpm check` 汇总。
4. remote-host 合同变更还需运行 CDI-Pedestal 对应测试/构建；真实后端和浏览器 E2E 只在用户授权后单独执行和报告。
5. 检查 fixture、快照、mock、日志和提交内容不包含 token、Cookie、真实用户数据、生产 URL 或密钥。

纯文档或不影响交互行为的样式改动可说明无需新增单测，但仍应运行受影响的 lint/build。

## 8. 评审检查清单

- [ ] hand-written 逻辑有适当的 `test/*.test.ts(x)`，且测试在正确职责层。
- [ ] 平台合同覆盖装载、更新、401 回调与卸载清理；remote 不接管 Shell 登录。
- [ ] 请求层覆盖 token、API base、method/body/params、401、网络错误和 `ApiError`。
- [ ] 受影响业务 UI 覆盖 loading、成功、空态、错误和适用的取消/校验路径。
- [ ] HTTP、host、storage、时间、i18n 和浏览器 API 已隔离；没有真实网络。
- [ ] 中英文文案、manifest/public path/代理与消费者合同同步；真实 token 或用户资料不进入测试产物。
- [ ] 已运行受影响测试、`pnpm test`、`pnpm test:typecheck`、`pnpm lint`、`pnpm build`，或如实说明尚未接入/未运行原因。

## 9. 演进原则

真实浏览器、跨 host/remote、真实认证或视觉回归属于单独 E2E；不得放宽本文离线、确定性单测边界。只有 Vitest、Testing Library、Fake host 或可注入 transport 无法清晰表达的场景，才评估新工具，并保持目录、隐私和本地闭环要求不变。
