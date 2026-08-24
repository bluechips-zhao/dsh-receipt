import type { ReactElement } from 'react';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** 会话 header action 的完整 props：标准 session kit + 本插件 locale。 */
export type ReceiptActionProps = PropsRuntime<'conversation.session.header.actions'> & PropsLocale<typeof NS>;
/**
 * 会话头部的小票按钮：点击切换本会话的消费小票弹层。
 * 数据经 `receipt` 投影由 host 计算，这里只负责打开入口。
 * @param props - session kit（sessionId）+ locale seat。
 */
export declare function ReceiptAction({ sessionId, t }: ReceiptActionProps): ReactElement;
//# sourceMappingURL=ReceiptAction.d.ts.map