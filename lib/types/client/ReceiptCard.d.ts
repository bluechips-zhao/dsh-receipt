import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client';
import { NS } from './locales.ts';
export interface ReceiptCardProps {
    sessionId: string;
    useSessions: SnapshotSelectorHook<SessionListState>;
    onClose: () => void;
    t: TranslateNS<typeof NS>;
}
export declare function ReceiptCard({ sessionId, useSessions, onClose, t }: ReceiptCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReceiptCard.d.ts.map