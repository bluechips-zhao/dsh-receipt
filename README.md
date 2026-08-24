<p align="center">中文 · <a href="./README.en.md">English</a></p>

# dsh-receipt — 会话消费小票插件

为 DeepSeek Harness Web GUI 增加"小票"：在每个会话的头部栏放一个小票按钮，
点击弹出该会话的消费小票（收据样式），展示：

- **按模型明细**：模型名称、调用次数、输入 / 缓存读 / 缓存写 / 输出 / 推理 token、小计费用；
- **合计**：调用次数、token 合计、模型耗时、会话跨度；
- **金额**：按模型定价表折算的费用（默认 ¥，货币符号可配置）；
- **出票时间**：最后一条计入事件的时间。

数据由 host 端 `receipt` 会话投影单元从会话日志折叠（复用 `assistant/message`
的 usage 与模型来源），随 `session/projection` 帧实时刷新；界面只负责展示，
不发任何 RPC。

## 安装

推荐从 GitHub 安装（无需本地构建）：

```sh
# 从 DeepSeek Harness checkout 目录执行（web profile 与 GUI 所在 profile 一致时）
pnpm dsh plugin --profile web add github:bluechips-zhao/dsh-receipt
```

安装后**重启 GUI**（小票按钮出现在会话头部右侧；打开会话后点击"小票"）。

> 仓库**提交了构建好的 `lib/`**（`exports` 指向 `lib/index.js` 与 `lib/client.js`），
> 因此用户安装的是开箱即用的产物，无需重复构建。若你把本仓库改名或移到别的
> 命名空间，请同步替换上面 `github:bluechips-zhao/dsh-receipt` 段。

## 构建（维护者）

只有**插件作者/维护者**需要构建；普通用户直接安装 `lib/` 产物即可。

前置：本机有 DeepSeek Harness checkout，且已 `pnpm install` 构建过
（`node_modules/.bin/tsc`、`tsdown` 可用）。本插件的构建依赖该 checkout 的
`harness` 平台模块表与 `lightningcss`，因此需在本仓库内建立两个 junction：

```powershell
# 在 dsh-receipt 目录内，按你本机布局调整目标路径
New-Item -ItemType Junction -Path node_modules -Target "$env:USERPROFILE\.dsh\profiles\node_modules"
New-Item -ItemType Junction -Path harness     -Target "<你的 DeepSeek Harness checkout 路径>"
```

然后：

```sh
pnpm run build      # tsc host + client 类型检查与产物，tsdown 出 lib/index.js + lib/client.js
```

产物契约：`lib/index.js`（host 插件入口）、`lib/client.js`（browser bundle，
`window.__ModuleLoader__.load` 包装）、`lib/types/**`（类型）。构建目标是把
`lib/` 更新到与 `src/` 一致；改动 `src/` 后请在发布前重新构建并提交 `lib/`。

## 配置（定价）

插件默认只内置 DeepSeek 官方长期公开的经典模型价格，其余模型显示"未计价"、
费用记 0。**请按你的实际账单配置价格**：在 profile 的
`cordis.patch.yml` 里对 `dsh-receipt` 行覆盖 `config`（整段替换）：

```yaml
# 在你的 profile 的 cordis.patch.yml 中（如 <DSH_HOME>/profiles/web/cordis.patch.yml）
- id: dsh-receipt
  config:
    currency: ¥
    pricing:
      deepseek-chat: { input: 2, cacheRead: 0.5, output: 8 }        # ¥/1M tokens
      deepseek-reasoner: { input: 4, cacheRead: 1, output: 16 }
      deepseek-v4-flash: { input: 1.5, cacheRead: 0.05, output: 4.5 }   # DeepSeek-V4 空闲时段
      deepseek-official/deepseek-v4-pro: { input: 4.5, cacheRead: 0.15, output: 13.5 }
      # deepseek-v4-flash-vision-exp 与上面 deepseek-v4-flash 同价，自动沿用，无需配置。
```

- 单价单位：**每 1M token 的货币额**；字段：`input` / `cacheRead` / `cacheWrite`
  / `output` / `reasoning`，缺省按 0 计。
- 键优先精确模型 id，其次 `provider/model` 复合键，再次**同价别名**基准模型
  （本插件不做跨 provider 冲突合并）。
- **同价别名**：`deepseek-v4-flash-vision-exp` 与 `deepseek-v4-flash` 同价，由内置
  `PRICING_ALIASES` 映射；配置了 `deepseek-v4-flash` 后 vision-exp 自动沿用其价格，
  无需重复配置（若单独配置 vision-exp，则以它自己的价格为准）。
- `currency` 只影响展示符号；改配置由 profile 配置 HMR **实时生效**，无需重启。

### DeepSeek-V4 峰谷定价说明（2026-08-17 官方生效）

DeepSeek-V4 系列采用**分时计价**：每日 9:00–14:00 为高峰时段，其余为空闲时段，
高峰价格是空闲的 2 倍（来源：[DeepSeek 官方调价公告](https://news.qq.com/rain/a/20260817V03S1500)、
[新浪财经](https://finance.sina.cn/2026-08-17/detail-ininqpez7895655.d.html?vt=4)）。

| 模型 | 时段 | 输入(缓存未命中) | 输入(缓存命中) | 输出 |
|---|---|---|---|---|
| deepseek-v4-flash | 空闲 | ¥1.5 | ¥0.05 | ¥4.5 |
| deepseek-v4-flash | 高峰 9:00–14:00 | ¥3.0 | ¥0.10 | ¥9.0 |
| deepseek-v4-pro | 空闲 | ¥4.5 | ¥0.15 | ¥13.5 |
| deepseek-v4-pro | 高峰 9:00–14:00 | ¥9.0 | ¥0.30 | ¥27.0 |

小票当前按**单一单价**计费（建议配置空闲时段价）；高峰时段的实际费用约为
小票金额的 2 倍。若需要按时段精确计价，可在小票插件后续版本中扩展
（按 step 时间戳折叠）。

## 验证

```sh
# 投影折叠逻辑单元断言（无依赖脚本，node 原生 type-stripping）
node --experimental-strip-types scripts/verify-projection.ts

# GUI 端到端检查（可选：需要本地 3080 的 dsh web 已启动，且装有 playwright chromium；
# 路径经环境变量配置，见 scripts/gui-check.mjs 顶部注释）
$env:RECEIPT_PLAYWRIGHT = '<DSH 仓库>/node_modules/.pnpm/playwright@<ver>/node_modules/playwright/index.js'
$env:RECEIPT_CHROMIUM    = '<本机 chromium.exe 路径>'
node scripts/gui-check.mjs

# 确认配置层已入组合
pnpm dsh --profile web --dump-config | findstr dsh-receipt
```

## 实现说明

- host 半：`src/projection.ts` 的 `receipt` 投影单元——纯同步折叠，state 为纯
  JSON（可持久化缓存），`view` 按注册时捕获的定价表现算费用；替换语义与
  `tokenUsage` 一致（同 step 的 chunk 采样 → 消息终值，整步替换不重复计数）。
- client 半：`conversation.session.header.actions` 的"小票"按钮 +
  `shell.overlay` 的小票弹层；打开状态经插件内模块级 store 协调，
  数据读 `useSessions` 行上的 `projectionValues.receipt`（实时帧驱动）。
- 依赖全部走 peer / profile fallback（`$DSH_HOME/profiles/node_modules`），
  不复制 Cordis / React / schemastery 运行时身份。
