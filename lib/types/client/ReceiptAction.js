import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSyncExternalStore } from 'react';
import { IconDataOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives';
import { receiptUi } from "./receipt-ui.js";
import css from './ReceiptAction.module.css';
/**
 * 会话头部的小票按钮：点击切换本会话的消费小票弹层。
 * 数据经 `receipt` 投影由 host 计算，这里只负责打开入口。
 * @param props - session kit（sessionId）+ locale seat。
 */
export function ReceiptAction({ sessionId, t }) {
    const ui = useSyncExternalStore(receiptUi.subscribe, receiptUi.getSnapshot);
    const expanded = ui.open && ui.sessionId === sessionId;
    return (_jsxs("button", { type: "button", className: css.trigger, "data-receipt-trigger": true, "data-expanded": expanded, "aria-label": t('action.aria'), "aria-haspopup": "dialog", "aria-controls": expanded ? 'dsh-receipt-panel' : undefined, "aria-expanded": expanded, title: t('action.aria'), onClick: () => receiptUi.toggle(sessionId), children: [_jsx(IconDataOutlineRegular, { size: 16 }), _jsx("span", { className: css.label, children: t('action.label') })] }));
}
//# sourceMappingURL=ReceiptAction.js.map