import type { SessionListState, SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ReceiptModelRow, ReceiptProjection } from '../types.ts'

export interface ReceiptChild {
  id: string
  title: string
  depth: number
  receipt: ReceiptProjection | undefined
}

export interface ReceiptTree {
  own: ReceiptProjection | undefined
  combined: ReceiptProjection | undefined
  children: ReceiptChild[]
  missing: number
  currencyMismatch: number
  childCost: number
}

const countFields = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens'] as const

/** List rows contain direct parent ids, including catalog-only children. Walk once to avoid cycles and duplicate costs. */
export function receiptTree(state: SessionListState, rootId: string): ReceiptTree {
  const byParent = new Map<string, SessionSummary[]>()
  for (const row of Object.values(state.byId)) {
    if (row.origin !== 'subagent' || row.parentId === undefined) continue
    const siblings = byParent.get(row.parentId) ?? []
    siblings.push(row)
    byParent.set(row.parentId, siblings)
  }
  const children: ReceiptChild[] = []
  const seen = new Set<string>([rootId])
  const visit = (parentId: string, depth: number): void => {
    for (const row of byParent.get(parentId) ?? []) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      children.push({ id: row.id, title: row.displayTitle, depth, receipt: row.projectionValues?.receipt })
      visit(row.id, depth + 1)
    }
  }
  visit(rootId, 1)

  const own = state.byId[rootId as keyof SessionListState['byId']]?.projectionValues?.receipt
  const source = own ?? children.find(child => child.receipt !== undefined)?.receipt
  if (source === undefined) return { own, combined: undefined, children, missing: children.length, currencyMismatch: 0, childCost: 0 }

  const models = new Map<string, ReceiptModelRow>()
  const totals = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, calls: 0, cost: 0, peakCost: 0 }
  let missing = 0
  let currencyMismatch = 0
  let childCost = 0
  let llmMs = 0
  let updatedAt = 0
  let fullyPriced = true
  for (const [index, item] of [own, ...children.map(child => child.receipt)].entries()) {
    if (item === undefined) {
      if (index > 0) missing++
      continue
    }
    if (item.currency !== source.currency) {
      currencyMismatch++
      continue
    }
    for (const field of countFields) totals[field] += item.totals[field]
    totals.calls += item.totals.calls
    totals.cost += item.totals.cost
    totals.peakCost += item.totals.peakCost
    if (index > 0) childCost += item.totals.cost
    llmMs += item.llmMs
    updatedAt = Math.max(updatedAt, item.updatedAt)
    if (item.models.length > 0 && !item.priced) fullyPriced = false
    for (const row of item.models) {
      const key = `${row.provider}\u0000${row.model}`
      const previous = models.get(key)
      if (previous === undefined) { models.set(key, { ...row }); continue }
      const next = { ...previous, calls: previous.calls + row.calls, cost: previous.cost + row.cost, peakCost: previous.peakCost + row.peakCost, priced: previous.priced && row.priced }
      for (const field of countFields) next[field] = previous[field] + row[field]
      models.set(key, next)
    }
  }
  const rows = [...models.values()].sort((a, b) => b.cost - a.cost || b.calls - a.calls || a.model.localeCompare(b.model))
  const combined: ReceiptProjection = {
    models: rows, totals,
    priced: rows.length > 0 && own !== undefined && fullyPriced && missing === 0 && currencyMismatch === 0,
    llmMs,
    // Parallel child durations cannot be added into a wall-clock span.
    spanMs: own?.spanMs ?? 0,
    updatedAt, currency: source.currency,
    peakHours: source.peakHours,
    peakMultiplier: source.peakMultiplier,
  }
  return { own, combined, children, missing, currencyMismatch, childCost }
}
