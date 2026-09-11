/**
 * 模型定价表：每 1M token 的价格（当前货币单位，默认人民币 ¥）。
 *
 * 内置 DeepSeek 官方定价页公开的单价：当前在售的 deepseek-flash（V4.1-Flash）
 * 与 deepseek-v4-pro，以及历史经典模型；其余模型不猜测价格，未配置时按
 * "未计价"展示，由用户在 profile 配置里按需补充（见 README）。
 *
 * 对"与主型号同价"的模型族（如 deepseek-v4-flash-vision-exp 与
 * deepseek-v4-flash 同价），通过 PRICING_ALIASES 建立只读映射：别名模型
 * 沿用基准模型的定价条目，无需用户重复配置，也不猜测价格数值。
 *
 * @module dsh-receipt/pricing
 */
/** 单个模型的单价表：缺省字段按 0 计。 */
export interface PricingEntry {
    /** 未命中缓存输入：每 1M token。 */
    input?: number;
    /** 输出：每 1M token。 */
    output?: number;
    /** 缓存命中输入：每 1M token。 */
    cacheRead?: number;
    /** 缓存写入：每 1M token。 */
    cacheWrite?: number;
    /** 推理 token：每 1M token。 */
    reasoning?: number;
}
/** 定价表：key 为模型 id（也可写 `provider/model`，后者优先）。 */
export type PricingTable = Readonly<Record<string, PricingEntry>>;
/**
 * 定价别名字典：模型 id → 基准模型 id。别名模型沿用基准模型的定价条目
 * （即"与主型号同价"），无需在 pricing 里重复配置；本表不猜测价格数值。
 */
export declare const PRICING_ALIASES: Readonly<Record<string, string>>;
/**
 * 解析一个 (provider, model) 的定价条目。
 * 优先级：精确模型 id → `provider/model` 复合键 → 别名基准模型
 * （对基准模型再走同样两级，基准模型未配置则返回 undefined）。
 */
export declare function resolvePricing(pricing: PricingTable, provider: string, model: string): PricingEntry | undefined;
/**
 * 内置默认定价（DeepSeek 官方公开价格，¥/1M tokens）。
 *
 * 分时计价的模型按**空闲（谷底）时段单价**内置：折叠时对落在工作日高峰窗口的
 * 样本乘 `peakMultiplier`（官方为 2），故此处只写谷底价（官方：空闲 = 高峰的一半）。
 */
export declare const DEFAULT_PRICING: PricingTable;
//# sourceMappingURL=pricing.d.ts.map