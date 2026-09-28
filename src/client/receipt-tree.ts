import type { SessionListState, SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ReceiptModelRow, ReceiptProjection } from '../types.ts'

export interface ReceiptChild {
  id: string
  parentId: string
  title: string
  depth: number
  receipt: ReceiptProjection | undefined
  directChildren: number
  descendants: number
  branchCost: number
  branchMissing: number
  branchCurrencyMismatch: number
  branchPriced: boolean
}

export interface ReceiptTree {
  rootId: string
  own: ReceiptProjection | undefined
  combined: ReceiptProjection | undefined
  children: ReceiptChild[]
  childrenByParent: Map<string, ReceiptChild[]>
  missing: number
  currencyMismatch: number
  childCost: number
}

export const CHILD_PAGE_SIZE = 20

export type ReceiptVisibleRow =
  | { kind: 'child'; child: ReceiptChild }
  | { kind: 'more'; parentId: string; depth: number; remaining: number }

/** Render only open branches and a bounded page of siblings; search reveals matching paths. */
export function visibleReceiptRows(
  tree: ReceiptTree,
  expanded: ReadonlySet<string>,
  limits: Readonly<Record<string, number>>,
  query: string,
): ReceiptVisibleRow[] {
  const needle = query.trim().toLocaleLowerCase()
  const allowed = new Set<string>()
  if (needle !== '') {
    for (let index = tree.children.length - 1; index >= 0; index--) {
      const child = tree.children[index]!
      if (!child.title.toLocaleLowerCase().includes(needle) && !child.id.toLocaleLowerCase().includes(needle) && !allowed.has(child.id)) continue
      allowed.add(child.id)
      if (child.parentId !== tree.rootId) allowed.add(child.parentId)
    }
  }
  const result: ReceiptVisibleRow[] = []
  const tasks: ReceiptVisibleRow[] = []
  const pushSiblings = (parentId: string, depth: number): void => {
    const siblings = tree.childrenByParent.get(parentId) ?? []
    const matching = needle === '' ? siblings : siblings.filter(child => allowed.has(child.id))
    const limit = limits[parentId] ?? CHILD_PAGE_SIZE
    if (matching.length > limit) tasks.push({ kind: 'more', parentId, depth, remaining: matching.length - limit })
    for (let index = Math.min(matching.length, limit) - 1; index >= 0; index--) tasks.push({ kind: 'child', child: matching[index]! })
  }
  pushSiblings(tree.rootId, 1)
  while (tasks.length > 0) {
    const row = tasks.pop()!
    result.push(row)
    if (row.kind === 'child' && row.child.directChildren > 0 && (needle !== '' || expanded.has(row.child.id))) {
      pushSiblings(row.child.id, row.child.depth + 1)
    }
  }
  return result
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
  const childrenByParent = new Map<string, ReceiptChild[]>()
  const seen = new Set<string>([rootId])
  const stack: { row: SessionSummary; parentId: string; depth: number }[] = []
  const roots = byParent.get(rootId) ?? []
  for (let index = roots.length - 1; index >= 0; index--) stack.push({ row: roots[index]!, parentId: rootId, depth: 1 })
  while (stack.length > 0) {
    const { row, parentId, depth } = stack.pop()!
    if (seen.has(row.id)) continue
    seen.add(row.id)
    const child: ReceiptChild = {
      id: row.id, parentId, title: row.displayTitle, depth, receipt: row.projectionValues?.receipt,
      directChildren: 0, descendants: 0, branchCost: 0, branchMissing: 0,
      branchCurrencyMismatch: 0, branchPriced: true,
    }
    children.push(child)
    const list = childrenByParent.get(parentId) ?? []
    list.push(child)
    childrenByParent.set(parentId, list)
    const nested = byParent.get(row.id) ?? []
    for (let index = nested.length - 1; index >= 0; index--) stack.push({ row: nested[index]!, parentId: row.id, depth: depth + 1 })
  }

  // Hierarchy remains usable while projections are still loading.
  for (let index = children.length - 1; index >= 0; index--) {
    const child = children[index]!
    const direct = childrenByParent.get(child.id) ?? []
    child.directChildren = direct.length
    child.descendants = direct.reduce((sum, item) => sum + 1 + item.descendants, 0)
  }

  const own = state.byId[rootId as keyof SessionListState['byId']]?.projectionValues?.receipt
  const source = own ?? children.find(child => child.receipt !== undefined)?.receipt
  if (source === undefined) return { rootId, own, combined: undefined, children, childrenByParent, missing: children.length, currencyMismatch: 0, childCost: 0 }

  // Bottom-up subtree totals keep a parent's own cost distinct from all delegated descendants.
  for (let index = children.length - 1; index >= 0; index--) {
    const child = children[index]!
    const direct = childrenByParent.get(child.id) ?? []
    child.branchMissing = (child.receipt === undefined ? 1 : 0) + direct.reduce((sum, item) => sum + item.branchMissing, 0)
    child.branchCurrencyMismatch = (child.receipt !== undefined && child.receipt.currency !== source.currency ? 1 : 0)
      + direct.reduce((sum, item) => sum + item.branchCurrencyMismatch, 0)
    child.branchCost = (child.receipt?.currency === source.currency ? child.receipt.totals.cost : 0)
      + direct.reduce((sum, item) => sum + item.branchCost, 0)
    child.branchPriced = child.receipt !== undefined
      && child.receipt.currency === source.currency
      && (child.receipt.models.length === 0 || child.receipt.priced)
      && direct.every(item => item.branchPriced)
  }

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
  return { rootId, own, combined, children, childrenByParent, missing, currencyMismatch, childCost }
}
