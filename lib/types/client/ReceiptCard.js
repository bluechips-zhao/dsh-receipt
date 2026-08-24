import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './Receipt.module.css';
/** 千分位数字。 */
function group(n) {
    return n.toLocaleString('en-US');
}
/** 金额：≥1 保留 2 位，<1 保留 4 位，去掉尾零。 */
function formatMoney(n) {
    if (n === 0)
        return '0';
    return n.toFixed(n >= 1 ? 2 : 4).replace(/\.?0+$/, '');
}
/** 时长：<60s 显示秒，之后 m/s，超过 1h 显示 h/m。 */
function formatDuration(ms) {
    const seconds = ms / 1_000;
    if (seconds < 60)
        return `${Math.round(seconds * 10) / 10}s`;
    const whole = Math.round(seconds);
    const hours = Math.floor(whole / 3_600);
    const minutes = Math.floor((whole % 3_600) / 60);
    const rest = whole % 60;
    if (hours > 0)
        return `${hours}h${minutes}m`;
    return `${minutes}m${rest}s`;
}
/** 出票时间本地化字符串。 */
function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}
/** 高峰窗口文案：`9:00-12:00、14:00-18:00`。 */
function formatPeakWindows(windows) {
    return windows.map(window => `${window.start}:00-${window.end}:00`).join('、');
}
/** 按模型渲染一行明细：模型名 + 调用次数 + 各 token 分桶 + 小计。 */
function ModelBlock({ row, currency, t, }) {
    const label = row.model === '' ? t('unknownModel') : row.model;
    const provider = row.provider === '' ? undefined : row.provider;
    const lines = [];
    if (row.inputTokens > 0)
        lines.push(t('row.input', { tokens: group(row.inputTokens) }));
    if (row.cacheReadTokens > 0)
        lines.push(t('row.cacheRead', { tokens: group(row.cacheReadTokens) }));
    if (row.cacheWriteTokens > 0)
        lines.push(t('row.cacheWrite', { tokens: group(row.cacheWriteTokens) }));
    if (row.outputTokens > 0)
        lines.push(t('row.output', { tokens: group(row.outputTokens) }));
    if (row.reasoningTokens > 0)
        lines.push(t('row.reasoning', { tokens: group(row.reasoningTokens) }));
    return (_jsxs("section", { className: css.model, "data-model": row.model || '(unknown)', children: [_jsxs("div", { className: css.modelHead, children: [_jsxs("span", { className: css.modelName, children: [label, provider === undefined ? null : _jsxs("span", { className: css.provider, children: [" \u00B7 ", provider] })] }), _jsx("span", { className: row.priced ? css.subtotal : css.unpriced, children: row.priced ? `${currency}${formatMoney(row.cost)}` : t('unpriced') })] }), _jsx("div", { className: css.modelCalls, children: t('row.calls', { count: group(row.calls) }) }), lines.length === 0
                ? _jsx("div", { className: css.modelLine, children: t('row.subtotal', { amount: `${currency}0` }) })
                : _jsx("ul", { className: css.modelLines, children: lines.map(line => _jsx("li", { children: line }, String(line))) })] }));
}
/** 小票主体内容：元信息 + 各模型明细 + 合计 + 金额。 */
function ReceiptContent({ receipt, sessionTitle, sessionId, t, }) {
    return (_jsxs("div", { className: css.receipt, "data-receipt-content": true, children: [_jsxs("div", { className: css.meta, children: [sessionTitle === undefined ? null : _jsx("div", { className: css.sessionTitle, children: sessionTitle }), _jsx("div", { className: css.sessionId, children: t('session.id', { id: sessionId }) }), _jsx("div", { className: css.printedAt, children: t('printedAt', { time: formatDateTime(receipt.updatedAt) }) })] }), _jsx("div", { className: css.sep, "aria-hidden": true }), receipt.models.length === 0
                ? _jsx("p", { className: css.empty, children: t('empty') })
                : (_jsxs(_Fragment, { children: [receipt.models.map(row => (_jsx(ModelBlock, { row: row, currency: receipt.currency, t: t }, `${row.provider}\u0000${row.model}`))), _jsx("div", { className: css.sep, "aria-hidden": true }), _jsxs("dl", { className: css.totals, children: [_jsxs("div", { className: css.totalRow, children: [_jsx("dt", { children: t('totals.calls') }), _jsx("dd", { children: group(receipt.totals.calls) })] }), _jsxs("div", { className: css.totalRow, children: [_jsx("dt", { children: t('totals.tokens') }), _jsx("dd", { children: group(receipt.totals.inputTokens + receipt.totals.outputTokens + receipt.totals.cacheReadTokens + receipt.totals.cacheWriteTokens + receipt.totals.reasoningTokens) })] }), _jsxs("div", { className: css.totalRow, children: [_jsx("dt", { children: t('time.llm') }), _jsx("dd", { children: formatDuration(receipt.llmMs) })] }), _jsxs("div", { className: css.totalRow, children: [_jsx("dt", { children: t('time.span') }), _jsx("dd", { children: formatDuration(receipt.spanMs) })] })] }), _jsxs("div", { className: css.grandTotal, children: [_jsx("span", { children: t('totals.label') }), _jsxs("span", { className: css.amount, children: [receipt.currency, formatMoney(receipt.totals.cost)] })] }), receipt.totals.peakCost > 0
                            ? _jsx("div", { className: css.peakLine, children: t('totals.peakCost', { amount: `${receipt.currency}${formatMoney(receipt.totals.peakCost)}` }) })
                            : null, receipt.priced ? null : _jsx("div", { className: css.unpricedHint, children: t('totals.unpriced') }), receipt.totals.peakCost > 0
                            ? _jsx("div", { className: css.peakNote, children: t('peak.note', { window: formatPeakWindows(receipt.peakHours), multiplier: group(receipt.peakMultiplier) }) })
                            : null] })), _jsx("div", { className: css.footer, "aria-hidden": true, children: t('footer') })] }));
}
/**
 * 小票弹层：全屏遮罩 + 居中"收据"卡片。数据来自 useSessions 行上的
 * `projectionValues.receipt`（host 投影值随 session/projection 帧实时刷新）。
 * 支持 Escape 关闭、点击遮罩关闭、焦点落入关闭按钮、卸载归还焦点。
 */
export function ReceiptCard({ sessionId, useSessions, onClose, t }) {
    const summary = useSessions(state => state.byId[sessionId]);
    const receipt = summary?.projectionValues?.receipt;
    const closeRef = useRef(null);
    useEffect(() => {
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            event.preventDefault();
            onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previous?.focus();
        };
    }, [onClose]);
    return (_jsx("div", { className: css.backdrop, onPointerDown: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: css.card, role: "dialog", "aria-modal": "true", "aria-label": t('modal.title'), "data-receipt-modal": true, children: [_jsxs("header", { className: css.header, children: [_jsx("h2", { className: css.title, children: t('modal.title') }), _jsx("button", { ref: closeRef, type: "button", className: css.close, "aria-label": t('modal.close'), onClick: onClose, children: _jsx(IconCloseOutline16, {}) })] }), _jsx("div", { className: css.body, children: receipt === undefined
                        ? _jsx("p", { className: css.empty, children: t('empty') })
                        : (_jsx(ReceiptContent, { receipt: receipt, sessionTitle: summary?.displayTitle, sessionId: sessionId, t: t })) })] }) }));
}
//# sourceMappingURL=ReceiptCard.js.map