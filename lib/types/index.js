/**
 * 小票插件 host 半：注册 `receipt` 会话投影单元。
 *
 * 折叠是纯数学（projection.ts），交付是 session-projection seam 的事；
 * 本入口只负责：1) 用 schemastery 声明可配置的定价表/货币；2) 在投影
 * registry 就绪后注册单元。配置改动经 fiber 重注册即生效，无需重放日志。
 *
 * @module dsh-receipt
 */
import z from '@deepseek-ai/schemastery';
import { DEFAULT_PRICING } from "./pricing.js";
import { receiptProjectionDefinition } from "./projection.js";
/** Cordis 插件名。 */
export const name = 'dsh-receipt';
const pricingEntrySchema = z.object({
    input: z.number().step(0.0001).min(0),
    output: z.number().step(0.0001).min(0),
    cacheRead: z.number().step(0.0001).min(0),
    cacheWrite: z.number().step(0.0001).min(0),
    reasoning: z.number().step(0.0001).min(0),
});
const peakWindowSchema = z.object({
    start: z.number().step(1).min(0).max(23),
    end: z.number().step(1).min(1).max(24),
});
// schemastery 的 object 字段默认可选、输出类型与实际 value 形状有出入，
// 按 token-meter 先例显式断言到域类型；缺失价格字段由 pricing.ts 的 `?? 0` 兜底。
export const Config = z.object({
    enabled: z.boolean().default(true),
    currency: z.string().default('¥'),
    pricing: z.dict(pricingEntrySchema).default({}),
    peakHours: z.array(peakWindowSchema).default([
        { start: 9, end: 12 },
        { start: 14, end: 18 },
    ]),
    peakMultiplier: z.number().min(1).default(2),
});
/** 投影 registry 是本插件的全部意义；没有它 fiber 保持 pending。 */
export const inject = ['sessionProjections'];
/**
 * 注册 `receipt` 单元；注册是当前 fiber 上的 effect，卸载即移除该键。
 * @param ctx - 携带投影 registry 的注册上下文。
 * @param config - 解析后的插件配置。
 */
export function apply(ctx, config) {
    if (!config.enabled)
        return;
    const pricing = { ...DEFAULT_PRICING, ...config.pricing };
    ctx.sessionProjections.register(receiptProjectionDefinition(pricing, config.currency, {
        peakHours: config.peakHours,
        peakMultiplier: config.peakMultiplier,
    }));
}
//# sourceMappingURL=index.js.map