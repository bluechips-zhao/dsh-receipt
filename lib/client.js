window.__ModuleLoader__.load({
	id: "dsh-receipt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		//#region lib/types/client/receipt-ui.js
		/**
		* 小票弹层的模块级打开状态：header action 写入，shell.overlay 条目订阅。
		* 两个条目来自同一个 client bundle，共享同一模块实例，因此这是合法的
		* 插件内部协调（不跨插件）。
		*/
		let current = {
			open: false,
			sessionId: void 0
		};
		const listeners = /* @__PURE__ */ new Set();
		function emit() {
			for (const listener of [...listeners]) listener();
		}
		/** HostObservable 形状的打开状态面（供 useSyncExternalStore 订阅）。 */
		const receiptUi = {
			getSnapshot: () => current,
			subscribe(listener) {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			},
			/** 切换某会话的小票（再次点击同一会话收起）。 */
			toggle(sessionId) {
				current = current.open && current.sessionId === sessionId ? {
					...current,
					open: false
				} : {
					open: true,
					sessionId
				};
				emit();
			},
			close() {
				if (!current.open) return;
				current = {
					...current,
					open: false
				};
				emit();
			}
		};
		//#endregion
		//#region \0dsh-css:src/client/ReceiptAction.module.css.mjs
		const css$1 = ".csAZWW_trigger{height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:4px;padding:0 6px;font-size:12px;display:inline-flex}.csAZWW_trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.csAZWW_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.csAZWW_label{line-height:1}";
		const tagId$1 = "dsh-receipt/ReceiptAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-receipt";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ReceiptAction_module_css_default = {
			"label": "csAZWW_label",
			"trigger": "csAZWW_trigger"
		};
		//#endregion
		//#region lib/types/client/ReceiptAction.js
		/**
		* 会话头部的小票按钮：点击切换本会话的消费小票弹层。
		* 数据经 `receipt` 投影由 host 计算，这里只负责打开入口。
		* @param props - session kit（sessionId）+ locale seat。
		*/
		function ReceiptAction({ sessionId, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ReceiptAction_module_css_default.trigger,
				"aria-label": t("action.aria"),
				title: t("action.aria"),
				onClick: () => receiptUi.toggle(sessionId),
				children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, {}), (0, react_jsx_runtime.jsx)("span", {
					className: ReceiptAction_module_css_default.label,
					children: t("action.label")
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:src/client/Receipt.module.css.mjs
		const css = ".qUWh0W_backdrop{z-index:1000;background:var(--dsw-alias-bg-mask-drop,#00000073);pointer-events:auto;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.qUWh0W_card{background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l3);border-radius:12px;flex-direction:column;width:min(92vw,400px);max-height:min(80vh,720px);display:flex;overflow:hidden;box-shadow:0 12px 40px #00000040}.qUWh0W_header{flex:none;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px 8px;display:flex}.qUWh0W_title{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600}.qUWh0W_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex}.qUWh0W_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.qUWh0W_close:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.qUWh0W_body{padding:4px 14px 14px;overflow-y:auto}.qUWh0W_receipt{border:1px dashed var(--dsw-alias-border-l3);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border-radius:4px;padding:14px 16px;font-size:13px}.qUWh0W_meta{text-align:center;margin-bottom:6px}.qUWh0W_sessionTitle{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;overflow:hidden}.qUWh0W_sessionId,.qUWh0W_printedAt{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-top:2px;font-size:12px}.qUWh0W_sep{border-top:1px dashed var(--dsw-alias-border-l3);margin:10px 0}.qUWh0W_model{margin-bottom:10px}.qUWh0W_modelHead{justify-content:space-between;align-items:baseline;gap:8px;display:flex}.qUWh0W_modelName{word-break:break-all;font-size:13px;font-weight:600}.qUWh0W_provider{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400}.qUWh0W_subtotal{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600}.qUWh0W_unpriced{color:var(--dsw-alias-state-warn-primary);white-space:nowrap;font-size:12px}.qUWh0W_modelCalls{color:var(--dsw-alias-label-secondary);margin-top:2px}.qUWh0W_modelLines{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;margin:4px 0 0;padding:0;list-style:none}.qUWh0W_modelLines li{padding:1px 0}.qUWh0W_totals{margin:0}.qUWh0W_totalRow{justify-content:space-between;padding:2px 0;display:flex}.qUWh0W_totalRow dt{color:var(--dsw-alias-label-secondary)}.qUWh0W_totalRow dd{font-variant-numeric:tabular-nums;margin:0}.qUWh0W_grandTotal{border-top:1px dashed var(--dsw-alias-border-l3);justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:10px;font-size:15px;font-weight:600;display:flex}.qUWh0W_amount{font-variant-numeric:tabular-nums;font-size:18px;font-weight:700}.qUWh0W_unpricedHint{color:var(--dsw-alias-state-warn-primary);margin-top:6px;font-size:12px}.qUWh0W_peakLine{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;margin-top:6px;font-size:12px}.qUWh0W_peakNote{color:var(--dsw-alias-label-tertiary);margin-top:4px;font-size:12px}.qUWh0W_empty{text-align:center;color:var(--dsw-alias-label-tertiary);margin:8px 0}.qUWh0W_footer{text-align:center;color:var(--dsw-alias-label-tertiary);letter-spacing:.1em;margin-top:10px;font-size:12px}";
		const tagId = "dsh-receipt/Receipt.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-receipt";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var Receipt_module_css_default = {
			"amount": "qUWh0W_amount",
			"backdrop": "qUWh0W_backdrop",
			"body": "qUWh0W_body",
			"card": "qUWh0W_card",
			"close": "qUWh0W_close",
			"empty": "qUWh0W_empty",
			"footer": "qUWh0W_footer",
			"grandTotal": "qUWh0W_grandTotal",
			"header": "qUWh0W_header",
			"meta": "qUWh0W_meta",
			"model": "qUWh0W_model",
			"modelCalls": "qUWh0W_modelCalls",
			"modelHead": "qUWh0W_modelHead",
			"modelLines": "qUWh0W_modelLines",
			"modelName": "qUWh0W_modelName",
			"peakLine": "qUWh0W_peakLine",
			"peakNote": "qUWh0W_peakNote",
			"printedAt": "qUWh0W_printedAt",
			"provider": "qUWh0W_provider",
			"receipt": "qUWh0W_receipt",
			"sep": "qUWh0W_sep",
			"sessionId": "qUWh0W_sessionId",
			"sessionTitle": "qUWh0W_sessionTitle",
			"subtotal": "qUWh0W_subtotal",
			"title": "qUWh0W_title",
			"totalRow": "qUWh0W_totalRow",
			"totals": "qUWh0W_totals",
			"unpriced": "qUWh0W_unpriced",
			"unpricedHint": "qUWh0W_unpricedHint"
		};
		//#endregion
		//#region lib/types/client/ReceiptCard.js
		/** 千分位数字。 */
		function group(n) {
			return n.toLocaleString("en-US");
		}
		/** 金额：≥1 保留 2 位，<1 保留 4 位，去掉尾零。 */
		function formatMoney(n) {
			if (n === 0) return "0";
			return n.toFixed(n >= 1 ? 2 : 4).replace(/\.?0+$/, "");
		}
		/** 时长：<60s 显示秒，之后 m/s，超过 1h 显示 h/m。 */
		function formatDuration(ms) {
			const seconds = ms / 1e3;
			if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
			const whole = Math.round(seconds);
			const hours = Math.floor(whole / 3600);
			const minutes = Math.floor(whole % 3600 / 60);
			const rest = whole % 60;
			if (hours > 0) return `${hours}h${minutes}m`;
			return `${minutes}m${rest}s`;
		}
		/** 出票时间本地化字符串。 */
		function formatDateTime(timestamp) {
			return new Date(timestamp).toLocaleString();
		}
		/** 高峰窗口文案：`9:00-12:00、14:00-18:00`。 */
		function formatPeakWindows(windows) {
			return windows.map((window) => `${window.start}:00-${window.end}:00`).join("、");
		}
		/** 按模型渲染一行明细：模型名 + 调用次数 + 各 token 分桶 + 小计。 */
		function ModelBlock({ row, currency, t }) {
			const label = row.model === "" ? t("unknownModel") : row.model;
			const provider = row.provider === "" ? void 0 : row.provider;
			const lines = [];
			if (row.inputTokens > 0) lines.push(t("row.input", { tokens: group(row.inputTokens) }));
			if (row.cacheReadTokens > 0) lines.push(t("row.cacheRead", { tokens: group(row.cacheReadTokens) }));
			if (row.cacheWriteTokens > 0) lines.push(t("row.cacheWrite", { tokens: group(row.cacheWriteTokens) }));
			if (row.outputTokens > 0) lines.push(t("row.output", { tokens: group(row.outputTokens) }));
			if (row.reasoningTokens > 0) lines.push(t("row.reasoning", { tokens: group(row.reasoningTokens) }));
			return (0, react_jsx_runtime.jsxs)("section", {
				className: Receipt_module_css_default.model,
				"data-model": row.model || "(unknown)",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: Receipt_module_css_default.modelHead,
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: Receipt_module_css_default.modelName,
							children: [label, provider === void 0 ? null : (0, react_jsx_runtime.jsxs)("span", {
								className: Receipt_module_css_default.provider,
								children: [" · ", provider]
							})]
						}), (0, react_jsx_runtime.jsx)("span", {
							className: row.priced ? Receipt_module_css_default.subtotal : Receipt_module_css_default.unpriced,
							children: row.priced ? `${currency}${formatMoney(row.cost)}` : t("unpriced")
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.modelCalls,
						children: t("row.calls", { count: group(row.calls) })
					}),
					lines.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.modelLine,
						children: t("row.subtotal", { amount: `${currency}0` })
					}) : (0, react_jsx_runtime.jsx)("ul", {
						className: Receipt_module_css_default.modelLines,
						children: lines.map((line) => (0, react_jsx_runtime.jsx)("li", { children: line }, String(line)))
					})
				]
			});
		}
		/** 小票主体内容：元信息 + 各模型明细 + 合计 + 金额。 */
		function ReceiptContent({ receipt, sessionTitle, sessionId, t }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: Receipt_module_css_default.receipt,
				"data-receipt-content": true,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: Receipt_module_css_default.meta,
						children: [
							sessionTitle === void 0 ? null : (0, react_jsx_runtime.jsx)("div", {
								className: Receipt_module_css_default.sessionTitle,
								children: sessionTitle
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: Receipt_module_css_default.sessionId,
								children: t("session.id", { id: sessionId })
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: Receipt_module_css_default.printedAt,
								children: t("printedAt", { time: formatDateTime(receipt.updatedAt) })
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.sep,
						"aria-hidden": true
					}),
					receipt.models.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: Receipt_module_css_default.empty,
						children: t("empty")
					}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						receipt.models.map((row) => (0, react_jsx_runtime.jsx)(ModelBlock, {
							row,
							currency: receipt.currency,
							t
						}, `${row.provider}\u0000${row.model}`)),
						(0, react_jsx_runtime.jsx)("div", {
							className: Receipt_module_css_default.sep,
							"aria-hidden": true
						}),
						(0, react_jsx_runtime.jsxs)("dl", {
							className: Receipt_module_css_default.totals,
							children: [
								(0, react_jsx_runtime.jsxs)("div", {
									className: Receipt_module_css_default.totalRow,
									children: [(0, react_jsx_runtime.jsx)("dt", { children: t("totals.calls") }), (0, react_jsx_runtime.jsx)("dd", { children: group(receipt.totals.calls) })]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: Receipt_module_css_default.totalRow,
									children: [(0, react_jsx_runtime.jsx)("dt", { children: t("totals.tokens") }), (0, react_jsx_runtime.jsx)("dd", { children: group(receipt.totals.inputTokens + receipt.totals.outputTokens + receipt.totals.cacheReadTokens + receipt.totals.cacheWriteTokens + receipt.totals.reasoningTokens) })]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: Receipt_module_css_default.totalRow,
									children: [(0, react_jsx_runtime.jsx)("dt", { children: t("time.llm") }), (0, react_jsx_runtime.jsx)("dd", { children: formatDuration(receipt.llmMs) })]
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: Receipt_module_css_default.totalRow,
									children: [(0, react_jsx_runtime.jsx)("dt", { children: t("time.span") }), (0, react_jsx_runtime.jsx)("dd", { children: formatDuration(receipt.spanMs) })]
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: Receipt_module_css_default.grandTotal,
							children: [(0, react_jsx_runtime.jsx)("span", { children: t("totals.label") }), (0, react_jsx_runtime.jsxs)("span", {
								className: Receipt_module_css_default.amount,
								children: [receipt.currency, formatMoney(receipt.totals.cost)]
							})]
						}),
						receipt.totals.peakCost > 0 ? (0, react_jsx_runtime.jsx)("div", {
							className: Receipt_module_css_default.peakLine,
							children: t("totals.peakCost", { amount: `${receipt.currency}${formatMoney(receipt.totals.peakCost)}` })
						}) : null,
						receipt.priced ? null : (0, react_jsx_runtime.jsx)("div", {
							className: Receipt_module_css_default.unpricedHint,
							children: t("totals.unpriced")
						}),
						receipt.totals.peakCost > 0 ? (0, react_jsx_runtime.jsx)("div", {
							className: Receipt_module_css_default.peakNote,
							children: t("peak.note", {
								window: formatPeakWindows(receipt.peakHours),
								multiplier: group(receipt.peakMultiplier)
							})
						}) : null
					] }),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.footer,
						"aria-hidden": true,
						children: t("footer")
					})
				]
			});
		}
		/**
		* 小票弹层：全屏遮罩 + 居中"收据"卡片。数据来自 useSessions 行上的
		* `projectionValues.receipt`（host 投影值随 session/projection 帧实时刷新）。
		* 支持 Escape 关闭、点击遮罩关闭、焦点落入关闭按钮、卸载归还焦点。
		*/
		function ReceiptCard({ sessionId, useSessions, onClose, t }) {
			const summary = useSessions((state) => state.byId[sessionId]);
			const receipt = summary?.projectionValues?.receipt;
			const closeRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				closeRef.current?.focus();
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					onClose();
				};
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("keydown", onKeyDown);
					previous?.focus();
				};
			}, [onClose]);
			return (0, react_jsx_runtime.jsx)("div", {
				className: Receipt_module_css_default.backdrop,
				onPointerDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: Receipt_module_css_default.card,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": t("modal.title"),
					"data-receipt-modal": true,
					children: [(0, react_jsx_runtime.jsxs)("header", {
						className: Receipt_module_css_default.header,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							className: Receipt_module_css_default.title,
							children: t("modal.title")
						}), (0, react_jsx_runtime.jsx)("button", {
							ref: closeRef,
							type: "button",
							className: Receipt_module_css_default.close,
							"aria-label": t("modal.close"),
							onClick: onClose,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
						})]
					}), (0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.body,
						children: receipt === void 0 ? (0, react_jsx_runtime.jsx)("p", {
							className: Receipt_module_css_default.empty,
							children: t("empty")
						}) : (0, react_jsx_runtime.jsx)(ReceiptContent, {
							receipt,
							sessionTitle: summary?.displayTitle,
							sessionId,
							t
						})
					})]
				})
			});
		}
		//#endregion
		//#region lib/types/client/ReceiptOverlay.js
		/**
		* 小票弹层的 overlay 座位：订阅模块级打开状态，打开时渲染小票卡片。
		* 关闭时返回 null，不占任何布局。
		* @param props - root kit + locale seat。
		*/
		function ReceiptOverlay({ useSessions, t }) {
			const ui = (0, react.useSyncExternalStore)(receiptUi.subscribe, receiptUi.getSnapshot);
			if (!ui.open || ui.sessionId === void 0) return null;
			return (0, react_jsx_runtime.jsx)(ReceiptCard, {
				sessionId: ui.sessionId,
				useSessions,
				onClose: receiptUi.close,
				t
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `receipt` 命名空间字典。 */
		/** 字典命名空间（本插件拥有）。 */
		const NS = "receipt";
		/** 简体中文字典（key 集权威来源）。 */
		const zh = {
			"action.label": "小票",
			"action.aria": "查看本会话消费小票",
			"modal.title": "会话消费小票",
			"modal.close": "关闭",
			"empty": "本会话暂无用量数据",
			"printedAt": "出票时间 {time}",
			"session.id": "会话 ID {id}",
			"unknownModel": "未知模型",
			"unpriced": "未计价",
			"row.calls": "调用 {count} 次",
			"row.input": "输入 {tokens}",
			"row.output": "输出 {tokens}",
			"row.cacheRead": "缓存读 {tokens}",
			"row.cacheWrite": "缓存写 {tokens}",
			"row.reasoning": "推理 {tokens}",
			"row.subtotal": "小计 {amount}",
			"totals.calls": "调用次数",
			"totals.tokens": "token 合计",
			"time.llm": "模型耗时",
			"time.span": "会话跨度",
			"totals.label": "合计金额",
			"totals.peakCost": "其中工作日高峰时段费用 {amount}",
			"peak.note": "工作日高峰时段（北京时间 {window}）单价 ×{multiplier}",
			"totals.unpriced": "包含未计价模型，合计费用仅供参考",
			"footer": "—— 谢谢惠顾 ——"
		};
		/** 英文词典，与中文权威 key 一致。 */
		const en = {
			"action.label": "Receipt",
			"action.aria": "Show this conversation usage receipt",
			"modal.title": "Usage Receipt",
			"modal.close": "Close",
			"empty": "No usage data for this conversation yet",
			"printedAt": "Printed at {time}",
			"session.id": "Session {id}",
			"unknownModel": "Unknown model",
			"unpriced": "Unpriced",
			"row.calls": "{count} calls",
			"row.input": "Input {tokens}",
			"row.output": "Output {tokens}",
			"row.cacheRead": "Cache read {tokens}",
			"row.cacheWrite": "Cache write {tokens}",
			"row.reasoning": "Reasoning {tokens}",
			"row.subtotal": "Subtotal {amount}",
			"totals.calls": "Calls",
			"totals.tokens": "Total tokens",
			"time.llm": "Model time",
			"time.span": "Session span",
			"totals.label": "Total",
			"totals.peakCost": "Peak-hour portion {amount}",
			"peak.note": "Weekday peak hours (Beijing {window}) ×{multiplier}",
			"totals.unpriced": "Includes unpriced models; total is indicative only",
			"footer": "—— Thank you ——"
		};
		//#endregion
		//#region lib/types/client/index.js
		/**
		* 小票插件 browser 半：注册会话 header 的小票按钮与 shell.overlay 弹层。
		* 数据完全来自 host 的 `receipt` 投影（session/projection 帧 / list 行），
		* 本半不发起任何 RPC、不持有会话数据，只协调弹层打开状态。
		*
		* @module dsh-receipt/client
		*/
		/** 必需服务：字典注册 + 两个 slot 座位。 */
		const inject = [
			"sessions",
			"slots",
			"locale"
		];
		/**
		* 客户端插件体：注册字典、header action 与 overlay 条目。
		* @param ctx - 客户端根上下文。
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-receipt: dictionaries");
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "receipt",
				order: 40,
				locale: NS
			}, ReceiptAction));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "receipt",
				locale: NS
			}, ReceiptOverlay));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map