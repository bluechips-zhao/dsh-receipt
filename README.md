<p align="center">中文 · <a href="./README.en.md">English</a></p>

# dsh-receipt — 会话消费小票插件

为 DeepSeek Harness Web GUI 增加"小票"：在每个会话的头部栏放一个小票按钮，
点击弹出该会话的消费小票（收据样式），展示：
<img width="768" height="203" alt="image" src="https://github.com/user-attachments/assets/eeb3f912-a476-43bf-bc30-1001fafc8f06" />

- **按模型明细**：模型名称、调用次数、输入 / 缓存读 / 缓存写 / 输出 / 推理 token、小计费用；
- **合计**：调用次数、token 合计、模型耗时、会话跨度；
- **金额**：按模型定价表折算的费用（默认 ¥，货币符号可配置）；
- **出票时间**：最后一条计入事件的时间。
<img width="772" height="811" alt="image" src="https://github.com/user-attachments/assets/1594b007-0a9a-481b-83bc-76b03c70845b" />

数据由 host 端 `receipt` 会话投影单元从会话日志折叠（复用 `assistant/message`
的 usage 与模型来源），随 `session/projection` 帧实时刷新；界面只负责展示，
不发任何 RPC。

## 安装

推荐从 GitHub 安装（无需本地构建）：

```sh
# 从 DeepSeek Harness checkout 目录执行（web profile 与 GUI 所在 profile 一致时）
pnpm dsh plugin --profile web add github:bluechips-zhao/dsh-receipt
```

> 如果不熟悉命令行/安装，也可以直接把本仓库链接
> `https://github.com/bluechips-zhao/dsh-receipt` 发给你的 AI 助手（如 DeepSeek Harness / 其他 AI），
> 让它照着本 README 的安装步骤帮你自动执行 `dsh plugin` 安装命令即可。

安装后**重启 GUI**（小票按钮出现在会话头部右侧；打开会话后点击"小票"）。

### 发现更多插件

本插件通过 GitHub 的 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 主题标签
公开，可在该标签页浏览官方与社区插件仓库；如需可视化、应用商店式的浏览体验，
也可前往社区维护的 [DSH-Plugin Hub](https://dsh-plugin.org)（第三方站点，非 DeepSeek
官方运营）。

> 仓库**提交了构建好的 `lib/`**（`exports` 指向 `lib/index.js` 与 `lib/client.js`），
> 因此用户安装的是开箱即用的产物，无需重复构建。若你把本仓库改名或移到别的
> 命名空间，请同步替换上面 `github:bluechips-zhao/dsh-receipt` 段。

## 依赖、权限与兼容性

- **外部依赖**：无外部服务、无网络请求、无命令执行。运行期只读 host 侧的
  `receipt` 投影与 `useSessions` 行数据；依赖全部走 peer / profile fallback
  （`$DSH_HOME/profiles/node_modules`），不复制 Cordis / React / schemastery
  的运行时身份。
- **权限**：运行时代码（`lib/index.js`、`lib/client.js`）只注册一个投影单元与两个
  slot 座位——**不访问文件系统、不读取凭据、不启动子进程**。host 半 `inject` 仅
  `sessionProjections`；client 半 `inject` 仅 `sessions` / `slots` / `locale`。
- **构建期信号**：仓库内 `tsdown.config.ts` 用 `node:fs` 读取/校验产物、
  `scripts/*` 读取若干环境变量，这些属于**构建与自检工具链**，不随包分发
  （`files` 只含 `lib/` 与文档）。静态扫描若把它们计为权限信号，属构建面而非运行面。
- **兼容性**：Node.js `^22.19.0 || >=24`；DSH 逐版本声明见 `package.json` 的
  `dsh.compatibility.dshReleases`（当前在 `0.1.5-rc.1` 上验证）。
- **已知边界**：费用是按配置定价表做的本地估算，非账单口径；定价表未声明的模型
  以"未计价"展示；峰谷时段按样本事件时间（本机时钟）判定。

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

### DeepSeek-V4 峰谷定价说明（官方定价页）

DeepSeek-V4 系列采用**分时计价**。官方[模型 & 价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)页脚注(1) 定义：

- **高峰时段**：北京时间**周一至周五** 9:00–12:00、14:00–18:00（共两个窗口）。
- **空闲时段**：上述高峰窗口之外的时间，**含周六、周日全天**。
- 空闲时段价格为高峰时段价格的**一半**（即高峰 = 空闲 ×2）。

| 模型 | 时段 | 输入(缓存未命中) | 输入(缓存命中) | 输出 |
|---|---|---|---|---|
| deepseek-v4-flash | 空闲（含周末全天） | ¥1.5 | ¥0.05 | ¥4.5 |
| deepseek-v4-flash | 工作日高峰 9:00–12:00、14:00–18:00 | ¥3.0 | ¥0.10 | ¥9.0 |
| deepseek-v4-pro | 空闲（含周末全天） | ¥4.5 | ¥0.15 | ¥13.5 |
| deepseek-v4-pro | 工作日高峰 9:00–12:00、14:00–18:00 | ¥9.0 | ¥0.30 | ¥27.0 |
| deepseek-v4-flash-vision-exp | 空闲（含周末全天） | ¥1.5 | ¥0.05 | ¥4.5 |
| deepseek-v4-flash-vision-exp | 工作日高峰 9:00–12:00、14:00–18:00 | ¥3.0 | ¥0.10 | ¥9.0 |

小票当前按**单一单价**计费（建议配置空闲时段价，即周末全天与工作日空闲时段价）；
工作日高峰时段的实际费用约为小票金额的 **2 倍**，周末则与小票金额一致。若需要按时段
精确计价，可在小票插件后续版本中扩展（按 step 时间戳折叠，并区分工作日/周末）。

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
  `tokenUsage` 一致（同一 step 的相邻样本整步替换，不重复计数；用量随
  `assistant/message` 一同落地，当前事件映射里已无 `assistant/chunk`）。
- client 半：`conversation.session.header.actions` 的"小票"按钮 +
  `shell.overlay` 的小票弹层；打开状态经插件内模块级 store 协调，
  数据读 `useSessions` 行上的 `projectionValues.receipt`（实时帧驱动）。
- 依赖全部走 peer / profile fallback（`$DSH_HOME/profiles/node_modules`），
  不复制 Cordis / React / schemastery 运行时身份。
