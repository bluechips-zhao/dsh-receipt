import { jsx as _jsx } from "react/jsx-runtime";
import { useSyncExternalStore } from 'react';
import { receiptUi } from "./receipt-ui.js";
import { ReceiptCard } from "./ReceiptCard.js";
/**
 * 小票弹层的 overlay 座位：订阅模块级打开状态，打开时渲染小票卡片。
 * 关闭时返回 null，不占任何布局。
 * @param props - root kit + locale seat。
 */
export function ReceiptOverlay({ useSessions, t }) {
    const ui = useSyncExternalStore(receiptUi.subscribe, receiptUi.getSnapshot);
    if (!ui.open || ui.sessionId === undefined)
        return null;
    return (_jsx(ReceiptCard, { sessionId: ui.sessionId, useSessions: useSessions, onClose: receiptUi.close, t: t }));
}
//# sourceMappingURL=ReceiptOverlay.js.map