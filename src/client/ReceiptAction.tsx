import type { ReactElement } from 'react'
import { IconDataOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only：拉入 conversation 会话 slot 的 SlotMap 合并（header.actions 契约）。
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { NS } from './locales.ts'
import { receiptUi } from './receipt-ui.ts'
import css from './ReceiptAction.module.css'

/** 会话 header action 的完整 props：标准 session kit + 本插件 locale。 */
export type ReceiptActionProps = PropsRuntime<'conversation.session.header.actions'> & PropsLocale<typeof NS>

/**
 * 会话头部的小票按钮：点击切换本会话的消费小票弹层。
 * 数据经 `receipt` 投影由 host 计算，这里只负责打开入口。
 * @param props - session kit（sessionId）+ locale seat。
 */
export function ReceiptAction({ sessionId, t }: ReceiptActionProps): ReactElement {
  return (
    <button
      type="button"
      className={css.trigger}
      aria-label={t('action.aria')}
      title={t('action.aria')}
      onClick={() => receiptUi.toggle(sessionId)}
    >
      <IconDataOutline16 />
      <span className={css.label}>{t('action.label')}</span>
    </button>
  )
}
