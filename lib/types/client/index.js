/**
 * 小票插件 browser 半：注册会话 header 的小票按钮与 shell.overlay 弹层。
 * 数据完全来自 host 的 `receipt` 投影（session/projection 帧 / list 行），
 * 本半不发起任何 RPC、不持有会话数据，只协调弹层打开状态。
 *
 * @module dsh-receipt/client
 */
import { ReceiptAction } from "./ReceiptAction.js";
import { ReceiptOverlay } from "./ReceiptOverlay.js";
import { en, NS, zh } from "./locales.js";
/** 必需服务：字典注册 + 两个 slot 座位。 */
export const inject = ['sessions', 'slots', 'locale'];
/**
 * 客户端插件体：注册字典、header action 与 overlay 条目。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-receipt: dictionaries');
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'receipt',
        // 排在 subagent / jobs 之后：小票是最不紧急的 header 控件。
        order: 40,
        locale: NS,
    }, ReceiptAction));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'receipt',
        locale: NS,
    }, ReceiptOverlay));
}
//# sourceMappingURL=index.js.map