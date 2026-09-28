import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './Receipt.module.css';
function group(value) {
    return value.toLocaleString('en-US');
}
function money(value, currency) {
    if (value > 0 && value < 0.000001)
        return `<${currency}0.000001`;
    const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
    return `${currency}${value.toFixed(digits).replace(/\.?0+$/, '') || '0'}`;
}
function duration(ms) {
    const seconds = ms / 1_000;
    if (seconds < 60)
        return `${Math.round(seconds * 10) / 10}s`;
    const whole = Math.round(seconds);
    const hours = Math.floor(whole / 3_600);
    const minutes = Math.floor((whole % 3_600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${whole % 60}s`;
}
function windowsLabel(windows) {
    return windows.map(window => `${window.start}:00–${window.end}:00`).join(' · ');
}
function tokens(row) {
    return row.inputTokens + row.cacheReadTokens + row.cacheWriteTokens + row.outputTokens;
}
function cacheRate(receipt) {
    const input = receipt.totals.inputTokens + receipt.totals.cacheReadTokens;
    return input > 0 ? `${(receipt.totals.cacheReadTokens / input * 100).toFixed(1)}%` : undefined;
}
function rowCost(row, currency, t) {
    if (row.priced)
        return money(row.cost, currency);
    return row.cost > 0 ? `${money(row.cost, currency)} · ${t('partial')}` : t('unpriced');
}
function summaryText(receipt, title, sessionId, t) {
    return [
        `${t('modal.title')} · ${title}`,
        t('session.id', { id: sessionId }),
        `${t(receipt.priced ? 'total.estimated' : 'total.known')}: ${money(receipt.totals.cost, receipt.currency)}`,
        `${t('stats.calls')}: ${group(receipt.totals.calls)}`,
        `${t('stats.tokens')}: ${group(tokens(receipt.totals))}`,
        `${t('stats.cacheHit')}: ${cacheRate(receipt) ?? t('notAvailable')}`,
        `${t('time.llm')}: ${duration(receipt.llmMs)}`,
        `${t('time.span')}: ${duration(receipt.spanMs)}`,
        '',
        ...receipt.models.map(row => `${row.model || t('unknownModel')} · ${rowCost(row, receipt.currency, t)} · ${t('row.calls', { count: group(row.calls) })}`),
        '',
        t('total.disclaimer'),
    ].join('\n');
}
function TokenMix({ receipt, t }) {
    const parts = [
        { key: 'input', name: t('detail.input'), value: receipt.totals.inputTokens },
        { key: 'cacheRead', name: t('detail.cacheRead'), value: receipt.totals.cacheReadTokens },
        { key: 'cacheWrite', name: t('detail.cacheWrite'), value: receipt.totals.cacheWriteTokens },
        { key: 'output', name: t('detail.output'), value: receipt.totals.outputTokens },
    ];
    const sum = tokens(receipt.totals);
    return (_jsxs("section", { className: css.panel, "aria-label": t('mix.title'), children: [_jsxs("div", { className: css.sectionHead, children: [_jsx("h3", { children: t('mix.title') }), _jsxs("span", { children: [group(sum), " tokens"] })] }), _jsx("div", { className: css.tokenBar, role: "img", "aria-label": parts.map(part => `${part.name} ${group(part.value)}`).join(' · '), children: sum > 0 && parts.map(part => part.value > 0
                    ? _jsx("span", { className: `${css.tokenPart} ${css[part.key]}`, style: { width: `${part.value / sum * 100}%` } }, part.key)
                    : null) }), _jsx("div", { className: css.legend, children: parts.map(part => (_jsxs("div", { className: css.legendItem, children: [_jsx("span", { className: `${css.legendDot} ${css[part.key]}`, "aria-hidden": true }), _jsx("span", { children: part.name }), _jsx("strong", { children: group(part.value) })] }, part.key))) }), receipt.totals.reasoningTokens > 0
                ? _jsx("p", { className: css.subNote, children: t('mix.reasoning', { tokens: group(receipt.totals.reasoningTokens) }) })
                : null] }));
}
function ModelMix({ receipt, t, onShowDetails }) {
    const [metric, setMetric] = useState('cost');
    const sorted = [...receipt.models].sort((a, b) => metric === 'cost'
        ? b.cost - a.cost || b.calls - a.calls
        : tokens(b) - tokens(a) || b.calls - a.calls);
    const top = sorted.slice(0, 5);
    const total = metric === 'cost' ? receipt.totals.cost : tokens(receipt.totals);
    return (_jsxs("section", { className: css.panel, "aria-label": t('models.title'), children: [_jsxs("div", { className: css.sectionHead, children: [_jsx("h3", { children: t('models.title') }), _jsx("span", { children: t('models.count', { count: group(receipt.models.length) }) })] }), _jsxs("div", { className: css.metricSwitcher, "aria-label": t('models.metric'), children: [_jsx("button", { type: "button", "aria-pressed": metric === 'cost', onClick: () => setMetric('cost'), children: t('models.metric.cost') }), _jsx("button", { type: "button", "aria-pressed": metric === 'tokens', onClick: () => setMetric('tokens'), children: t('models.metric.tokens') })] }), _jsx("div", { className: css.mixList, children: top.map(row => {
                    const value = metric === 'cost' ? row.cost : tokens(row);
                    const share = total > 0 ? value / total * 100 : 0;
                    return (_jsxs("div", { className: css.mixRow, children: [_jsxs("div", { className: css.mixHead, children: [_jsx("strong", { children: row.model || t('unknownModel') }), _jsx("span", { children: metric === 'cost' ? rowCost(row, receipt.currency, t) : t('models.tokenCount', { count: group(value) }) })] }), _jsx("div", { className: css.mixTrack, "aria-hidden": true, children: _jsx("span", { style: { width: `${share}%` } }) }), _jsxs("div", { className: css.mixMeta, children: [_jsx("span", { children: row.provider || t('unknownProvider') }), _jsxs("span", { children: [metric === 'cost' ? t('models.tokenCount', { count: group(tokens(row)) }) : rowCost(row, receipt.currency, t), " \u00B7 ", share > 0 ? `${share.toFixed(1)}%` : t('notAvailable')] })] })] }, `${row.provider}\u0000${row.model}`));
                }) }), _jsxs("button", { type: "button", className: css.detailLink, onClick: onShowDetails, children: [t('models.showDetails'), _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), receipt.models.length > top.length ? _jsx("p", { className: css.subNote, children: t('models.more', { count: group(receipt.models.length - top.length) }) }) : null] }));
}
function ModelDetails({ row, currency, t }) {
    const breakdown = [
        { label: t('detail.input'), value: row.inputTokens },
        { label: t('detail.cacheRead'), value: row.cacheReadTokens },
        { label: t('detail.cacheWrite'), value: row.cacheWriteTokens },
        { label: t('detail.output'), value: row.outputTokens },
        { label: t('detail.reasoning'), value: row.reasoningTokens },
    ];
    return (_jsxs("details", { className: css.modelDetail, "data-model": row.model || '(unknown)', children: [_jsxs("summary", { children: [_jsxs("span", { className: css.modelDetailMain, children: [_jsx("strong", { children: row.model || t('unknownModel') }), _jsxs("small", { children: [row.provider || t('unknownProvider'), " \u00B7 ", t('row.calls', { count: group(row.calls) })] })] }), _jsx("span", { className: css.modelDetailAmount, children: rowCost(row, currency, t) })] }), _jsxs("dl", { className: css.breakdown, children: [breakdown.map(item => _jsxs("div", { children: [_jsx("dt", { children: item.label }), _jsx("dd", { children: group(item.value) })] }, item.label)), _jsxs("div", { className: css.breakdownTotal, children: [_jsx("dt", { children: t('stats.tokens') }), _jsx("dd", { children: group(tokens(row)) })] })] }), row.reasoningTokens > 0 ? _jsx("p", { className: css.subNote, children: t('mix.reasoning', { tokens: group(row.reasoningTokens) }) }) : null, !row.priced ? _jsx("p", { className: css.warning, children: t('detail.partial') }) : null] }));
}
export function ReceiptCard({ sessionId, useSessions, onClose, t }) {
    const summary = useSessions((state) => state.byId[sessionId]);
    const receipt = summary?.projectionValues?.receipt;
    const title = summary?.displayTitle || t('session.untitled');
    const [view, setView] = useState('overview');
    const [copyState, setCopyState] = useState('idle');
    const closeRef = useRef(null);
    const cardRef = useRef(null);
    const switcherRef = useRef(null);
    const previousViewRef = useRef(view);
    const restoreFocusRef = useRef(false);
    useEffect(() => {
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                restoreFocusRef.current = true;
                onClose();
            }
        };
        const onPointerDown = (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            if (cardRef.current?.contains(target) || target.closest('[data-receipt-trigger]'))
                return;
            onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown);
            if (restoreFocusRef.current)
                previous?.focus();
        };
    }, [onClose]);
    useEffect(() => {
        if (copyState === 'idle')
            return;
        const timer = window.setTimeout(() => setCopyState('idle'), 2400);
        return () => window.clearTimeout(timer);
    }, [copyState]);
    useEffect(() => {
        if (previousViewRef.current === view)
            return;
        previousViewRef.current = view;
        switcherRef.current?.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    }, [view]);
    async function handleCopy() {
        if (receipt === undefined)
            return;
        try {
            await navigator.clipboard.writeText(summaryText(receipt, title, sessionId, t));
            setCopyState('copied');
        }
        catch {
            setCopyState('failed');
        }
    }
    return (_jsx("div", { className: css.anchor, children: _jsxs("div", { id: "dsh-receipt-panel", ref: cardRef, className: css.card, role: "dialog", "aria-labelledby": "dsh-receipt-title", "data-receipt-modal": true, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { children: [_jsx("div", { className: css.eyebrow, children: t('modal.eyebrow') }), _jsx("h2", { id: "dsh-receipt-title", className: css.title, children: t('modal.title') })] }), _jsxs("div", { className: css.headerActions, children: [_jsx("button", { type: "button", className: css.copyButton, "data-copy-state": copyState, onClick: () => { void handleCopy(); }, disabled: receipt === undefined, children: copyState === 'copied' ? `✓ ${t('copy.success')}` : t('copy.action') }), _jsx("button", { ref: closeRef, type: "button", className: css.close, "aria-label": t('modal.close'), onClick: () => { restoreFocusRef.current = true; onClose(); }, children: _jsx(IconCloseOutlineRegular, { size: 17 }) })] })] }), _jsx("div", { className: css.body, children: receipt === undefined ? _jsx("p", { className: css.empty, children: t('empty') }) : (_jsxs("div", { className: css.dashboard, "data-receipt-content": true, children: [_jsxs("div", { className: css.sessionMeta, children: [_jsx("strong", { title: title, children: title }), _jsx("span", { children: receipt.updatedAt > 0 ? t('updatedAt', { time: new Date(receipt.updatedAt).toLocaleString() }) : t('updated.unknown') })] }), _jsxs("div", { className: css.hero, children: [_jsx("div", { className: css.heroLabel, children: t(receipt.priced ? 'total.estimated' : 'total.known') }), _jsx("div", { className: css.heroAmount, children: money(receipt.totals.cost, receipt.currency) }), _jsx("p", { children: t('total.disclaimer') })] }), _jsxs("div", { className: css.stats, children: [_jsxs("div", { children: [_jsx("span", { children: t('stats.calls') }), _jsx("strong", { children: group(receipt.totals.calls) })] }), _jsxs("div", { children: [_jsx("span", { children: t('stats.tokens') }), _jsx("strong", { children: group(tokens(receipt.totals)) })] }), _jsxs("div", { children: [_jsx("span", { children: t('stats.cacheHit') }), _jsx("strong", { children: cacheRate(receipt) ?? t('notAvailable') })] }), _jsxs("div", { children: [_jsx("span", { children: t('stats.avg') }), _jsx("strong", { children: receipt.priced && receipt.totals.calls > 0 ? money(receipt.totals.cost / receipt.totals.calls, receipt.currency) : t('notAvailable') })] })] }), receipt.models.length > 0 && !receipt.priced ? _jsx("p", { className: css.warning, children: t('totals.unpriced') }) : null, _jsxs("div", { ref: switcherRef, className: css.switcher, "aria-label": t('view.label'), children: [_jsx("button", { type: "button", "aria-pressed": view === 'overview', onClick: () => setView('overview'), children: t('view.overview') }), _jsx("button", { type: "button", "aria-pressed": view === 'models', onClick: () => setView('models'), children: t('view.models') })] }), view === 'overview' ? (_jsxs("div", { className: css.sections, children: [_jsx(TokenMix, { receipt: receipt, t: t }), receipt.models.length > 0 ? _jsx(ModelMix, { receipt: receipt, t: t, onShowDetails: () => setView('models') }) : null, _jsxs("section", { className: css.panel, children: [_jsx("div", { className: css.sectionHead, children: _jsx("h3", { children: t('time.title') }) }), _jsxs("div", { className: css.inlineMetrics, children: [_jsxs("div", { children: [_jsx("span", { children: t('time.llm') }), _jsx("strong", { children: duration(receipt.llmMs) })] }), _jsxs("div", { children: [_jsx("span", { children: t('time.span') }), _jsx("strong", { children: duration(receipt.spanMs) })] })] }), receipt.totals.peakCost > 0 ? _jsx("p", { className: css.subNote, children: t('totals.peakCost', { amount: money(receipt.totals.peakCost, receipt.currency) }) }) : null, _jsx("p", { className: css.subNote, children: t('peak.note', { window: windowsLabel(receipt.peakHours), multiplier: group(receipt.peakMultiplier) }) })] })] })) : (_jsxs("div", { className: css.sections, children: [_jsxs("div", { className: css.sectionHead, children: [_jsx("h3", { children: t('detail.title') }), _jsx("span", { children: t('models.count', { count: group(receipt.models.length) }) })] }), receipt.models.length === 0 ? _jsx("p", { className: css.empty, children: t('empty') }) : receipt.models.map((row) => _jsx(ModelDetails, { row: row, currency: receipt.currency, t: t }, `${row.provider}\u0000${row.model}`)), _jsx("p", { className: css.sessionId, children: t('session.id', { id: sessionId }) })] })), _jsx("div", { className: css.footer, children: t('footer') })] })) }), _jsx("span", { className: css.copyStatus, role: "status", "aria-live": "polite", children: copyState === 'copied' ? t('copy.success') : copyState === 'failed' ? t('copy.failed') : '' })] }) }));
}
//# sourceMappingURL=ReceiptCard.js.map