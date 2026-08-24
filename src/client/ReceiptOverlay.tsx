import { useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only：拉入 shell.overlay（root list）的 SlotMap 声明。
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { NS } from './locales.ts'
import { receiptUi } from './receipt-ui.ts'
import { ReceiptCard } from './ReceiptCard.tsx'

/** shell.overlay 条目的完整 props：root kit（useSessions）+ 本插件 locale。 */
export type ReceiptOverlayProps = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS>

/**
 * 小票弹层的 overlay 座位：订阅模块级打开状态，打开时渲染小票卡片。
 * 关闭时返回 null，不占任何布局。
 * @param props - root kit + locale seat。
 */
export function ReceiptOverlay({ useSessions, t }: ReceiptOverlayProps) {
  const ui = useSyncExternalStore(receiptUi.subscribe, receiptUi.getSnapshot)
  if (!ui.open || ui.sessionId === undefined) return null
  return (
    <ReceiptCard
      sessionId={ui.sessionId}
      useSessions={useSessions}
      onClose={receiptUi.close}
      t={t}
    />
  )
}
