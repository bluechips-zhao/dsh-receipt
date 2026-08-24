import { useEffect, useRef, type ReactNode } from 'react'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { ReceiptModelRow, ReceiptPeakWindow, ReceiptProjection } from '../types.ts'
import { NS } from './locales.ts'
import css from './Receipt.module.css'

/** 小票卡片的完整 props（由 ReceiptOverlay 组装）。 */
export interface ReceiptCardProps {
  sessionId: string
  useSessions: SnapshotSelectorHook<SessionListState>
  onClose: () => void
  t: TranslateNS<typeof NS>
}

/** 千分位数字。 */
function group(n: number): string {
  return n.toLocaleString('en-US')
}

/** 金额：≥1 保留 2 位，<1 保留 4 位，去掉尾零。 */
function formatMoney(n: number): string {
  if (n === 0) return '0'
  return n.toFixed(n >= 1 ? 2 : 4).replace(/\.?0+$/, '')
}

/** 时长：<60s 显示秒，之后 m/s，超过 1h 显示 h/m。 */
function formatDuration(ms: number): string {
  const seconds = ms / 1_000
  if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`
  const whole = Math.round(seconds)
  const hours = Math.floor(whole / 3_600)
  const minutes = Math.floor((whole % 3_600) / 60)
  const rest = whole % 60
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m${rest}s`
}

/** 出票时间本地化字符串。 */
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

/** 高峰窗口文案：`9:00-12:00、14:00-18:00`。 */
function formatPeakWindows(windows: readonly ReceiptPeakWindow[]): string {
  return windows.map(window => `${window.start}:00-${window.end}:00`).join('、')
}

/** 按模型渲染一行明细：模型名 + 调用次数 + 各 token 分桶 + 小计。 */
function ModelBlock({
  row,
  currency,
  t,
}: {
  row: ReceiptModelRow
  currency: string
  t: TranslateNS<typeof NS>
}) {
  const label = row.model === '' ? t('unknownModel') : row.model
  const provider = row.provider === '' ? undefined : row.provider
  const lines: ReactNode[] = []
  if (row.inputTokens > 0) lines.push(t('row.input', { tokens: group(row.inputTokens) }))
  if (row.cacheReadTokens > 0) lines.push(t('row.cacheRead', { tokens: group(row.cacheReadTokens) }))
  if (row.cacheWriteTokens > 0) lines.push(t('row.cacheWrite', { tokens: group(row.cacheWriteTokens) }))
  if (row.outputTokens > 0) lines.push(t('row.output', { tokens: group(row.outputTokens) }))
  if (row.reasoningTokens > 0) lines.push(t('row.reasoning', { tokens: group(row.reasoningTokens) }))
  return (
    <section className={css.model} data-model={row.model || '(unknown)'}>
      <div className={css.modelHead}>
        <span className={css.modelName}>
          {label}
          {provider === undefined ? null : <span className={css.provider}> · {provider}</span>}
        </span>
        <span className={row.priced ? css.subtotal : css.unpriced}>
          {row.priced ? `${currency}${formatMoney(row.cost)}` : t('unpriced')}
        </span>
      </div>
      <div className={css.modelCalls}>{t('row.calls', { count: group(row.calls) })}</div>
      {lines.length === 0
        ? <div className={css.modelLine}>{t('row.subtotal', { amount: `${currency}0` })}</div>
        : <ul className={css.modelLines}>{lines.map(line => <li key={String(line)}>{line}</li>)}</ul>}
    </section>
  )
}

/** 小票主体内容：元信息 + 各模型明细 + 合计 + 金额。 */
function ReceiptContent({
  receipt,
  sessionTitle,
  sessionId,
  t,
}: {
  receipt: ReceiptProjection
  sessionTitle: string | undefined
  sessionId: string
  t: TranslateNS<typeof NS>
}) {
  return (
    <div className={css.receipt} data-receipt-content>
      <div className={css.meta}>
        {sessionTitle === undefined ? null : <div className={css.sessionTitle}>{sessionTitle}</div>}
        <div className={css.sessionId}>{t('session.id', { id: sessionId })}</div>
        <div className={css.printedAt}>{t('printedAt', { time: formatDateTime(receipt.updatedAt) })}</div>
      </div>
      <div className={css.sep} aria-hidden />
      {receipt.models.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : (
          <>
            {receipt.models.map(row => (
              <ModelBlock
                key={`${row.provider}\u0000${row.model}`}
                row={row}
                currency={receipt.currency}
                t={t}
              />
            ))}
            <div className={css.sep} aria-hidden />
            <dl className={css.totals}>
              <div className={css.totalRow}><dt>{t('totals.calls')}</dt><dd>{group(receipt.totals.calls)}</dd></div>
              <div className={css.totalRow}>
                <dt>{t('totals.tokens')}</dt>
                <dd>{group(receipt.totals.inputTokens + receipt.totals.outputTokens + receipt.totals.cacheReadTokens + receipt.totals.cacheWriteTokens + receipt.totals.reasoningTokens)}</dd>
              </div>
              <div className={css.totalRow}><dt>{t('time.llm')}</dt><dd>{formatDuration(receipt.llmMs)}</dd></div>
              <div className={css.totalRow}><dt>{t('time.span')}</dt><dd>{formatDuration(receipt.spanMs)}</dd></div>
            </dl>
            <div className={css.grandTotal}>
              <span>{t('totals.label')}</span>
              <span className={css.amount}>{receipt.currency}{formatMoney(receipt.totals.cost)}</span>
            </div>
            {receipt.totals.peakCost > 0
              ? <div className={css.peakLine}>{t('totals.peakCost', { amount: `${receipt.currency}${formatMoney(receipt.totals.peakCost)}` })}</div>
              : null}
            {receipt.priced ? null : <div className={css.unpricedHint}>{t('totals.unpriced')}</div>}
            {receipt.totals.peakCost > 0
              ? <div className={css.peakNote}>{t('peak.note', { window: formatPeakWindows(receipt.peakHours), multiplier: group(receipt.peakMultiplier) })}</div>
              : null}
          </>
        )}
      <div className={css.footer} aria-hidden>{t('footer')}</div>
    </div>
  )
}

/**
 * 小票弹层：全屏遮罩 + 居中"收据"卡片。数据来自 useSessions 行上的
 * `projectionValues.receipt`（host 投影值随 session/projection 帧实时刷新）。
 * 支持 Escape 关闭、点击遮罩关闭、焦点落入关闭按钮、卸载归还焦点。
 */
export function ReceiptCard({ sessionId, useSessions, onClose, t }: ReceiptCardProps) {
  const summary = useSessions(state => state.byId[sessionId])
  const receipt = summary?.projectionValues?.receipt
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className={css.backdrop}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={css.card} role="dialog" aria-modal="true" aria-label={t('modal.title')} data-receipt-modal>
        <header className={css.header}>
          <h2 className={css.title}>{t('modal.title')}</h2>
          <button
            ref={closeRef}
            type="button"
            className={css.close}
            aria-label={t('modal.close')}
            onClick={onClose}
          >
            <IconCloseOutline16 />
          </button>
        </header>
        <div className={css.body}>
          {receipt === undefined
            ? <p className={css.empty}>{t('empty')}</p>
            : (
              <ReceiptContent
                receipt={receipt}
                sessionTitle={summary?.displayTitle}
                sessionId={sessionId}
                t={t}
              />
            )}
        </div>
      </div>
    </div>
  )
}
