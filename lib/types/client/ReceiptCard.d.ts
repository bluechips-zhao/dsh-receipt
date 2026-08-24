import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
import { NS } from './locales.ts';
/** 小票卡片的完整 props（由 ReceiptOverlay 组装）。 */
export interface ReceiptCardProps {
    sessionId: string;
    useSessions: SnapshotSelectorHook<SessionListState>;
    onClose: () => void;
    t: TranslateNS<typeof NS>;
}
/**
 * 小票弹层：全屏遮罩 + 居中"收据"卡片。数据来自 useSessions 行上的
 * `projectionValues.receipt`（host 投影值随 session/projection 帧实时刷新）。
 * 支持 Escape 关闭、点击遮罩关闭、焦点落入关闭按钮、卸载归还焦点。
 */
export declare function ReceiptCard({ sessionId, useSessions, onClose, t }: ReceiptCardProps): import("react").JSX.Element;
//# sourceMappingURL=ReceiptCard.d.ts.map