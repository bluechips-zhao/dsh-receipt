/**
 * 小票插件 host 半：注册 `receipt` 会话投影单元。
 *
 * 折叠是纯数学（projection.ts），交付是 session-projection seam 的事；
 * 本入口只负责：1) 用 schemastery 声明可配置的定价表/货币；2) 在投影
 * registry 就绪后注册单元。配置改动经 fiber 重注册即生效，无需重放日志。
 *
 * @module dsh-receipt
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type PricingEntry } from './pricing.ts';
import type { ReceiptPeakWindow } from './types.ts';
export type * from './types.ts';
/** Cordis 插件名。 */
export declare const name = "dsh-receipt";
/** 插件配置：开关、货币符号、单价表与峰谷计价。 */
export interface Config {
    /** 是否启用小票投影与界面。 */
    enabled: boolean;
    /** 费用展示用货币符号/代码（如 ¥ / $ / CNY）。 */
    currency: string;
    /** 单价表（空闲时段基准价）：每 1M token 的价格，按模型 id 或 `provider/model` 键控。 */
    pricing: Record<string, PricingEntry>;
    /** 高峰时段窗口（北京时间小时，半开区间 [start,end)）；默认 9-12、14-18，仅工作日生效，周末全天谷底。 */
    peakHours: ReceiptPeakWindow[];
    /** 高峰单价倍率；默认 2（DeepSeek-V4 官方峰谷方案）。 */
    peakMultiplier: number;
}
export declare const Config: z<Config>;
/** 投影 registry 是本插件的全部意义；没有它 fiber 保持 pending。 */
export declare const inject: string[];
/**
 * 注册 `receipt` 单元；注册是当前 fiber 上的 effect，卸载即移除该键。
 * @param ctx - 携带投影 registry 的注册上下文。
 * @param config - 解析后的插件配置。
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map