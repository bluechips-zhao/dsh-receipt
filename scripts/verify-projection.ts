/**
 * 小票投影折叠逻辑的独立验证脚本（node:assert，经 tsx 运行）。
 * 覆盖：按模型聚合、chunk→message 整步替换不重复计数、未知模型桶、
 * 缓存/推理分桶计价、未计价模型、llmMs/spanMs、定价覆盖与复合键。
 *
 * 运行：pnpm exec tsx scripts/verify-projection.ts
 * （或在 checkout 目录：node --import tsx/esm scripts/verify-projection.ts）
 */
import assert from 'node:assert/strict'
import type { SessionEvent, Session } from '@deepseek-ai/dsh-session'
import type { TokenUsage } from '@deepseek-ai/dsh-llm'
import { applyReceipt, receiptProjectionDefinition, receiptView, type ReceiptState } from '../src/projection.ts'
import { DEFAULT_PRICING, type PricingTable } from '../src/pricing.ts'

/** 构造会话事件（只含折叠所需字段）。 */
function ev(type: string, data: Record<string, unknown>, time: number, seq: number): SessionEvent {
  return { type, data, time, seq } as unknown as SessionEvent
}

function stepStart(turn: number, step: number, time: number, seq: number): SessionEvent {
  return ev('step/start', { turn, step }, time, seq)
}

function usageChunk(turn: number, step: number, usage: TokenUsage, time: number, seq: number): SessionEvent {
  return ev('assistant/chunk', { turn, step, chunk: { type: 'usage', usage } }, time, seq)
}

function message(
  turn: number,
  step: number,
  model: string,
  usage: TokenUsage | undefined,
  time: number,
  seq: number,
): SessionEvent {
  return ev('assistant/message', {
    turn,
    step,
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: 'ok' }],
      source: { kind: 'model', provider: 'deepseek-official', model },
    },
    ...(usage === undefined ? {} : { usage }),
  }, time, seq)
}

function stepEnd(turn: number, step: number, time: number, seq: number): SessionEvent {
  return ev('step/end', { turn, step }, time, seq)
}

/** 跑一遍事件序列。 */
function fold(events: SessionEvent[]): ReceiptState {
  return events.reduce(applyReceipt, receiptProjectionDefinition({}, '¥').init())
}

const seq = (() => { let n = 0; return () => n++ })()

// ---- 1. 基础聚合与计价 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, 1_000, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  assert.equal(view.models.length, 1)
  const row = view.models[0]!
  assert.equal(row.model, 'deepseek-chat')
  assert.equal(row.calls, 1)
  assert.equal(row.inputTokens, 100)
  assert.equal(row.outputTokens, 50)
  assert.equal(row.priced, true)
  // 100/1e6*2 + 50/1e6*8 = 0.0002 + 0.0004
  assert.ok(Math.abs(row.cost - 0.0006) < 1e-12)
  assert.equal(view.totals.cost, row.cost)
  assert.equal(view.totals.calls, 1)
  assert.equal(view.priced, true)
  assert.equal(view.llmMs, 1_000)
  assert.equal(view.spanMs, 1_000)
  assert.equal(view.updatedAt, 1_000)
  assert.equal(view.currency, '¥')
}

// ---- 2. chunk→message 整步替换：不重复计数 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    usageChunk(1, 1, { inputTokens: 100, outputTokens: 50 }, 500, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 120, outputTokens: 60 }, 1_000, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  assert.equal(view.models.length, 1)
  assert.equal(view.models[0]!.calls, 1)
  assert.equal(view.models[0]!.inputTokens, 120)
  assert.equal(view.models[0]!.outputTokens, 60)
  assert.equal(view.totals.inputTokens, 120)
  assert.equal(view.totals.outputTokens, 60)
}

// ---- 3. 仅 usage chunk（未落地消息）→ 未知模型桶 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    usageChunk(1, 1, { inputTokens: 30, outputTokens: 10 }, 400, seq()),
    stepEnd(1, 1, 500, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  assert.equal(view.models.length, 1)
  const unknown = view.models[0]!
  assert.equal(unknown.model, '')
  assert.equal(unknown.provider, '')
  assert.equal(unknown.calls, 0)
  assert.equal(unknown.inputTokens, 30)
  assert.equal(unknown.outputTokens, 10)
  assert.equal(unknown.priced, false)
  assert.equal(view.priced, false)
  assert.equal(view.llmMs, 0) // 无消息：模型耗时不计
}

// ---- 4. 缓存/推理分桶计价 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-chat', {
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 200,
      cacheWriteTokens: 10,
      reasoningTokens: 5,
    }, 1_000, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  const row = view.models[0]!
  assert.equal(row.cacheReadTokens, 200)
  assert.equal(row.cacheWriteTokens, 10)
  assert.equal(row.reasoningTokens, 5)
  // 100/1e6*2 + 200/1e6*0.5 + 10/1e6*0 + 50/1e6*8 + 5/1e6*0
  assert.ok(Math.abs(row.cost - (0.0002 + 0.0001 + 0.0004)) < 1e-12)
}

// ---- 5. 未配置价格的模型：未计价 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-v4-flash', { inputTokens: 100, outputTokens: 50 }, 1_000, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  const row = view.models[0]!
  assert.equal(row.priced, false)
  assert.equal(row.cost, 0)
  assert.equal(view.priced, false)
}

// ---- 6. 定价覆盖（用户配置覆盖内置默认）与 provider/model 复合键 ----
{
  const custom: PricingTable = {
    'deepseek-chat': { input: 3, output: 9 },
    'deepseek-official/deepseek-v4-flash': { input: 1, output: 2 },
  }
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 1_000_000, outputTokens: 0 }, 1_000, seq()),
    stepStart(2, 1, 2_000, seq()),
    message(2, 1, 'deepseek-v4-flash', { inputTokens: 1_000_000, outputTokens: 0 }, 3_000, seq()),
  ])
  const view = receiptView(state, custom, '$')
  const chat = view.models.find(r => r.model === 'deepseek-chat')!
  const flash = view.models.find(r => r.model === 'deepseek-v4-flash')!
  assert.equal(chat.cost, 3) // 覆盖了默认 2
  assert.equal(flash.cost, 1) // 复合键命中
  assert.equal(view.currency, '$')
}

// ---- 7. 定义工厂：schema 能解析 view 输出（wire 契约） ----
{
  const def = receiptProjectionDefinition(DEFAULT_PRICING, '¥')
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 10, outputTokens: 5 }, 500, seq()),
  ])
  const parsed = def.wire.viewSchema.parse(def.wire.view(state))
  assert.equal(parsed.models.length, 1)
  assert.equal(parsed.totals.calls, 1)
  // 空日志 init 也必须是纯 JSON（持久化缓存前置条件）
  const empty = def.wire.view(def.init())
  assert.deepEqual(empty.models, [])
  assert.equal(empty.totals.calls, 0)
  assert.equal(empty.priced, false)
}

// ---- 8. 多模型多 step 合计 ----
{
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, 1_000, seq()),
    stepStart(1, 2, 1_100, seq()),
    message(1, 2, 'deepseek-reasoner', { inputTokens: 200, outputTokens: 100 }, 2_000, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  assert.equal(view.models.length, 2)
  assert.equal(view.totals.calls, 2)
  assert.equal(view.totals.inputTokens, 300)
  assert.equal(view.totals.outputTokens, 150)
  assert.equal(view.priced, true)
  // reasoner 单价更高 → 费用更高，排序在前
  assert.equal(view.models[0]!.model, 'deepseek-reasoner')
}

// ---- 9. 峰谷计价：默认高峰窗口（北京时间 9-12、14-18）----
{
  // ts = 9h（1970-01-01 09:00 UTC = 北京时间 17:00）→ 高峰 ×2
  const PEAK_TS = 9 * 3_600 * 1_000
  // ts = 5h（北京时间 13:00）→ 空闲
  const OFF_TS = 5 * 3_600 * 1_000
  const state = fold([
    stepStart(1, 1, OFF_TS, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, OFF_TS + 100, seq()),
    stepStart(2, 1, PEAK_TS, seq()),
    message(2, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, PEAK_TS + 100, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥')
  const row = view.models[0]!
  // 空闲 0.0006 + 高峰 0.0012；peakCost = 高峰多出的 0.0006
  assert.ok(Math.abs(row.cost - 0.0018) < 1e-12)
  assert.ok(Math.abs(row.peakCost - 0.0006) < 1e-12)
  assert.ok(Math.abs(view.totals.cost - 0.0018) < 1e-12)
  assert.ok(Math.abs(view.totals.peakCost - 0.0006) < 1e-12)
  // wire 上的默认窗口与倍率
  assert.deepEqual(view.peakHours, [{ start: 9, end: 12 }, { start: 14, end: 18 }])
  assert.equal(view.peakMultiplier, 2)
  // 全部空闲：peakCost 为 0
  const allOff = receiptView(fold([
    stepStart(1, 1, OFF_TS, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, OFF_TS + 100, seq()),
  ]), DEFAULT_PRICING, '¥')
  assert.equal(allOff.totals.peakCost, 0)
}

// ---- 10. 自定义高峰窗口与倍率 ----
{
  // 窗口 [14,18)：ts=6h（北京时间 14:00）→ 高峰
  const PEAK_TS = 6 * 3_600 * 1_000
  const state = fold([
    stepStart(1, 1, PEAK_TS, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 100, outputTokens: 50 }, PEAK_TS + 100, seq()),
  ])
  const view = receiptView(state, DEFAULT_PRICING, '¥', { peakHours: [{ start: 14, end: 18 }], peakMultiplier: 3 })
  assert.ok(Math.abs(view.totals.cost - 0.0006 * 3) < 1e-12)
  assert.ok(Math.abs(view.totals.peakCost - 0.0006 * 2) < 1e-12)
  assert.equal(view.peakMultiplier, 3)
  // 同一时刻不在自定义窗口（窗口 [0,1)）：空闲
  const off = receiptView(state, DEFAULT_PRICING, '¥', { peakHours: [{ start: 0, end: 1 }] })
  assert.ok(Math.abs(off.totals.cost - 0.0006) < 1e-12)
  assert.equal(off.totals.peakCost, 0)
}

// ---- 11. 定义工厂：schema 能解析带峰谷字段的 view 输出 ----
{
  const def = receiptProjectionDefinition(DEFAULT_PRICING, '¥')
  const state = fold([
    stepStart(1, 1, 9 * 3_600 * 1_000, seq()),
    message(1, 1, 'deepseek-chat', { inputTokens: 10, outputTokens: 5 }, 9 * 3_600 * 1_000 + 100, seq()),
  ])
  const parsed = def.wire.viewSchema.parse(def.wire.view(state))
  assert.equal(parsed.models[0]!.peakCost > 0, true)
  assert.equal(parsed.totals.peakCost > 0, true)
  assert.equal(parsed.peakMultiplier, 2)
}

// ---- 12. 别名计价：deepseek-v4-flash-vision-exp 沿用 deepseek-v4-flash 定价 ----
{
  const custom: PricingTable = {
    'deepseek-v4-flash': { input: 1.5, cacheRead: 0.05, output: 4.5 },
  }
  const state = fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-v4-flash-vision-exp', { inputTokens: 1_000_000, outputTokens: 0 }, 1_000, seq()),
  ])
  const view = receiptView(state, custom, '¥')
  const row = view.models[0]!
  assert.equal(row.model, 'deepseek-v4-flash-vision-exp')
  assert.equal(row.priced, true)
  assert.equal(row.cost, 1.5) // 沿用 flash 的 input 单价 1.5
  assert.equal(view.priced, true)
  assert.equal(view.totals.cost, 1.5)

  // 直接配置 vision-exp 时优先于别名（不被别名覆盖）。
  const direct: PricingTable = {
    'deepseek-v4-flash': { input: 1.5, output: 4.5 },
    'deepseek-v4-flash-vision-exp': { input: 3, output: 9 },
  }
  const view2 = receiptView(fold([
    stepStart(1, 1, 0, seq()),
    message(1, 1, 'deepseek-v4-flash-vision-exp', { inputTokens: 1_000_000, outputTokens: 0 }, 1_000, seq()),
  ]), direct, '¥')
  assert.equal(view2.models[0]!.cost, 3)
}

console.log('verify-projection: 全部断言通过 ✓')
