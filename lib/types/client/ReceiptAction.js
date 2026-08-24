import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconDataOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import { receiptUi } from "./receipt-ui.js";
import css from './ReceiptAction.module.css';
/**
 * 会话头部的小票按钮：点击切换本会话的消费小票弹层。
 * 数据经 `receipt` 投影由 host 计算，这里只负责打开入口。
 * @param props - session kit（sessionId）+ locale seat。
 */
export function ReceiptAction({ sessionId, t }) {
    return (_jsxs("button", { type: "button", className: css.trigger, "aria-label": t('action.aria'), title: t('action.aria'), onClick: () => receiptUi.toggle(sessionId), children: [_jsx(IconDataOutline16, {}), _jsx("span", { className: css.label, children: t('action.label') })] }));
}
//# sourceMappingURL=ReceiptAction.js.map