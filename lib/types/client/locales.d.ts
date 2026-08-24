/** `receipt` 命名空间字典。 */
/** 字典命名空间（本插件拥有）。 */
export declare const NS = "receipt";
/** 简体中文字典（key 集权威来源）。 */
export declare const zh: {
    readonly 'action.label': "小票";
    readonly 'action.aria': "查看本会话消费小票";
    readonly 'modal.title': "会话消费小票";
    readonly 'modal.close': "关闭";
    readonly empty: "本会话暂无用量数据";
    readonly printedAt: "出票时间 {time}";
    readonly 'session.id': "会话 ID {id}";
    readonly unknownModel: "未知模型";
    readonly unpriced: "未计价";
    readonly 'row.calls': "调用 {count} 次";
    readonly 'row.input': "输入 {tokens}";
    readonly 'row.output': "输出 {tokens}";
    readonly 'row.cacheRead': "缓存读 {tokens}";
    readonly 'row.cacheWrite': "缓存写 {tokens}";
    readonly 'row.reasoning': "推理 {tokens}";
    readonly 'row.subtotal': "小计 {amount}";
    readonly 'totals.calls': "调用次数";
    readonly 'totals.tokens': "token 合计";
    readonly 'time.llm': "模型耗时";
    readonly 'time.span': "会话跨度";
    readonly 'totals.label': "合计金额";
    readonly 'totals.peakCost': "其中工作日高峰时段费用 {amount}";
    readonly 'peak.note': "工作日高峰时段（北京时间 {window}）单价 ×{multiplier}";
    readonly 'totals.unpriced': "包含未计价模型，合计费用仅供参考";
    readonly footer: "—— 谢谢惠顾 ——";
};
/** 英文词典，与中文权威 key 一致。 */
export declare const en: Record<ReceiptKey, string>;
/** `receipt` 命名空间的 key 域（zh 为权威来源）。 */
export type ReceiptKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map