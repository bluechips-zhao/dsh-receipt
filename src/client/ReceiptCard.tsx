import { useEffect, useRef, useState } from 'react'
import { IconCloseOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ReceiptModelRow, ReceiptPeakWindow, ReceiptProjection } from '../types.ts'
import { NS } from './locales.ts'
import { receiptTree, type ReceiptTree } from './receipt-tree.ts'
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

function summaryText(receipt: ReceiptProjection, tree: ReceiptTree, title: string, sessionId: string, t: Translator): string {
  return [
    `${t('modal.title')} · ${title}`,
    t('session.id', { id: sessionId }),
    `${t(receipt.priced ? 'total.estimated' : 'total.known')}: ${money(receipt.totals.cost, receipt.currency)}`,
    `${t('stats.calls')}: ${group(receipt.totals.calls)}`,
    `${t('stats.tokens')}: ${group(tokens(receipt.totals))}`,
    `${t('stats.cacheHit')}: ${cacheRate(receipt) ?? t('notAvailable')}`,
    `${t('time.llm')}: ${duration(receipt.llmMs)}`,
    `${t(tree.children.length > 0 ? 'time.parentSpan' : 'time.span')}: ${tree.own === undefined ? t('notAvailable') : duration(receipt.spanMs)}`,
    `${t('total.own')}: ${tree.own === undefined ? t('children.pending') : money(tree.own.totals.cost, tree.own.currency)}`,
    `${t('total.children')}: ${money(tree.childCost, receipt.currency)}`,
    ...tree.children.map(child => `${'  '.repeat(child.depth)}${child.title}: ${child.receipt === undefined ? t('children.pending') : money(child.receipt.totals.cost, child.receipt.currency)}`),
    ...(tree.missing > 0 ? [t('total.missing', { count: group(tree.missing) })] : []),
    ...(tree.currencyMismatch > 0 ? [t('total.currencyMismatch', { count: group(tree.currencyMismatch) })] : []),
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

function ModelMix({ receipt, t, onShowDetails }: { receipt: ReceiptProjection; t: Translator; onShowDetails: () => void }) {
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
      <button type="button" className={css.detailLink} onClick={onShowDetails}>{t('models.showDetails')}<span aria-hidden>↗</span></button>
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
  const sessionState = useSessions((state: SessionListState) => state)
  const summary = sessionState.byId[sessionId as keyof SessionListState['byId']]
  const tree = receiptTree(sessionState, sessionId)
  const receipt = tree.combined
  const title = summary?.displayTitle || t('session.untitled')
  const [view, setView] = useState<'overview' | 'models' | 'children'>('overview')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const switcherRef = useRef<HTMLDivElement | null>(null)
  const previousViewRef = useRef(view)
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        restoreFocusRef.current = true
        onClose()
      }
    }
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (cardRef.current?.contains(target) || target.closest('[data-receipt-trigger]')) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      if (restoreFocusRef.current) previous?.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2400)
    return () => window.clearTimeout(timer)
  }, [copyState])

  useEffect(() => {
    if (previousViewRef.current === view) return
    previousViewRef.current = view
    switcherRef.current?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [view])

  async function handleCopy(): Promise<void> {
    if (receipt === undefined) return
    try {
      await navigator.clipboard.writeText(summaryText(receipt, tree, title, sessionId, t))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className={css.anchor}>
      <div id="dsh-receipt-panel" ref={cardRef} className={css.card} role="dialog" aria-labelledby="dsh-receipt-title" data-receipt-modal>
        <header className={css.header}>
          <div><div className={css.eyebrow}>{t('modal.eyebrow')}</div><h2 id="dsh-receipt-title" className={css.title}>{t('modal.title')}</h2></div>
          <div className={css.headerActions}>
            <button type="button" className={css.copyButton} data-copy-state={copyState} onClick={() => { void handleCopy() }} disabled={receipt === undefined}>{copyState === 'copied' ? `✓ ${t('copy.success')}` : t('copy.action')}</button>
            <button ref={closeRef} type="button" className={css.close} aria-label={t('modal.close')} onClick={() => { restoreFocusRef.current = true; onClose() }}><IconCloseOutlineRegular size={17} /></button>
          </div>
        </header>
        <div className={css.body}>
          {receipt === undefined ? <p className={css.empty}>{t('empty')}</p> : (
            <div className={css.dashboard} data-receipt-content>
              <div className={css.sessionMeta}><strong title={title}>{title}</strong><span>{receipt.updatedAt > 0 ? t('updatedAt', { time: new Date(receipt.updatedAt).toLocaleString() }) : t('updated.unknown')}</span></div>
              <div className={css.hero}><div className={css.heroLabel}>{t(receipt.priced ? (tree.children.length > 0 ? 'total.withChildren' : 'total.estimated') : 'total.known')}</div><div className={css.heroAmount}>{money(receipt.totals.cost, receipt.currency)}</div><p>{t('total.disclaimer')}</p></div>
              {tree.children.length > 0 ? <div className={css.costSplit}>
                <div><span>{t('total.own')}</span><strong>{tree.own === undefined ? t('children.pending') : money(tree.own.totals.cost, tree.own.currency)}</strong></div>
                <div><span>{t('total.children')}</span><strong>{money(tree.childCost, receipt.currency)}</strong></div>
              </div> : null}
              {tree.missing > 0 ? <p className={css.warning}>{t('total.missing', { count: group(tree.missing) })}</p> : null}
              {tree.currencyMismatch > 0 ? <p className={css.warning}>{t('total.currencyMismatch', { count: group(tree.currencyMismatch) })}</p> : null}
              <div className={css.stats}>
                <div><span>{t('stats.calls')}</span><strong>{group(receipt.totals.calls)}</strong></div>
                <div><span>{t('stats.tokens')}</span><strong>{group(tokens(receipt.totals))}</strong></div>
                <div><span>{t('stats.cacheHit')}</span><strong>{cacheRate(receipt) ?? t('notAvailable')}</strong></div>
                <div><span>{t('stats.avg')}</span><strong>{receipt.priced && receipt.totals.calls > 0 ? money(receipt.totals.cost / receipt.totals.calls, receipt.currency) : t('notAvailable')}</strong></div>
              </div>
              {receipt.models.length > 0 && !receipt.priced ? <p className={css.warning}>{t('totals.unpriced')}</p> : null}
              <div ref={switcherRef} className={css.switcher} aria-label={t('view.label')}>
                <button type="button" aria-pressed={view === 'overview'} onClick={() => setView('overview')}>{t('view.overview')}</button>
                <button type="button" aria-pressed={view === 'models'} onClick={() => setView('models')}>{t('view.models')}</button>
                <button type="button" aria-pressed={view === 'children'} onClick={() => setView('children')}>{t('view.children')}{tree.children.length > 0 ? ` ${tree.children.length}` : ''}</button>
              </div>
              {view === 'overview' ? (
                <div className={css.sections}>
                  <TokenMix receipt={receipt} t={t} />
                  {receipt.models.length > 0 ? <ModelMix receipt={receipt} t={t} onShowDetails={() => setView('models')} /> : null}
                  <section className={css.panel}>
                    <div className={css.sectionHead}><h3>{t('time.title')}</h3></div>
                    <div className={css.inlineMetrics}><div><span>{t('time.llm')}</span><strong>{duration(receipt.llmMs)}</strong></div><div><span>{t(tree.children.length > 0 ? 'time.parentSpan' : 'time.span')}</span><strong>{tree.own === undefined ? t('notAvailable') : duration(receipt.spanMs)}</strong></div></div>
                    {receipt.totals.peakCost > 0 ? <p className={css.subNote}>{t('totals.peakCost', { amount: money(receipt.totals.peakCost, receipt.currency) })}</p> : null}
                    <p className={css.subNote}>{t('peak.note', { window: windowsLabel(receipt.peakHours), multiplier: group(receipt.peakMultiplier) })}</p>
                  </section>
                </div>
              ) : view === 'models' ? (
                <div className={css.sections}>
                  <div className={css.sectionHead}><h3>{t('detail.title')}</h3><span>{t('models.count', { count: group(receipt.models.length) })}</span></div>
                  {receipt.models.length === 0 ? <p className={css.empty}>{t('empty')}</p> : receipt.models.map((row: ReceiptModelRow) => <ModelDetails key={`${row.provider}\u0000${row.model}`} row={row} currency={receipt.currency} t={t} />)}
                  <p className={css.sessionId}>{t('session.id', { id: sessionId })}</p>
                </div>
              ) : (
                <div className={css.sections}>
                  <div className={css.sectionHead}><h3>{t('children.title')}</h3><span>{t('children.count', { count: group(tree.children.length) })}</span></div>
                  {tree.children.length === 0 ? <p className={css.empty}>{t('children.empty')}</p> : tree.children.map(child => (
                    <details key={child.id} className={css.modelDetail}>
                      <summary>
                        <span className={css.modelDetailMain} style={{ paddingLeft: `${Math.min(child.depth - 1, 3) * 12}px` }}><strong title={child.title}>{child.title}</strong><small>{child.receipt === undefined ? t('children.pending') : `${t('row.calls', { count: group(child.receipt.totals.calls) })} · ${t('models.tokenCount', { count: group(tokens(child.receipt.totals)) })}`}</small></span>
                        <span className={css.modelDetailAmount}>{child.receipt === undefined ? t('notAvailable') : child.receipt.priced || child.receipt.models.length === 0 ? money(child.receipt.totals.cost, child.receipt.currency) : `${money(child.receipt.totals.cost, child.receipt.currency)} · ${t('partial')}`}</span>
                      </summary>
                      <div className={css.childDetails}>
                        {child.receipt === undefined ? <p className={css.subNote}>{t('children.pending')}</p> : <>
                          <div className={css.sectionHead}><h3>{t('children.models')}</h3><span>{t('models.count', { count: group(child.receipt.models.length) })}</span></div>
                          {child.receipt.models.map(row => <div className={css.childModelRow} key={`${row.provider}\u0000${row.model}`}><span>{row.model || t('unknownModel')}</span><strong>{rowCost(row, child.receipt!.currency, t)}</strong></div>)}
                          {!child.receipt.priced && child.receipt.models.length > 0 ? <p className={css.subNote}>{t('children.partial')}</p> : null}
                        </>}
                      </div>
                    </details>
                  ))}
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
