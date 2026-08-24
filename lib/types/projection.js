/**
 * `receipt` 投影单元：把会话日志折叠成按模型聚合的消费小票。
 *
 * 事件语义与同族的 `sessionStats` / `tokenUsage` 保持一致：
 * - 一个 step 的 usage 报告是相邻的（先 `assistant/chunk`(usage) 早采样，
 *   后 `assistant/message` 终值），后到者整步替换先到者，绝不重复计数；
 * - 只有落地了 `assistant/message` 的 step 才算该模型的一次"调用"
 *   （消息的 `message.source` 携带 provider/model，是模型归因的唯一真相）；
 * - 仅报告 usage chunk、未落地消息的 step（如被取消的调用）计入
 *   "未知模型"行，模型耗时不计（与 sessionStats 对取消 step 的处理一致）；
 * - 模型耗时 = step/start → assistant/message 之和（llmMs）。
 *
 * state 是纯 JSON（持久化投影缓存前置条件）；view 是纯函数，按注册时
 * 捕获的定价表现算费用——改定价配置无需重放日志。
 *
 * @module dsh-receipt/projection
 */
import { z } from 'zod';
import { resolvePricing } from "./pricing.js";
const UNKNOWN_KEY = '\u0000';
const MODEL_KEY_SEP = '\u0000';
/** 模型桶键：provider 与 model 用不可见分隔符拼接，避免碰撞。 */
function modelKey(provider, model) {
    return `${provider}${MODEL_KEY_SEP}${model}`;
}
function stepKey(turn, step) {
    return `${turn}:${step}`;
}
function zeroCounts() {
    return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0 };
}
function countsFrom(usage) {
    return {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens ?? 0,
        cacheWriteTokens: usage.cacheWriteTokens ?? 0,
        reasoningTokens: usage.reasoningTokens ?? 0,
    };
}
function countsEqual(left, right) {
    return left.inputTokens === right.inputTokens
        && left.outputTokens === right.outputTokens
        && left.cacheReadTokens === right.cacheReadTokens
        && left.cacheWriteTokens === right.cacheWriteTokens
        && left.reasoningTokens === right.reasoningTokens;
}
/** 样本归因的桶键（未知模型 → UNKNOWN_KEY）。 */
function bucketKeyOf(sample) {
    return sample.provider === null || sample.model === null ? UNKNOWN_KEY : modelKey(sample.provider, sample.model);
}
/** 桶是否空（无调用且全部分桶为 0）；空桶从 state 中移除。 */
function isBucketEmpty(bucket) {
    return bucket.calls === 0
        && bucket.inputTokens === 0
        && bucket.outputTokens === 0
        && bucket.cacheReadTokens === 0
        && bucket.cacheWriteTokens === 0
        && bucket.reasoningTokens === 0;
}
/** 把样本从桶上减去（unknown 行同样处理；防御性支持重复减去被调用计数）。 */
function subtract(models, sample) {
    const key = bucketKeyOf(sample);
    const bucket = models[key];
    if (bucket === undefined)
        return models;
    const next = {
        ...bucket,
        inputTokens: Math.max(0, bucket.inputTokens - sample.inputTokens),
        outputTokens: Math.max(0, bucket.outputTokens - sample.outputTokens),
        cacheReadTokens: Math.max(0, bucket.cacheReadTokens - sample.cacheReadTokens),
        cacheWriteTokens: Math.max(0, bucket.cacheWriteTokens - sample.cacheWriteTokens),
        reasoningTokens: Math.max(0, bucket.reasoningTokens - sample.reasoningTokens),
        calls: Math.max(0, bucket.calls - (sample.counted ? 1 : 0)),
    };
    // 归零的桶（例如 chunk 采样被消息替换后）不留在 state 里。
    if (isBucketEmpty(next)) {
        const pruned = { ...models };
        delete pruned[key];
        return pruned;
    }
    return { ...models, [key]: next };
}
/** 把样本累加到桶上（按 provider/model 归因；未知模型进 unknown 行）。 */
function add(models, sample) {
    const key = bucketKeyOf(sample);
    const existing = models[key];
    const bucket = existing ?? {
        provider: sample.provider ?? '',
        model: sample.model ?? '',
        ...zeroCounts(),
        calls: 0,
    };
    return {
        ...models,
        [key]: {
            ...bucket,
            inputTokens: bucket.inputTokens + sample.inputTokens,
            outputTokens: bucket.outputTokens + sample.outputTokens,
            cacheReadTokens: bucket.cacheReadTokens + sample.cacheReadTokens,
            cacheWriteTokens: bucket.cacheWriteTokens + sample.cacheWriteTokens,
            reasoningTokens: bucket.reasoningTokens + sample.reasoningTokens,
            calls: bucket.calls + (sample.counted ? 1 : 0),
        },
    };
}
/**
 * 替换一个 step 的样本：先减去旧归因，再累加新归因，写回 steps 表。
 * 同一 (turn, step) 的相邻 usage 报告（chunk → message）借此不重复计数，
 * 且 chunk 采样（未知模型）被消息（已知模型）替换时归因正确迁移。
 * 若只有时间戳变化（同计数同归因，例如 chunk → message 终值），只更新
 * steps 表（峰谷计价按样本时间判断，不能让旧时间残留）。
 */
function replaceStep(state, turn, step, next) {
    const key = stepKey(turn, step);
    const prev = state.steps[key];
    if (prev !== undefined
        && prev.provider === next.provider
        && prev.model === next.model
        && prev.counted === next.counted
        && countsEqual(prev, next)) {
        if (prev.time === next.time)
            return state;
        return { ...state, steps: { ...state.steps, [key]: next } };
    }
    const models = subtract(state.models, prev === undefined ? undefinedSample() : prev);
    return { ...state, models: add(models, next), steps: { ...state.steps, [key]: next } };
}
/** 无先前样本时 subtract 的 no-op 哨兵（未知模型、零 token、未计数）。 */
function undefinedSample() {
    return { provider: null, model: null, ...zeroCounts(), counted: false, time: 0 };
}
/** 单元 apply：一次提交事件 → 下一状态；不关心的事件返回同一引用。 */
export function applyReceipt(state, event) {
    switch (event.type) {
        case 'step/start': {
            const { turn, step } = event.data;
            return {
                ...state,
                firstTime: state.firstTime ?? event.time,
                lastTime: event.time,
                openStep: { turn, step, startTime: event.time },
            };
        }
        case 'step/end':
            return state.openStep === null ? state : { ...state, openStep: null, lastTime: event.time };
        case 'assistant/chunk': {
            const chunk = event.data.chunk;
            if (chunk.type !== 'usage')
                return state;
            return replaceStep(state, event.data.turn, event.data.step, {
                provider: null,
                model: null,
                ...countsFrom(chunk.usage),
                counted: false,
                time: event.time,
            });
        }
        case 'assistant/message': {
            const { turn, step, message, usage } = event.data;
            const source = message.source;
            const llmMs = state.openStep !== null
                && state.openStep.turn === turn
                && state.openStep.step === step
                ? state.llmMs + Math.max(0, event.time - state.openStep.startTime)
                : state.llmMs;
            const next = replaceStep(state, turn, step, {
                provider: source.provider,
                model: source.model,
                ...(usage === undefined ? zeroCounts() : countsFrom(usage)),
                counted: true,
                time: event.time,
            });
            return { ...next, llmMs, openStep: null, lastTime: event.time };
        }
        default:
            return state;
    }
}
function priceOf(counts, entry) {
    return (counts.inputTokens / 1_000_000 * (entry.input ?? 0)
        + counts.cacheReadTokens / 1_000_000 * (entry.cacheRead ?? 0)
        + counts.cacheWriteTokens / 1_000_000 * (entry.cacheWrite ?? 0)
        + counts.outputTokens / 1_000_000 * (entry.output ?? 0)
        + counts.reasoningTokens / 1_000_000 * (entry.reasoning ?? 0));
}
/** 北京时间小时（Asia/Shanghai 无夏令时，UTC+8 恒定）。 */
function beijingHour(time) {
    return (new Date(time).getUTCHours() + 8) % 24;
}
/**
 * 北京时间星期几（0=周日 … 6=周六）。用 UTC 日偏移 +8h 得到，避免夏令时歧义。
 * DeepSeek-V4 官方规则（2026-08-23 起）：周末（周六、周日）全天不分峰谷，
 * 统一按谷底（空闲）价计费，因此只有工作日才存在高峰时段。
 */
function beijingWeekday(time) {
    // 北京时间比 UTC 早 8 小时：把时间推进 8h 再取 UTC 星期，得到正确的北京星期。
    return new Date(time + 8 * 60 * 60 * 1000).getUTCDay();
}
/** 是否工作日（周一至周五）。 */
function isWeekday(time) {
    const day = beijingWeekday(time);
    return day >= 1 && day <= 5;
}
/**
 * 样本时间是否落在任一高峰窗口（半开区间 [start, end)）。
 * 仅工作日判定高峰；周末（周六、周日）全天视为谷底，恒不命中。
 */
function isPeak(time, windows) {
    if (!isWeekday(time))
        return false;
    const hour = beijingHour(time);
    return windows.some(window => hour >= window.start && hour < window.end);
}
/** 默认高峰窗口（DeepSeek-V4 官方：北京时间 9:00-12:00、14:00-18:00，仅工作日）。 */
export const DEFAULT_PEAK_HOURS = [
    { start: 9, end: 12 },
    { start: 14, end: 18 },
];
/**
 * 单元 view：state → wire 值。费用按注册时捕获的定价表现算，**逐 step
 * 按样本时间判断峰谷**（工作日高峰时段单价 × peakMultiplier；周末全天谷底）。
 * 模型 id 优先精确
 * 匹配，其次 `provider/model` 复合键，再次别名基准模型（见 resolvePricing）。
 * 成本不落 state（改价即生效，无需重放）。
 */
export function receiptView(state, pricing, currency, options = {}) {
    const peakHours = options.peakHours ?? DEFAULT_PEAK_HOURS;
    const peakMultiplier = options.peakMultiplier ?? 2;
    // 一次遍历 steps，按模型归因累计峰谷成本（未知模型与未计价模型跳过）。
    const costByModel = new Map();
    for (const sample of Object.values(state.steps)) {
        if (sample.provider === null || sample.model === null)
            continue;
        const entry = resolvePricing(pricing, sample.provider, sample.model);
        if (entry === undefined)
            continue;
        const key = modelKey(sample.provider, sample.model);
        const base = priceOf(sample, entry);
        const peak = isPeak(sample.time, peakHours) && peakMultiplier !== 1;
        const accrued = costByModel.get(key) ?? { cost: 0, peakCost: 0 };
        if (peak) {
            accrued.cost += base * peakMultiplier;
            accrued.peakCost += base * (peakMultiplier - 1);
        }
        else {
            accrued.cost += base;
        }
        costByModel.set(key, accrued);
    }
    const rows = Object.values(state.models)
        // 防御性跳过空桶（正常折叠下 subtract 已移除，见 isBucketEmpty）。
        .filter(bucket => !isBucketEmpty(bucket))
        .map((bucket) => {
        const entry = resolvePricing(pricing, bucket.provider, bucket.model);
        const accrued = entry === undefined ? undefined : costByModel.get(modelKey(bucket.provider, bucket.model));
        if (entry === undefined || accrued === undefined) {
            return {
                provider: bucket.provider,
                model: bucket.model,
                calls: bucket.calls,
                inputTokens: bucket.inputTokens,
                outputTokens: bucket.outputTokens,
                cacheReadTokens: bucket.cacheReadTokens,
                cacheWriteTokens: bucket.cacheWriteTokens,
                reasoningTokens: bucket.reasoningTokens,
                cost: 0,
                peakCost: 0,
                priced: false,
            };
        }
        return {
            provider: bucket.provider,
            model: bucket.model,
            calls: bucket.calls,
            inputTokens: bucket.inputTokens,
            outputTokens: bucket.outputTokens,
            cacheReadTokens: bucket.cacheReadTokens,
            cacheWriteTokens: bucket.cacheWriteTokens,
            reasoningTokens: bucket.reasoningTokens,
            cost: accrued.cost,
            peakCost: accrued.peakCost,
            priced: true,
        };
    });
    // 费用降序，未计价（费用 0）排最后；费用相同时调用次数多者在前。
    rows.sort((left, right) => right.cost - left.cost || right.calls - left.calls || left.model.localeCompare(right.model));
    const totals = rows.reduce((acc, row) => ({
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + row.cacheReadTokens,
        cacheWriteTokens: acc.cacheWriteTokens + row.cacheWriteTokens,
        reasoningTokens: acc.reasoningTokens + row.reasoningTokens,
        calls: acc.calls + row.calls,
        cost: acc.cost + row.cost,
        peakCost: acc.peakCost + row.peakCost,
    }), { ...zeroCounts(), calls: 0, cost: 0, peakCost: 0 });
    return {
        models: rows,
        totals,
        priced: rows.length > 0 && rows.every(row => row.priced),
        llmMs: state.llmMs,
        spanMs: state.firstTime === null || state.lastTime === null
            ? 0
            : Math.max(0, state.lastTime - state.firstTime),
        updatedAt: state.lastTime ?? 0,
        currency,
        peakHours: [...peakHours],
        peakMultiplier,
    };
}
const tokenCountsSchema = z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheWriteTokens: z.number().int().nonnegative(),
    reasoningTokens: z.number().int().nonnegative(),
}).strict();
/** 模型桶 state 子 schema（见 ModelBucketState）。 */
const modelBucketStateSchema = tokenCountsSchema.extend({
    provider: z.string(),
    model: z.string(),
    calls: z.number().int().nonnegative(),
}).strict();
/** 逐 step 样本 state 子 schema（见 StepSample）。 */
const stepSampleStateSchema = tokenCountsSchema.extend({
    provider: z.string().nullable(),
    model: z.string().nullable(),
    counted: z.boolean(),
    time: z.number().nonnegative(),
}).strict();
/** `receipt` 单元的持久化 state schema（验证折叠中间态，非 wire 值）。 */
const receiptStateSchema = z.object({
    models: z.record(z.string(), modelBucketStateSchema),
    steps: z.record(z.string(), stepSampleStateSchema),
    llmMs: z.number().nonnegative(),
    firstTime: z.number().nullable(),
    lastTime: z.number().nullable(),
    openStep: z.object({
        turn: z.number().int().nonnegative(),
        step: z.number().int().nonnegative(),
        startTime: z.number().nonnegative(),
    }).nullable(),
}).strict();
const peakWindowSchema = z.object({
    start: z.number().int().min(0).max(23),
    end: z.number().int().min(1).max(24),
}).strict();
const modelRowSchema = tokenCountsSchema.extend({
    provider: z.string(),
    model: z.string(),
    calls: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
    peakCost: z.number().nonnegative(),
    priced: z.boolean(),
}).strict();
const receiptSchema = z.object({
    models: z.array(modelRowSchema),
    totals: tokenCountsSchema.extend({
        calls: z.number().int().nonnegative(),
        cost: z.number().nonnegative(),
        peakCost: z.number().nonnegative(),
    }).strict(),
    priced: z.boolean(),
    llmMs: z.number().nonnegative(),
    spanMs: z.number().nonnegative(),
    updatedAt: z.number().nonnegative(),
    currency: z.string(),
    peakHours: z.array(peakWindowSchema),
    peakMultiplier: z.number().nonnegative(),
}).strict();
/** 工厂：按部署定价/货币/峰谷配置注册 `receipt` 单元（配置变化时经 fiber 重注册）。 */
export function receiptProjectionDefinition(pricing, currency, options = {}) {
    return {
        key: 'receipt',
        stateSchema: receiptStateSchema,
        init: () => ({ models: {}, steps: {}, llmMs: 0, firstTime: null, lastTime: null, openStep: null }),
        apply: applyReceipt,
        wire: {
            viewSchema: receiptSchema,
            view: state => receiptView(state, pricing, currency, options),
        },
        stateVersion: 2,
    };
}
//# sourceMappingURL=projection.js.map