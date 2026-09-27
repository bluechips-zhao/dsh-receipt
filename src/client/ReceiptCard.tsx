import { useEffect, useRef, useState } from 'react'
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ReceiptModelRow, ReceiptPeakWindow, ReceiptProjection } from '../types.ts'
import { NS } from './locales.ts'
import css from './Receipt.module.css'

export interface ReceiptCardProps {
  sessionId: string
  useSessions: SnapshotSelectorHook<SessionListState>
  onClose: () => void
  t: TranslateNS<typeof NS>
}

type Translator = TranslateNS<typeof NS>

function group(value: number): string {
  return value.toLocaleString('en-US')
}

function money(value: number, currency: string): string {
  if (value > 0 && value < 0.000001) return `<${currency}0.000001`
  const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6
  return `${currency}${value.toFixed(digits).replace(/\.?0+$/, '') || '0'}`
}

function duration(ms: number): string {
  const seconds = ms / 1_000
  if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`
  const whole = Math.round(seconds)
  const hours = Math.floor(whole / 3_600)
  const minutes = Math.floor((whole % 3_600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${whole % 60}s`
}

function windowsLabel(windows: readonly ReceiptPeakWindow[]): string {
  return windows.map(window => `${window.start}:00–${window.end}:00`).join(' · ')
}

function tokens(row: ReceiptModelRow | ReceiptProjection['totals']): number {
  return row.inputTokens + row.cacheReadTokens + row.cacheWriteTokens + row.outputTokens
}

function cacheRate(receipt: ReceiptProjection): string | undefined {
  const input = receipt.totals.inputTokens + receipt.totals.cacheReadTokens
  return input > 0 ? `${(receipt.totals.cacheReadTokens / input * 100).toFixed(1)}%` : undefined
}

function rowCost(row: ReceiptModelRow, currency: string, t: Translator): string {
  if (row.priced) return money(row.cost, currency)
  return row.cost > 0 ? `${money(row.cost, currency)} · ${t('partial')}` : t('unpriced')
}

function summaryText(receipt: ReceiptProjection, title: string, sessionId: string, t: Translator): string {
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
  ].join('\n')
}

function TokenMix({ receipt, t }: { receipt: ReceiptProjection; t: Translator }) {
  const parts = [
    { key: 'input', name: t('detail.input'), value: receipt.totals.inputTokens },
    { key: 'cacheRead', name: t('detail.cacheRead'), value: receipt.totals.cacheReadTokens },
    { key: 'cacheWrite', name: t('detail.cacheWrite'), value: receipt.totals.cacheWriteTokens },
    { key: 'output', name: t('detail.output'), value: receipt.totals.outputTokens },
  ] as const
  const sum = tokens(receipt.totals)
  return (
    <section className={css.panel} aria-label={t('mix.title')}>
      <div className={css.sectionHead}><h3>{t('mix.title')}</h3><span>{group(sum)} tokens</span></div>
      <div className={css.tokenBar} role="img" aria-label={parts.map(part => `${part.name} ${group(part.value)}`).join(' · ')}>
        {sum > 0 && parts.map(part => part.value > 0
          ? <span key={part.key} className={`${css.tokenPart} ${css[part.key]}`} style={{ width: `${part.value / sum * 100}%` }} />
          : null)}
      </div>
      <div className={css.legend}>
        {parts.map(part => (
          <div key={part.key} className={css.legendItem}>
            <span className={`${css.legendDot} ${css[part.key]}`} aria-hidden />
            <span>{part.name}</span><strong>{group(part.value)}</strong>
          </div>
        ))}
      </div>
      {receipt.totals.reasoningTokens > 0
        ? <p className={css.subNote}>{t('mix.reasoning', { tokens: group(receipt.totals.reasoningTokens) })}</p>
        : null}
    </section>
  )
}

function ModelMix({ receipt, t }: { receipt: ReceiptProjection; t: Translator }) {
  const [metric, setMetric] = useState<'cost' | 'tokens'>('cost')
  const sorted = [...receipt.models].sort((a, b) => metric === 'cost'
    ? b.cost - a.cost || b.calls - a.calls
    : tokens(b) - tokens(a) || b.calls - a.calls)
  const top = sorted.slice(0, 5)
  const total = metric === 'cost' ? receipt.totals.cost : tokens(receipt.totals)
  return (
    <section className={css.panel} aria-label={t('models.title')}>
      <div className={css.sectionHead}><h3>{t('models.title')}</h3><span>{t('models.count', { count: group(receipt.models.length) })}</span></div>
      <div className={css.metricSwitcher} aria-label={t('models.metric')}>
        <button type="button" aria-pressed={metric === 'cost'} onClick={() => setMetric('cost')}>{t('models.metric.cost')}</button>
        <button type="button" aria-pressed={metric === 'tokens'} onClick={() => setMetric('tokens')}>{t('models.metric.tokens')}</button>
      </div>
      <div className={css.mixList}>
        {top.map(row => {
          const value = metric === 'cost' ? row.cost : tokens(row)
          const share = total > 0 ? value / total * 100 : 0
          return (
            <div className={css.mixRow} key={`${row.provider}\u0000${row.model}`}>
              <div className={css.mixHead}><strong>{row.model || t('unknownModel')}</strong><span>{metric === 'cost' ? rowCost(row, receipt.currency, t) : t('models.tokenCount', { count: group(value) })}</span></div>
              <div className={css.mixTrack} aria-hidden><span style={{ width: `${share}%` }} /></div>
              <div className={css.mixMeta}><span>{row.provider || t('unknownProvider')}</span><span>{metric === 'cost' ? t('models.tokenCount', { count: group(tokens(row)) }) : rowCost(row, receipt.currency, t)} · {share > 0 ? `${share.toFixed(1)}%` : t('notAvailable')}</span></div>
            </div>
          )
        })}
      </div>
      {receipt.models.length > top.length ? <p className={css.subNote}>{t('models.more', { count: group(receipt.models.length - top.length) })}</p> : null}
    </section>
  )
}

function ModelDetails({ row, currency, t }: { row: ReceiptModelRow; currency: string; t: Translator }) {
  const breakdown = [
    { label: t('detail.input'), value: row.inputTokens },
    { label: t('detail.cacheRead'), value: row.cacheReadTokens },
    { label: t('detail.cacheWrite'), value: row.cacheWriteTokens },
    { label: t('detail.output'), value: row.outputTokens },
    { label: t('detail.reasoning'), value: row.reasoningTokens },
  ]
  return (
    <details className={css.modelDetail} data-model={row.model || '(unknown)'}>
      <summary>
        <span className={css.modelDetailMain}><strong>{row.model || t('unknownModel')}</strong><small>{row.provider || t('unknownProvider')} · {t('row.calls', { count: group(row.calls) })}</small></span>
        <span className={css.modelDetailAmount}>{rowCost(row, currency, t)}</span>
      </summary>
      <dl className={css.breakdown}>
        {breakdown.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{group(item.value)}</dd></div>)}
        <div className={css.breakdownTotal}><dt>{t('stats.tokens')}</dt><dd>{group(tokens(row))}</dd></div>
      </dl>
      {row.reasoningTokens > 0 ? <p className={css.subNote}>{t('mix.reasoning', { tokens: group(row.reasoningTokens) })}</p> : null}
      {!row.priced ? <p className={css.warning}>{t('detail.partial')}</p> : null}
    </details>
  )
}

export function ReceiptCard({ sessionId, useSessions, onClose, t }: ReceiptCardProps) {
  const summary = useSessions((state: SessionListState) => state.byId[sessionId as keyof SessionListState['byId']])
  const receipt = summary?.projectionValues?.receipt
  const title = summary?.displayTitle || t('session.untitled')
  const [view, setView] = useState<'overview' | 'models'>('overview')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key !== 'Tab' || cardRef.current === null) return
      const focusable = Array.from(cardRef.current.querySelectorAll<HTMLElement>('button, summary, [tabindex]:not([tabindex="-1"])'))
        .filter(element => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  async function handleCopy(): Promise<void> {
    if (receipt === undefined) return
    try {
      await navigator.clipboard.writeText(summaryText(receipt, title, sessionId, t))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className={css.backdrop} onPointerDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={cardRef} className={css.card} role="dialog" aria-modal="true" aria-labelledby="dsh-receipt-title" data-receipt-modal>
        <header className={css.header}>
          <div><div className={css.eyebrow}>{t('modal.eyebrow')}</div><h2 id="dsh-receipt-title" className={css.title}>{t('modal.title')}</h2></div>
          <div className={css.headerActions}>
            <button type="button" className={css.copyButton} onClick={() => { void handleCopy() }} disabled={receipt === undefined}>{t('copy.action')}</button>
            <button ref={closeRef} type="button" className={css.close} aria-label={t('modal.close')} onClick={onClose}><IconCloseOutlineRegular size={17} /></button>
          </div>
        </header>
        <div className={css.body}>
          {receipt === undefined ? <p className={css.empty}>{t('empty')}</p> : (
            <div className={css.dashboard} data-receipt-content>
              <div className={css.sessionMeta}><strong title={title}>{title}</strong><span>{receipt.updatedAt > 0 ? t('updatedAt', { time: new Date(receipt.updatedAt).toLocaleString() }) : t('updated.unknown')}</span></div>
              <div className={css.hero}><div className={css.heroLabel}>{t(receipt.priced ? 'total.estimated' : 'total.known')}</div><div className={css.heroAmount}>{money(receipt.totals.cost, receipt.currency)}</div><p>{t('total.disclaimer')}</p></div>
              <div className={css.stats}>
                <div><span>{t('stats.calls')}</span><strong>{group(receipt.totals.calls)}</strong></div>
                <div><span>{t('stats.tokens')}</span><strong>{group(tokens(receipt.totals))}</strong></div>
                <div><span>{t('stats.cacheHit')}</span><strong>{cacheRate(receipt) ?? t('notAvailable')}</strong></div>
                <div><span>{t('stats.avg')}</span><strong>{receipt.priced && receipt.totals.calls > 0 ? money(receipt.totals.cost / receipt.totals.calls, receipt.currency) : t('notAvailable')}</strong></div>
              </div>
              {receipt.models.length > 0 && !receipt.priced ? <p className={css.warning}>{t('totals.unpriced')}</p> : null}
              <div className={css.switcher} aria-label={t('view.label')}>
                <button type="button" aria-pressed={view === 'overview'} onClick={() => setView('overview')}>{t('view.overview')}</button>
                <button type="button" aria-pressed={view === 'models'} onClick={() => setView('models')}>{t('view.models')}</button>
              </div>
              {view === 'overview' ? (
                <div className={css.sections}>
                  <TokenMix receipt={receipt} t={t} />
                  {receipt.models.length > 0 ? <ModelMix receipt={receipt} t={t} /> : null}
                  <section className={css.panel}>
                    <div className={css.sectionHead}><h3>{t('time.title')}</h3></div>
                    <div className={css.inlineMetrics}><div><span>{t('time.llm')}</span><strong>{duration(receipt.llmMs)}</strong></div><div><span>{t('time.span')}</span><strong>{duration(receipt.spanMs)}</strong></div></div>
                    {receipt.totals.peakCost > 0 ? <p className={css.subNote}>{t('totals.peakCost', { amount: money(receipt.totals.peakCost, receipt.currency) })}</p> : null}
                    <p className={css.subNote}>{t('peak.note', { window: windowsLabel(receipt.peakHours), multiplier: group(receipt.peakMultiplier) })}</p>
                  </section>
                </div>
              ) : (
                <div className={css.sections}>
                  <div className={css.sectionHead}><h3>{t('detail.title')}</h3><span>{t('models.count', { count: group(receipt.models.length) })}</span></div>
                  {receipt.models.length === 0 ? <p className={css.empty}>{t('empty')}</p> : receipt.models.map((row: ReceiptModelRow) => <ModelDetails key={`${row.provider}\u0000${row.model}`} row={row} currency={receipt.currency} t={t} />)}
                  <p className={css.sessionId}>{t('session.id', { id: sessionId })}</p>
                </div>
              )}
              <div className={css.footer}>{t('footer')}</div>
            </div>
          )}
        </div>
        <span className={css.copyStatus} role="status" aria-live="polite">{copyState === 'copied' ? t('copy.success') : copyState === 'failed' ? t('copy.failed') : ''}</span>
      </div>
    </div>
  )
}
