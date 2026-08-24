/**
 * 小票弹层的模块级打开状态：header action 写入，shell.overlay 条目订阅。
 * 两个条目来自同一个 client bundle，共享同一模块实例，因此这是合法的
 * 插件内部协调（不跨插件）。
 */
/** 弹层打开状态快照。 */
export interface ReceiptUiState {
    open: boolean;
    /** 目标会话 id；关闭时为 undefined。 */
    sessionId: string | undefined;
}
/** HostObservable 形状的打开状态面（供 useSyncExternalStore 订阅）。 */
export declare const receiptUi: {
    getSnapshot: () => ReceiptUiState;
    subscribe(listener: () => void): () => void;
    /** 切换某会话的小票（再次点击同一会话收起）。 */
    toggle(sessionId: string): void;
    close(): void;
};
//# sourceMappingURL=receipt-ui.d.ts.map