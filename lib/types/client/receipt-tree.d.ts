import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client';
import type { ReceiptProjection } from '../types.ts';
export interface ReceiptChild {
    id: string;
    title: string;
    depth: number;
    receipt: ReceiptProjection | undefined;
}
export interface ReceiptTree {
    own: ReceiptProjection | undefined;
    combined: ReceiptProjection | undefined;
    children: ReceiptChild[];
    missing: number;
    currencyMismatch: number;
    childCost: number;
}
/** List rows contain direct parent ids, including catalog-only children. Walk once to avoid cycles and duplicate costs. */
export declare function receiptTree(state: SessionListState, rootId: string): ReceiptTree;
//# sourceMappingURL=receipt-tree.d.ts.map