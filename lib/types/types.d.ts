/**
 * 小票投影的共享类型：`receipt` 键在 SessionProjectionMap 中的声明与 wire 形状。
 * 纯类型出口（零 value import），host 与 client 两个 tsc program 都包含本文件，
 * 因此 host 折叠与 client 渲染共享同一份类型。
 *
 * @module dsh-receipt/types
 */
export {};
/** token 分桶（与 @deepseek-ai/dsh-llm 的 TokenUsage 对齐；各桶互不重叠）。 */
export interface ReceiptTokenCounts {
    /** 未命中缓存的输入 token 数。 */
    inputTokens: number;
    /** 输出 token 数。 */
    outputTokens: number;
    /** 缓存命中的输入 token 数。 */
    cacheReadTokens: number;
    /** 写入缓存的 token 数。 */
    cacheWriteTokens: number;
    /** 推理 token 数（provider 报告时才有，否则为 0）。 */
    reasoningTokens: number;
}
/** 高峰时段窗口：按北京时间小时计，半开区间 `[start, end)`。 */
export interface ReceiptPeakWindow {
    /** 起始小时（0-23）。 */
    start: number;
    /** 结束小时（1-24）。 */
    end: number;
}
/** 按模型聚合的一行明细。 */
export interface ReceiptModelRow extends ReceiptTokenCounts {
    /** 注册的 provider 路由名；未知模型（仅 usage chunk、未落地消息）为空串。 */
    provider: string;
    /** provider 侧模型 id；未知模型为空串。 */
    model: string;
    /** 归因到该模型的模型调用次数（携带 usage 的 step 数）。 */
    calls: number;
    /** 按定价表与峰谷时段折算的费用（当前货币单位；未计价恒为 0）。 */
    cost: number;
    /** 其中落在高峰时段的部分费用。 */
    peakCost: number;
    /** 是否命中定价表；false 表示该模型未配置价格。 */
    priced: boolean;
}
/** `receipt` 投影的完整 wire 值（registry `view` 输出，schema 校验后下发）。 */
export interface ReceiptProjection {
    /** 按模型聚合的明细行，费用降序（未计价行排在最后）。 */
    models: ReceiptModelRow[];
    /** 全会话合计。 */
    totals: ReceiptTokenCounts & {
        /** 全部模型的调用次数之和。 */
        calls: number;
        /** 全部模型费用之和。 */
        cost: number;
        /** 合计中落在高峰时段的部分。 */
        peakCost: number;
    };
    /** 合计是否完全可计价：至少一行且每一行都命中定价表才为 true。 */
    priced: boolean;
    /** 模型耗时（step/start → assistant/message 之和），ms。 */
    llmMs: number;
    /** 会话模型活动时间跨度（首个 step/start → 最后一条模型消息），ms。 */
    spanMs: number;
    /** 最后一条计入事件的时间（epoch ms）——小票的"出票时间"。 */
    updatedAt: number;
    /** 展示用的货币符号/代码（来自插件配置）。 */
    currency: string;
    /** 高峰时段窗口（北京时间小时，半开区间），用于客户端展示提示。 */
    peakHours: ReceiptPeakWindow[];
    /** 高峰单价倍率。 */
    peakMultiplier: number;
}
declare module '@deepseek-ai/dsh-session-projection/types' {
    interface SessionProjectionMap {
        /** 会话消费小票：按模型聚合的 token 用量、调用次数、耗时与费用。 */
        receipt: ReceiptProjection;
    }
}
//# sourceMappingURL=types.d.ts.map