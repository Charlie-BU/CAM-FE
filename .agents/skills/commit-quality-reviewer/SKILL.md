---
name: commit-quality-reviewer
description: 对 CAM-FE 指定改动范围执行差异质检，默认审查当前工作区；用户要求 review、代码质检、提交前检查或 commit 时使用。
---

# Commit Diff Quality Reviewer

用于审查 CAM-FE 指定范围的 diff。它是由 CDI-Pedestal 加载的 `cam/App` Module Federation remote，负责 CAM 业务界面、服务层、请求层和本地化，不拥有 Shell 登录或全局导航。只审查 diff 覆盖内容，不将历史问题伪装成本次问题。

## 三问主检

所有结论优先回答：改动是否合理；是否引入新问题；是否破坏调用方、Pedestal host、请求层、服务层、配置或运行链路。

## 范围、基线与白名单

- `working_tree_only`：默认，只审查未提交改动。
- `last_commit_only`：仅在用户明确说“上次/最近一次/已提交改动”时审查 `HEAD~1..HEAD`。
- `last_commit_plus_working_tree`：仅在用户明确要求混合范围时使用。
- `base_commit` 默认记录 `HEAD~1`；用户给出 commit id 时使用它。若用户要求“某次 commit 对比”却未给 id，先询问。
- 审查前读取本 skill 的 `docs/whitelist.md`。仅短期、可解释的问题可标记 `WAIVED`；密钥或隐私泄露、注入、认证绕过、无保护的不可逆破坏永不豁免。

## 执行步骤

1. 确认仓库为 `cam`，并检查 `vite.config.ts`、`src/remote.tsx`、`src/platform/`、`src/request/index.ts`、`src/services/` 与相关组件/host 消费方。
2. 解析范围、基线、文件列表与关键 hunks；对每个关键改动补读导入、类型、调用方、请求封装、路由、配置和错误路径。
3. 先做三问主检，再按通用基线与项目清单审查；只报告高置信度（通常超过 80%）问题。
4. 记录实际执行的验证。无法运行、环境缺失和未授权外部验证都必须明确标为未验证。

## 通用审查基线

- `CRITICAL`：密钥、密码、token 或隐私数据泄露；脚本/模板/注入风险；认证或授权绕过；无保护的不可逆数据删除或结构破坏。
- `HIGH`：功能回归、空值/错误路径崩溃、吞错、竞态或资源泄漏；公共合同破坏且没有迁移或兼容策略。
- `MEDIUM`：明显重复 I/O、N+1、热路径性能退化；关键失败路径无足够上下文；高风险改动没有最小验证。
- `LOW`：调试输出、注释旧代码、陈旧 TODO、重复逻辑、歧义命名、散落魔法值。

## CAM-FE 项目清单

### CRITICAL

- `VITE_*`、源码、浏览器存储、日志或构建产物泄露 `CAM_UPSTREAM_BASE_URL` 中的敏感信息、服务端密钥、平台 access token 或用户资料。
- 组件或服务绕过平台传入的认证和 `onUnauthorized`，伪造/固化 token，或使不同用户的状态相互可见。
- 直接将不可信服务端/用户内容注入 HTML、URL 或危险渲染 API，造成 XSS 或执行风险。

### HIGH

- `PlatformContextValue`、`cam/App` props、`setPlatformAuth`、`setApiBase` 或卸载清理变更后与 CDI-Pedestal host 不兼容，留下陈旧 token provider 或错误 API base。
- `src/request/index.ts` 的 `/api` base、Bearer header、401 回调、超时或 `ApiError` 的 status/data 语义退化；组件/服务自行拼接后端地址、认证头或吞掉错误。
- `VITE_CAM_PUBLIC_BASE_URL`、manifest、`remoteEntry.js`、public path、CORS、共享 React/React Router 或 Vite exposure 改动导致 host 加载错误资源、得到 HTML/MIME 错误或双 React。
- 服务合同、参数树编辑、迭代提交或用户状态变更后，类型、调用方、错误/加载/空态和本地化没有同步。

### MEDIUM / LOW

- hook effect 依赖、请求竞态、重复请求或长列表渲染导致可见性能/状态问题；没有最小回归验证。
- `zh-CN.json` 与 `en-US.json` 文案漂移；Docker/Caddy、README 和开发/部署环境变量约定不一致。
- 仅针对生产代码中的临时调试、重复逻辑、过宽泛的 `catch` 或不可诊断错误给出 LOW/MEDIUM 结论。

## 验证

先阅读根目录 `AGENTS.md` 与 `docs/UTSpec.md`。当前没有已提交测试运行器，禁止杜撰 Vitest/Jest/Playwright 结果。

- 源码、样式或配置变更：运行 `pnpm lint`。
- TypeScript、Vite、federation、请求层、资源或打包入口变更：运行 `pnpm build`。
- 修改 remote-host 合同：同时验证 CDI-Pedestal 构建；具体未验证范围如实报告。
- 真实后端、平台账号、部署 host 或数据只在用户明确授权后使用。

## 审阅后的可选 E2E 验收

审查完成后，若 diff 影响 remote 加载、认证、请求、Service/API/迭代流程、表单编辑、路由或用户可见失败路径，必须单独询问用户是否需要开发态浏览器 E2E 验收。审查本身不包含 E2E，不得把 lint、build 或静态检查表述为 E2E 通过。

仅在用户确认后执行，并先完整阅读官方 `computer-use` skill。只使用当前源码的开发态组合：Pedestal 默认 `http://localhost:9000`，CAM remote 默认 `http://localhost:9100`。不得用 Railway/生产 Caddy 地址、已部署 manifest 或其他项目窗口替代；不重启、终止或干扰用户已运行的开发进程。

1. 先建立验收矩阵：每个改动对应的直接业务行为、服务/请求层下游、Pedestal host 消费方和关键失败路径。
2. 确认浏览器页面实际来自当前本地开发地址；服务探测受沙箱影响时，以已核验的浏览器页面为准，不据此启动重复服务。
3. 走完整用户路径。至少验证一条成功路径及适用的 401、失败、空态、校验失败或回退路径。没有测试账号、需要真实数据、付费、第三方授权或不可逆操作时停下并请求范围授权。
4. 观察浏览器控制台、网络请求与可见状态：manifest/assets 是否从 CAM 加载，`/api` 是否由同源代理处理，token/401 回调是否正确，错误是否保留状态与上下文。
5. 结束时恢复临时 DevTools、测试页和非持久 UI 状态；不删除用户数据。报告每项矩阵的 PASS/FAIL/NOT VERIFIED、证据、异常归因和遗留风险。

## 提交模式

仅在用户明确要求 commit 时执行。存在未豁免的 `CRITICAL` 或 `HIGH` 时停止提交。先审查同一范围，再逐项 `git add <明确文件>`、复核 staged diff，排除 `.env`、token、日志和硬编码本地路径；使用单一意图的 Conventional Commit：`<type>(<scope>): <imperative summary>`。不得 `git add .`、`git add -A` 或 `--no-verify`。

当范围为 `last_commit_only` 时，在审查结果末尾建议（但不自动执行）`commit-update-writer` 为该次改动写入 `docs/COMMITLOG.md`。

## 输出格式

先给 Findings，再给 Testing 和 Summary；无问题时也明确说明。每个问题列出 File、Evidence、Risk、Fix 与 `OPEN | WAIVED` 状态。

```markdown
## Core Check

- Reasonableness: PASS | WARN | FAIL
- New Issues Introduced: NO | YES
- Dependency Impact: SAFE | RISKY | BROKEN

## Findings

- [HIGH] <标题>
  - File: <path>
  - Evidence: <代码或行为>
  - Risk: <风险>
  - Fix: <可执行建议>
  - Status: OPEN | WAIVED

## Testing

- PASS | FAIL | NOT RUN: `<command>` — <范围或原因>

## Summary

| Severity | Count(Open) | Count(Waived) |
| -------- | ----------: | ------------: |
| CRITICAL |           0 |             0 |
| HIGH     |           0 |             0 |
| MEDIUM   |           0 |             0 |
| LOW      |           0 |             0 |

Decision: BLOCK | WARN | PASS
Base Commit: <sha>
Compared Scope: <scope>
Compared Range: <actual range>
```

`BLOCK` 表示存在 OPEN 的 `CRITICAL`；`WARN` 表示无 CRITICAL 但存在 OPEN 的 `HIGH`；其余为 `PASS`。
