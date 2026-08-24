/**
 * 模型定价表：每 1M token 的价格（当前货币单位，默认人民币 ¥）。
 *
 * 只内置 DeepSeek 官方长期公开的经典模型定价；其余模型（如
 * deepseek-v4-flash / v4-pro）不猜测价格，未配置时按"未计价"展示，
 * 由用户在 profile 配置里按需补充（见 README）。
 *
 * 对"与主型号同价"的模型族（如 deepseek-v4-flash-vision-exp 与
 * deepseek-v4-flash 同价），通过 PRICING_ALIASES 建立只读映射：别名模型
 * 沿用基准模型的定价条目，无需用户重复配置，也不猜测价格数值。
 *
 * @module dsh-receipt/pricing
 */
/**
 * 定价别名字典：模型 id → 基准模型 id。别名模型沿用基准模型的定价条目
 * （即"与主型号同价"），无需在 pricing 里重复配置；本表不猜测价格数值。
 */
export const PRICING_ALIASES = {
    // deepseek-v4-flash-vision-exp 与 deepseek-v4-flash 同价（仅多模态/视觉能力，无额外计费）。
    'deepseek-v4-flash-vision-exp': 'deepseek-v4-flash',
};
/**
 * 解析一个 (provider, model) 的定价条目。
 * 优先级：精确模型 id → `provider/model` 复合键 → 别名基准模型
 * （对基准模型再走同样两级，基准模型未配置则返回 undefined）。
 */
export function resolvePricing(pricing, provider, model) {
    let entry = pricing[model] ?? pricing[`${provider}/${model}`];
    if (entry !== undefined)
        return entry;
    const base = PRICING_ALIASES[model] ?? PRICING_ALIASES[`${provider}/${model}`];
    if (base === undefined)
        return undefined;
    return pricing[base] ?? pricing[`${provider}/${base}`];
}
/** 内置默认定价（DeepSeek 官方公开价格，¥/1M tokens）。 */
export const DEFAULT_PRICING = {
    'deepseek-chat': { input: 2, cacheRead: 0.5, output: 8 },
    'deepseek-reasoner': { input: 4, cacheRead: 1, output: 16 },
};
//# sourceMappingURL=pricing.js.map