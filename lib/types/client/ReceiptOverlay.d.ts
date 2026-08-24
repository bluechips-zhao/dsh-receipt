import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** shell.overlay 条目的完整 props：root kit（useSessions）+ 本插件 locale。 */
export type ReceiptOverlayProps = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS>;
/**
 * 小票弹层的 overlay 座位：订阅模块级打开状态，打开时渲染小票卡片。
 * 关闭时返回 null，不占任何布局。
 * @param props - root kit + locale seat。
 */
export declare function ReceiptOverlay({ useSessions, t }: ReceiptOverlayProps): import("react").JSX.Element | null;
//# sourceMappingURL=ReceiptOverlay.d.ts.map