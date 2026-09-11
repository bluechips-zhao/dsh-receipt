/**
 * `receipt` 投影单元：把会话日志折叠成按模型聚合的消费小票。
 *
 * 事件语义与同族的 `sessionStats` / `tokenUsage` 保持一致：
 * - 一个 step 的 usage 随 `assistant/message` 一同落地（当前会话事件映射里
 *   没有独立的用量记录，也没有增量的 `assistant/chunk`）：同一 (turn, step)
 *   的重复样本整步替换先前的样本，绝不重复计数；
 * - 只有落地了 `assistant/message` 的 step 才算该模型的一次"调用"
 *   （消息的 `message.source` 携带 provider/model，是模型归因的唯一真相）；
 * - `assistant/attempt` 不携带 usage，故未落地消息的 step 不产生 token，
 *   模型耗时也不计（与 sessionStats 对取消 step 的处理一致）；
 * - 模型耗时 = step/start → assistant/message 之和（llmMs）。
 *
 * state 是纯 JSON（持久化投影缓存前置条件）；view 是纯函数，按注册时
 * 捕获的定价表现算费用——改定价配置无需重放日志。
 *
 * @module dsh-receipt/projection
 */
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import type { ReceiptPeakWindow, ReceiptProjection, ReceiptTokenCounts } from './types.ts';
import { type PricingTable } from './pricing.ts';
/** 一个 step 的用量样本；provider/model 为 null 表示未知（仅用于无先前样本的哨兵）。 */
interface StepSample extends ReceiptTokenCounts {
    provider: string | null;
    model: string | null;
    /** 该样本是否已把一次"调用"计入所属模型行（消息落地后为 true）。 */
    counted: boolean;
    /** 该样本对应的事件时间（epoch ms）——峰谷计价按此判断时段。 */
    time: number;
}
/** 按模型聚合的折叠状态（view 前的原始桶）。 */
interface ModelBucketState extends ReceiptTokenCounts {
    provider: string;
    model: string;
    calls: number;
}
/** 单元折叠状态：模型桶 + 逐 step 样本 + 时间边界。 */
export interface ReceiptState {
    /** provider\0model → 桶；未知模型用空串键（UNKNOWN_KEY）。 */
    models: Record<string, ModelBucketState>;
    /** "turn:step" → 该 step 的最新样本。 */
    steps: Record<string, StepSample>;
    /** 模型耗时之和，ms。 */
    llmMs: number;
    /** 首个 step/start 时间；null 表示日志尚无模型活动。 */
    firstTime: number | null;
    /** 最后一条计入事件的时间。 */
    lastTime: number | null;
    /** 打开中的 step 边界；消息落地或 step 结束时关闭。 */
    openStep: {
        turn: number;
        step: number;
        startTime: number;
    } | null;
}
/** 单元 apply：一次提交事件 → 下一状态；不关心的事件返回同一引用。 */
export declare function applyReceipt(state: ReceiptState, event: SessionEvent): ReceiptState;
/** 默认高峰窗口（DeepSeek-V4 官方：北京时间 9:00-12:00、14:00-18:00，仅工作日）。 */
export declare const DEFAULT_PEAK_HOURS: readonly ReceiptPeakWindow[];
/** 峰谷计价选项（缺省即 DeepSeek-V4 官方方案）。 */
export interface PeakPricingOptions {
    /** 高峰时段窗口（北京时间小时，仅工作日生效；周末全天谷底）。 */
    peakHours?: readonly ReceiptPeakWindow[];
    /** 高峰单价倍率（官方为 2）。 */
    peakMultiplier?: number;
}
/**
 * 单元 view：state → wire 值。费用按注册时捕获的定价表现算，**逐 step
 * 按样本时间判断峰谷**（工作日高峰时段单价 × peakMultiplier；周末全天谷底）。
 * 模型 id 优先精确
 * 匹配，其次 `provider/model` 复合键，再次别名基准模型（见 resolvePricing）。
 * 成本不落 state（改价即生效，无需重放）。
 */
export declare function receiptView(state: ReceiptState, pricing: PricingTable, currency: string, options?: PeakPricingOptions): ReceiptProjection;
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionStateMap {
        /** 会话消费小票的折叠状态（模型桶 + 逐 step 样本 + 时间边界）。 */
        receipt: ReceiptState;
    }
}
/** 工厂：按部署定价/货币/峰谷配置注册 `receipt` 单元（配置变化时经 fiber 重注册）。 */
export declare function receiptProjectionDefinition(pricing: PricingTable, currency: string, options?: PeakPricingOptions): ProjectionDefinition<'receipt', ReceiptState> & {
    wire: NonNullable<ProjectionDefinition<'receipt', ReceiptState>['wire']>;
};
export {};
//# sourceMappingURL=projection.d.ts.map