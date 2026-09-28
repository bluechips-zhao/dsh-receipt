import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client';
import type { ReceiptProjection } from '../types.ts';
export interface ReceiptChild {
    id: string;
    parentId: string;
    title: string;
    depth: number;
    receipt: ReceiptProjection | undefined;
    directChildren: number;
    descendants: number;
    branchCost: number;
    branchMissing: number;
    branchCurrencyMismatch: number;
    branchPriced: boolean;
}
export interface ReceiptTree {
    rootId: string;
    own: ReceiptProjection | undefined;
    combined: ReceiptProjection | undefined;
    children: ReceiptChild[];
    childrenByParent: Map<string, ReceiptChild[]>;
    missing: number;
    currencyMismatch: number;
    childCost: number;
}
export declare const CHILD_PAGE_SIZE = 20;
export type ReceiptVisibleRow = {
    kind: 'child';
    child: ReceiptChild;
} | {
    kind: 'more';
    parentId: string;
    depth: number;
    remaining: number;
};
/** Render only open branches and a bounded page of siblings; search reveals matching paths. */
export declare function visibleReceiptRows(tree: ReceiptTree, expanded: ReadonlySet<string>, limits: Readonly<Record<string, number>>, query: string): ReceiptVisibleRow[];
/** List rows contain direct parent ids, including catalog-only children. Walk once to avoid cycles and duplicate costs. */
export declare function receiptTree(state: SessionListState, rootId: string): ReceiptTree;
//# sourceMappingURL=receipt-tree.d.ts.map