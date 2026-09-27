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
		const css$1 = "._4QToUa_trigger{height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:4px;padding:0 6px;font-size:12px;display:inline-flex}._4QToUa_trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._4QToUa_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}._4QToUa_label{line-height:1}";
		const tagId$1 = "dsh-receipt/ReceiptAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-receipt";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ReceiptAction_module_css_default = {
			"label": "_4QToUa_label",
			"trigger": "_4QToUa_trigger"
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
				children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutlineRegular, { size: 16 }), (0, react_jsx_runtime.jsx)("span", {
					className: ReceiptAction_module_css_default.label,
					children: t("action.label")
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:src/client/Receipt.module.css.mjs
		const css = ".HZ5y5q_backdrop{--receipt-accent:var(--dsw-alias-state-business-primary,#6b8ef5);z-index:1000;background:var(--dsw-alias-bg-mask-drop,#0000008c);backdrop-filter:blur(8px);place-items:center;padding:20px;animation:.2s ease-out both HZ5y5q_fadeIn;display:grid;position:fixed;inset:0}.HZ5y5q_card{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3);width:min(94vw,720px);max-height:min(90vh,880px);color:var(--dsw-alias-label-primary);border-radius:22px;flex-direction:column;animation:.28s cubic-bezier(.16,1,.3,1) both HZ5y5q_riseIn;display:flex;position:relative;overflow:hidden;box-shadow:0 28px 90px #00000047}.HZ5y5q_header{border-bottom:1px solid var(--dsw-alias-border-l3);flex:none;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px 16px;display:flex}.HZ5y5q_eyebrow{color:var(--receipt-accent);letter-spacing:.16em;font-size:10px;font-weight:750}.HZ5y5q_title{letter-spacing:-.025em;margin:3px 0 0;font-size:20px;font-weight:700}.HZ5y5q_headerActions{align-items:center;gap:8px;display:flex}.HZ5y5q_copyButton,.HZ5y5q_close{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);min-height:36px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:10px;justify-content:center;align-items:center;transition:transform .18s cubic-bezier(.16,1,.3,1),background-color .18s,border-color .18s;display:inline-flex}.HZ5y5q_copyButton{padding:0 12px;font-size:12px;font-weight:600}.HZ5y5q_close{width:36px;padding:0}.HZ5y5q_copyButton:hover,.HZ5y5q_close:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--receipt-accent);transform:translateY(-1px)}.HZ5y5q_copyButton:active,.HZ5y5q_close:active{transform:scale(.96)}.HZ5y5q_copyButton:disabled{opacity:.5;cursor:not-allowed;transform:none}.HZ5y5q_copyButton:focus-visible,.HZ5y5q_close:focus-visible,.HZ5y5q_switcher button:focus-visible,.HZ5y5q_metricSwitcher button:focus-visible,.HZ5y5q_modelDetail summary:focus-visible{outline:2px solid var(--receipt-accent);outline-offset:2px}.HZ5y5q_body{overscroll-behavior:contain;overflow:auto}.HZ5y5q_empty{text-align:center;color:var(--dsw-alias-label-secondary);margin:40px 24px}.HZ5y5q_dashboard{padding:20px 24px 22px}.HZ5y5q_sessionMeta{justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:14px;display:flex}.HZ5y5q_sessionMeta strong{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px;overflow:hidden}.HZ5y5q_sessionMeta span{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none;font-size:11px}.HZ5y5q_hero{border:1px solid color-mix(in srgb, var(--receipt-accent) 27%, var(--dsw-alias-border-l3));background:linear-gradient(135deg, color-mix(in srgb, var(--receipt-accent) 14%, var(--dsw-alias-bg-layer-2)), var(--dsw-alias-bg-layer-2) 70%);border-radius:18px;padding:23px 24px}.HZ5y5q_heroLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}.HZ5y5q_heroAmount{letter-spacing:-.045em;font-variant-numeric:tabular-nums;margin:5px 0 7px;font-size:clamp(30px,5vw,42px);font-weight:730;line-height:1.1}.HZ5y5q_hero p{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11px;line-height:1.5}.HZ5y5q_stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0 16px;display:grid}.HZ5y5q_stats>div{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);border-radius:13px;min-width:0;padding:13px 14px}.HZ5y5q_stats span,.HZ5y5q_inlineMetrics span{color:var(--dsw-alias-label-secondary);font-size:11px;display:block}.HZ5y5q_stats strong{text-overflow:ellipsis;font-variant-numeric:tabular-nums;margin-top:5px;font-size:17px;font-weight:680;display:block;overflow:hidden}.HZ5y5q_warning{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);color:var(--dsw-alias-state-warn-primary);border-radius:10px;margin:0 0 14px;padding:10px 12px;font-size:12px;line-height:1.5}.HZ5y5q_switcher{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l3);border-radius:11px;gap:3px;padding:4px;display:inline-flex}.HZ5y5q_switcher button{min-height:31px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;padding:0 15px;font-size:12px;font-weight:620;transition:background-color .18s,color .18s,transform .18s}.HZ5y5q_switcher button:hover{color:var(--dsw-alias-label-primary)}.HZ5y5q_switcher button:active{transform:scale(.97)}.HZ5y5q_switcher button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-4);color:var(--dsw-alias-label-primary);box-shadow:0 1px 5px #0000001a}.HZ5y5q_sections{gap:12px;margin-top:14px;animation:.24s cubic-bezier(.16,1,.3,1) both HZ5y5q_sectionIn;display:grid}.HZ5y5q_panel{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);border-radius:15px;padding:17px 18px}.HZ5y5q_sectionHead{justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:14px;display:flex}.HZ5y5q_sectionHead h3{margin:0;font-size:13px;font-weight:700}.HZ5y5q_sectionHead>span{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px}.HZ5y5q_metricSwitcher{background:var(--dsw-alias-bg-layer-3);border-radius:9px;gap:3px;margin:-3px 0 14px;padding:3px;display:inline-flex}.HZ5y5q_metricSwitcher button{min-height:27px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:7px;padding:0 11px;font-size:11px;transition:background-color .18s,color .18s}.HZ5y5q_metricSwitcher button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-4);color:var(--dsw-alias-label-primary);box-shadow:0 1px 4px #0000001a}.HZ5y5q_tokenBar{background:var(--dsw-alias-border-l3);border-radius:99px;height:9px;display:flex;overflow:hidden}.HZ5y5q_tokenPart{min-width:1px;transition:width .3s cubic-bezier(.16,1,.3,1);display:block}.HZ5y5q_input{background:#7194ee}.HZ5y5q_cacheRead{background:#61c5ae}.HZ5y5q_cacheWrite{background:#e7b869}.HZ5y5q_output{background:#aa8fdb}.HZ5y5q_legend{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-top:15px;display:grid}.HZ5y5q_legendItem{min-width:0;color:var(--dsw-alias-label-secondary);grid-template-columns:8px 1fr auto;align-items:center;gap:7px;font-size:11px;display:grid}.HZ5y5q_legendDot{border-radius:50%;width:7px;height:7px}.HZ5y5q_legendItem strong{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:11px;font-weight:600}.HZ5y5q_subNote{color:var(--dsw-alias-label-tertiary);margin:11px 0 0;font-size:11px;line-height:1.5}.HZ5y5q_mixList{gap:14px;display:grid}.HZ5y5q_mixRow{min-width:0}.HZ5y5q_mixHead,.HZ5y5q_mixMeta{justify-content:space-between;gap:10px;display:flex}.HZ5y5q_mixHead{font-size:12px}.HZ5y5q_mixHead strong{text-overflow:ellipsis;white-space:nowrap;font-weight:650;overflow:hidden}.HZ5y5q_mixHead span{font-variant-numeric:tabular-nums;flex:none}.HZ5y5q_mixTrack{background:var(--dsw-alias-border-l3);border-radius:99px;height:6px;margin:7px 0 5px;overflow:hidden}.HZ5y5q_mixTrack span{border-radius:inherit;background:var(--receipt-accent);height:100%;transition:width .3s cubic-bezier(.16,1,.3,1);display:block}.HZ5y5q_mixMeta{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:10px}.HZ5y5q_mixMeta>span:last-child{text-align:right}.HZ5y5q_inlineMetrics{grid-template-columns:1fr 1fr;gap:12px;display:grid}.HZ5y5q_inlineMetrics>div{background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:11px 12px}.HZ5y5q_inlineMetrics strong{font-variant-numeric:tabular-nums;margin-top:4px;font-size:14px;display:block}.HZ5y5q_modelDetail{border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);border-radius:13px;overflow:hidden}.HZ5y5q_modelDetail summary{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;padding:15px 17px;list-style:none;transition:background-color .18s;display:flex}.HZ5y5q_modelDetail summary::-webkit-details-marker{display:none}.HZ5y5q_modelDetail summary:hover{background:var(--dsw-alias-interactive-bg-hover)}.HZ5y5q_modelDetail[open] summary{border-bottom:1px solid var(--dsw-alias-border-l3)}.HZ5y5q_modelDetailMain{gap:4px;min-width:0;display:grid}.HZ5y5q_modelDetailMain strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;overflow:hidden}.HZ5y5q_modelDetailMain small{color:var(--dsw-alias-label-tertiary);font-size:11px}.HZ5y5q_modelDetailAmount{font-variant-numeric:tabular-nums;flex:none;font-size:12px;font-weight:650}.HZ5y5q_breakdown{gap:7px;margin:0;padding:14px 17px 4px;display:grid}.HZ5y5q_breakdown>div{justify-content:space-between;gap:12px;font-size:11px;display:flex}.HZ5y5q_breakdown dt{color:var(--dsw-alias-label-secondary)}.HZ5y5q_breakdown dd{font-variant-numeric:tabular-nums;margin:0}.HZ5y5q_breakdownTotal{border-top:1px solid var(--dsw-alias-border-l3);padding-top:8px;font-weight:650}.HZ5y5q_modelDetail .HZ5y5q_subNote,.HZ5y5q_modelDetail .HZ5y5q_warning{margin:10px 17px 14px}.HZ5y5q_sessionId{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;margin:3px 0 0;font-size:10px}.HZ5y5q_footer{text-align:center;color:var(--dsw-alias-label-tertiary);letter-spacing:.12em;margin-top:22px;font-size:10px}.HZ5y5q_copyStatus:not(:empty){border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-4);max-width:min(80%,320px);color:var(--dsw-alias-label-primary);border-radius:9px;padding:8px 12px;font-size:11px;position:absolute;bottom:18px;right:24px;box-shadow:0 7px 25px #00000029}@keyframes HZ5y5q_fadeIn{0%{opacity:0}to{opacity:1}}@keyframes HZ5y5q_riseIn{0%{opacity:0;transform:translateY(10px)scale(.985)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes HZ5y5q_sectionIn{0%{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media (width<=580px){.HZ5y5q_backdrop{align-items:end;padding:8px}.HZ5y5q_card{border-radius:20px 20px 12px 12px;width:100%;max-height:94vh}.HZ5y5q_header{padding:16px 17px 13px}.HZ5y5q_dashboard{padding:16px 17px 20px}.HZ5y5q_sessionMeta{gap:3px;display:grid}.HZ5y5q_hero{padding:18px}.HZ5y5q_stats{grid-template-columns:repeat(2,minmax(0,1fr))}.HZ5y5q_copyStatus:not(:empty){right:17px}}@media (prefers-reduced-motion:reduce){.HZ5y5q_backdrop,.HZ5y5q_card,.HZ5y5q_sections{animation:none}.HZ5y5q_copyButton,.HZ5y5q_close,.HZ5y5q_switcher button,.HZ5y5q_metricSwitcher button,.HZ5y5q_tokenPart,.HZ5y5q_mixTrack span,.HZ5y5q_modelDetail summary{transition:none}}";
		const tagId = "dsh-receipt/Receipt.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-receipt";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var Receipt_module_css_default = {
			"backdrop": "HZ5y5q_backdrop",
			"body": "HZ5y5q_body",
			"breakdown": "HZ5y5q_breakdown",
			"breakdownTotal": "HZ5y5q_breakdownTotal",
			"cacheRead": "HZ5y5q_cacheRead",
			"cacheWrite": "HZ5y5q_cacheWrite",
			"card": "HZ5y5q_card",
			"close": "HZ5y5q_close",
			"copyButton": "HZ5y5q_copyButton",
			"copyStatus": "HZ5y5q_copyStatus",
			"dashboard": "HZ5y5q_dashboard",
			"empty": "HZ5y5q_empty",
			"eyebrow": "HZ5y5q_eyebrow",
			"fadeIn": "HZ5y5q_fadeIn",
			"footer": "HZ5y5q_footer",
			"header": "HZ5y5q_header",
			"headerActions": "HZ5y5q_headerActions",
			"hero": "HZ5y5q_hero",
			"heroAmount": "HZ5y5q_heroAmount",
			"heroLabel": "HZ5y5q_heroLabel",
			"inlineMetrics": "HZ5y5q_inlineMetrics",
			"input": "HZ5y5q_input",
			"legend": "HZ5y5q_legend",
			"legendDot": "HZ5y5q_legendDot",
			"legendItem": "HZ5y5q_legendItem",
			"metricSwitcher": "HZ5y5q_metricSwitcher",
			"mixHead": "HZ5y5q_mixHead",
			"mixList": "HZ5y5q_mixList",
			"mixMeta": "HZ5y5q_mixMeta",
			"mixRow": "HZ5y5q_mixRow",
			"mixTrack": "HZ5y5q_mixTrack",
			"modelDetail": "HZ5y5q_modelDetail",
			"modelDetailAmount": "HZ5y5q_modelDetailAmount",
			"modelDetailMain": "HZ5y5q_modelDetailMain",
			"output": "HZ5y5q_output",
			"panel": "HZ5y5q_panel",
			"riseIn": "HZ5y5q_riseIn",
			"sectionHead": "HZ5y5q_sectionHead",
			"sectionIn": "HZ5y5q_sectionIn",
			"sections": "HZ5y5q_sections",
			"sessionId": "HZ5y5q_sessionId",
			"sessionMeta": "HZ5y5q_sessionMeta",
			"stats": "HZ5y5q_stats",
			"subNote": "HZ5y5q_subNote",
			"switcher": "HZ5y5q_switcher",
			"title": "HZ5y5q_title",
			"tokenBar": "HZ5y5q_tokenBar",
			"tokenPart": "HZ5y5q_tokenPart",
			"warning": "HZ5y5q_warning"
		};
		//#endregion
		//#region lib/types/client/ReceiptCard.js
		function group(value) {
			return value.toLocaleString("en-US");
		}
		function money(value, currency) {
			if (value > 0 && value < 1e-6) return `<${currency}0.000001`;
			const digits = value >= 1 ? 2 : value >= .01 ? 4 : 6;
			return `${currency}${value.toFixed(digits).replace(/\.?0+$/, "") || "0"}`;
		}
		function duration(ms) {
			const seconds = ms / 1e3;
			if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
			const whole = Math.round(seconds);
			const hours = Math.floor(whole / 3600);
			const minutes = Math.floor(whole % 3600 / 60);
			return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${whole % 60}s`;
		}
		function windowsLabel(windows) {
			return windows.map((window) => `${window.start}:00–${window.end}:00`).join(" · ");
		}
		function tokens(row) {
			return row.inputTokens + row.cacheReadTokens + row.cacheWriteTokens + row.outputTokens;
		}
		function cacheRate(receipt) {
			const input = receipt.totals.inputTokens + receipt.totals.cacheReadTokens;
			return input > 0 ? `${(receipt.totals.cacheReadTokens / input * 100).toFixed(1)}%` : void 0;
		}
		function rowCost(row, currency, t) {
			if (row.priced) return money(row.cost, currency);
			return row.cost > 0 ? `${money(row.cost, currency)} · ${t("partial")}` : t("unpriced");
		}
		function summaryText(receipt, title, sessionId, t) {
			return [
				`${t("modal.title")} · ${title}`,
				t("session.id", { id: sessionId }),
				`${t(receipt.priced ? "total.estimated" : "total.known")}: ${money(receipt.totals.cost, receipt.currency)}`,
				`${t("stats.calls")}: ${group(receipt.totals.calls)}`,
				`${t("stats.tokens")}: ${group(tokens(receipt.totals))}`,
				`${t("stats.cacheHit")}: ${cacheRate(receipt) ?? t("notAvailable")}`,
				`${t("time.llm")}: ${duration(receipt.llmMs)}`,
				`${t("time.span")}: ${duration(receipt.spanMs)}`,
				"",
				...receipt.models.map((row) => `${row.model || t("unknownModel")} · ${rowCost(row, receipt.currency, t)} · ${t("row.calls", { count: group(row.calls) })}`),
				"",
				t("total.disclaimer")
			].join("\n");
		}
		function TokenMix({ receipt, t }) {
			const parts = [
				{
					key: "input",
					name: t("detail.input"),
					value: receipt.totals.inputTokens
				},
				{
					key: "cacheRead",
					name: t("detail.cacheRead"),
					value: receipt.totals.cacheReadTokens
				},
				{
					key: "cacheWrite",
					name: t("detail.cacheWrite"),
					value: receipt.totals.cacheWriteTokens
				},
				{
					key: "output",
					name: t("detail.output"),
					value: receipt.totals.outputTokens
				}
			];
			const sum = tokens(receipt.totals);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: Receipt_module_css_default.panel,
				"aria-label": t("mix.title"),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: Receipt_module_css_default.sectionHead,
						children: [(0, react_jsx_runtime.jsx)("h3", { children: t("mix.title") }), (0, react_jsx_runtime.jsxs)("span", { children: [group(sum), " tokens"] })]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.tokenBar,
						role: "img",
						"aria-label": parts.map((part) => `${part.name} ${group(part.value)}`).join(" · "),
						children: sum > 0 && parts.map((part) => part.value > 0 ? (0, react_jsx_runtime.jsx)("span", {
							className: `${Receipt_module_css_default.tokenPart} ${Receipt_module_css_default[part.key]}`,
							style: { width: `${part.value / sum * 100}%` }
						}, part.key) : null)
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.legend,
						children: parts.map((part) => (0, react_jsx_runtime.jsxs)("div", {
							className: Receipt_module_css_default.legendItem,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: `${Receipt_module_css_default.legendDot} ${Receipt_module_css_default[part.key]}`,
									"aria-hidden": true
								}),
								(0, react_jsx_runtime.jsx)("span", { children: part.name }),
								(0, react_jsx_runtime.jsx)("strong", { children: group(part.value) })
							]
						}, part.key))
					}),
					receipt.totals.reasoningTokens > 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: Receipt_module_css_default.subNote,
						children: t("mix.reasoning", { tokens: group(receipt.totals.reasoningTokens) })
					}) : null
				]
			});
		}
		function ModelMix({ receipt, t }) {
			const [metric, setMetric] = (0, react.useState)("cost");
			const top = [...receipt.models].sort((a, b) => metric === "cost" ? b.cost - a.cost || b.calls - a.calls : tokens(b) - tokens(a) || b.calls - a.calls).slice(0, 5);
			const total = metric === "cost" ? receipt.totals.cost : tokens(receipt.totals);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: Receipt_module_css_default.panel,
				"aria-label": t("models.title"),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: Receipt_module_css_default.sectionHead,
						children: [(0, react_jsx_runtime.jsx)("h3", { children: t("models.title") }), (0, react_jsx_runtime.jsx)("span", { children: t("models.count", { count: group(receipt.models.length) }) })]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: Receipt_module_css_default.metricSwitcher,
						"aria-label": t("models.metric"),
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": metric === "cost",
							onClick: () => setMetric("cost"),
							children: t("models.metric.cost")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": metric === "tokens",
							onClick: () => setMetric("tokens"),
							children: t("models.metric.tokens")
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Receipt_module_css_default.mixList,
						children: top.map((row) => {
							const value = metric === "cost" ? row.cost : tokens(row);
							const share = total > 0 ? value / total * 100 : 0;
							return (0, react_jsx_runtime.jsxs)("div", {
								className: Receipt_module_css_default.mixRow,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.mixHead,
										children: [(0, react_jsx_runtime.jsx)("strong", { children: row.model || t("unknownModel") }), (0, react_jsx_runtime.jsx)("span", { children: metric === "cost" ? rowCost(row, receipt.currency, t) : t("models.tokenCount", { count: group(value) }) })]
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: Receipt_module_css_default.mixTrack,
										"aria-hidden": true,
										children: (0, react_jsx_runtime.jsx)("span", { style: { width: `${share}%` } })
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.mixMeta,
										children: [(0, react_jsx_runtime.jsx)("span", { children: row.provider || t("unknownProvider") }), (0, react_jsx_runtime.jsxs)("span", { children: [
											metric === "cost" ? t("models.tokenCount", { count: group(tokens(row)) }) : rowCost(row, receipt.currency, t),
											" · ",
											share > 0 ? `${share.toFixed(1)}%` : t("notAvailable")
										] })]
									})
								]
							}, `${row.provider}\u0000${row.model}`);
						})
					}),
					receipt.models.length > top.length ? (0, react_jsx_runtime.jsx)("p", {
						className: Receipt_module_css_default.subNote,
						children: t("models.more", { count: group(receipt.models.length - top.length) })
					}) : null
				]
			});
		}
		function ModelDetails({ row, currency, t }) {
			const breakdown = [
				{
					label: t("detail.input"),
					value: row.inputTokens
				},
				{
					label: t("detail.cacheRead"),
					value: row.cacheReadTokens
				},
				{
					label: t("detail.cacheWrite"),
					value: row.cacheWriteTokens
				},
				{
					label: t("detail.output"),
					value: row.outputTokens
				},
				{
					label: t("detail.reasoning"),
					value: row.reasoningTokens
				}
			];
			return (0, react_jsx_runtime.jsxs)("details", {
				className: Receipt_module_css_default.modelDetail,
				"data-model": row.model || "(unknown)",
				children: [
					(0, react_jsx_runtime.jsxs)("summary", { children: [(0, react_jsx_runtime.jsxs)("span", {
						className: Receipt_module_css_default.modelDetailMain,
						children: [(0, react_jsx_runtime.jsx)("strong", { children: row.model || t("unknownModel") }), (0, react_jsx_runtime.jsxs)("small", { children: [
							row.provider || t("unknownProvider"),
							" · ",
							t("row.calls", { count: group(row.calls) })
						] })]
					}), (0, react_jsx_runtime.jsx)("span", {
						className: Receipt_module_css_default.modelDetailAmount,
						children: rowCost(row, currency, t)
					})] }),
					(0, react_jsx_runtime.jsxs)("dl", {
						className: Receipt_module_css_default.breakdown,
						children: [breakdown.map((item) => (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: item.label }), (0, react_jsx_runtime.jsx)("dd", { children: group(item.value) })] }, item.label)), (0, react_jsx_runtime.jsxs)("div", {
							className: Receipt_module_css_default.breakdownTotal,
							children: [(0, react_jsx_runtime.jsx)("dt", { children: t("stats.tokens") }), (0, react_jsx_runtime.jsx)("dd", { children: group(tokens(row)) })]
						})]
					}),
					row.reasoningTokens > 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: Receipt_module_css_default.subNote,
						children: t("mix.reasoning", { tokens: group(row.reasoningTokens) })
					}) : null,
					!row.priced ? (0, react_jsx_runtime.jsx)("p", {
						className: Receipt_module_css_default.warning,
						children: t("detail.partial")
					}) : null
				]
			});
		}
		function ReceiptCard({ sessionId, useSessions, onClose, t }) {
			const summary = useSessions((state) => state.byId[sessionId]);
			const receipt = summary?.projectionValues?.receipt;
			const title = summary?.displayTitle || t("session.untitled");
			const [view, setView] = (0, react.useState)("overview");
			const [copyState, setCopyState] = (0, react.useState)("idle");
			const closeRef = (0, react.useRef)(null);
			const cardRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				closeRef.current?.focus();
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						event.preventDefault();
						onClose();
					}
					if (event.key !== "Tab" || cardRef.current === null) return;
					const focusable = Array.from(cardRef.current.querySelectorAll("button, summary, [tabindex]:not([tabindex=\"-1\"])")).filter((element) => !element.hasAttribute("disabled"));
					if (focusable.length === 0) return;
					const first = focusable[0];
					const last = focusable[focusable.length - 1];
					if (event.shiftKey && document.activeElement === first) {
						event.preventDefault();
						last.focus();
					} else if (!event.shiftKey && document.activeElement === last) {
						event.preventDefault();
						first.focus();
					}
				};
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("keydown", onKeyDown);
					previous?.focus();
				};
			}, [onClose]);
			async function handleCopy() {
				if (receipt === void 0) return;
				try {
					await navigator.clipboard.writeText(summaryText(receipt, title, sessionId, t));
					setCopyState("copied");
				} catch {
					setCopyState("failed");
				}
			}
			return (0, react_jsx_runtime.jsx)("div", {
				className: Receipt_module_css_default.backdrop,
				onPointerDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: (0, react_jsx_runtime.jsxs)("div", {
					ref: cardRef,
					className: Receipt_module_css_default.card,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "dsh-receipt-title",
					"data-receipt-modal": true,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: Receipt_module_css_default.header,
							children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("div", {
								className: Receipt_module_css_default.eyebrow,
								children: t("modal.eyebrow")
							}), (0, react_jsx_runtime.jsx)("h2", {
								id: "dsh-receipt-title",
								className: Receipt_module_css_default.title,
								children: t("modal.title")
							})] }), (0, react_jsx_runtime.jsxs)("div", {
								className: Receipt_module_css_default.headerActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: Receipt_module_css_default.copyButton,
									onClick: () => {
										handleCopy();
									},
									disabled: receipt === void 0,
									children: t("copy.action")
								}), (0, react_jsx_runtime.jsx)("button", {
									ref: closeRef,
									type: "button",
									className: Receipt_module_css_default.close,
									"aria-label": t("modal.close"),
									onClick: onClose,
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 17 })
								})]
							})]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: Receipt_module_css_default.body,
							children: receipt === void 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: Receipt_module_css_default.empty,
								children: t("empty")
							}) : (0, react_jsx_runtime.jsxs)("div", {
								className: Receipt_module_css_default.dashboard,
								"data-receipt-content": true,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.sessionMeta,
										children: [(0, react_jsx_runtime.jsx)("strong", {
											title,
											children: title
										}), (0, react_jsx_runtime.jsx)("span", { children: receipt.updatedAt > 0 ? t("updatedAt", { time: new Date(receipt.updatedAt).toLocaleString() }) : t("updated.unknown") })]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.hero,
										children: [
											(0, react_jsx_runtime.jsx)("div", {
												className: Receipt_module_css_default.heroLabel,
												children: t(receipt.priced ? "total.estimated" : "total.known")
											}),
											(0, react_jsx_runtime.jsx)("div", {
												className: Receipt_module_css_default.heroAmount,
												children: money(receipt.totals.cost, receipt.currency)
											}),
											(0, react_jsx_runtime.jsx)("p", { children: t("total.disclaimer") })
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.stats,
										children: [
											(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("stats.calls") }), (0, react_jsx_runtime.jsx)("strong", { children: group(receipt.totals.calls) })] }),
											(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("stats.tokens") }), (0, react_jsx_runtime.jsx)("strong", { children: group(tokens(receipt.totals)) })] }),
											(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("stats.cacheHit") }), (0, react_jsx_runtime.jsx)("strong", { children: cacheRate(receipt) ?? t("notAvailable") })] }),
											(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("stats.avg") }), (0, react_jsx_runtime.jsx)("strong", { children: receipt.priced && receipt.totals.calls > 0 ? money(receipt.totals.cost / receipt.totals.calls, receipt.currency) : t("notAvailable") })] })
										]
									}),
									receipt.models.length > 0 && !receipt.priced ? (0, react_jsx_runtime.jsx)("p", {
										className: Receipt_module_css_default.warning,
										children: t("totals.unpriced")
									}) : null,
									(0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.switcher,
										"aria-label": t("view.label"),
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": view === "overview",
											onClick: () => setView("overview"),
											children: t("view.overview")
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": view === "models",
											onClick: () => setView("models"),
											children: t("view.models")
										})]
									}),
									view === "overview" ? (0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.sections,
										children: [
											(0, react_jsx_runtime.jsx)(TokenMix, {
												receipt,
												t
											}),
											receipt.models.length > 0 ? (0, react_jsx_runtime.jsx)(ModelMix, {
												receipt,
												t
											}) : null,
											(0, react_jsx_runtime.jsxs)("section", {
												className: Receipt_module_css_default.panel,
												children: [
													(0, react_jsx_runtime.jsx)("div", {
														className: Receipt_module_css_default.sectionHead,
														children: (0, react_jsx_runtime.jsx)("h3", { children: t("time.title") })
													}),
													(0, react_jsx_runtime.jsxs)("div", {
														className: Receipt_module_css_default.inlineMetrics,
														children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("time.llm") }), (0, react_jsx_runtime.jsx)("strong", { children: duration(receipt.llmMs) })] }), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: t("time.span") }), (0, react_jsx_runtime.jsx)("strong", { children: duration(receipt.spanMs) })] })]
													}),
													receipt.totals.peakCost > 0 ? (0, react_jsx_runtime.jsx)("p", {
														className: Receipt_module_css_default.subNote,
														children: t("totals.peakCost", { amount: money(receipt.totals.peakCost, receipt.currency) })
													}) : null,
													(0, react_jsx_runtime.jsx)("p", {
														className: Receipt_module_css_default.subNote,
														children: t("peak.note", {
															window: windowsLabel(receipt.peakHours),
															multiplier: group(receipt.peakMultiplier)
														})
													})
												]
											})
										]
									}) : (0, react_jsx_runtime.jsxs)("div", {
										className: Receipt_module_css_default.sections,
										children: [
											(0, react_jsx_runtime.jsxs)("div", {
												className: Receipt_module_css_default.sectionHead,
												children: [(0, react_jsx_runtime.jsx)("h3", { children: t("detail.title") }), (0, react_jsx_runtime.jsx)("span", { children: t("models.count", { count: group(receipt.models.length) }) })]
											}),
											receipt.models.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
												className: Receipt_module_css_default.empty,
												children: t("empty")
											}) : receipt.models.map((row) => (0, react_jsx_runtime.jsx)(ModelDetails, {
												row,
												currency: receipt.currency,
												t
											}, `${row.provider}\u0000${row.model}`)),
											(0, react_jsx_runtime.jsx)("p", {
												className: Receipt_module_css_default.sessionId,
												children: t("session.id", { id: sessionId })
											})
										]
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: Receipt_module_css_default.footer,
										children: t("footer")
									})
								]
							})
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: Receipt_module_css_default.copyStatus,
							role: "status",
							"aria-live": "polite",
							children: copyState === "copied" ? t("copy.success") : copyState === "failed" ? t("copy.failed") : ""
						})
					]
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
			"modal.eyebrow": "SESSION RECEIPT",
			"modal.close": "关闭",
			"empty": "本会话暂无用量数据",
			"session.untitled": "未命名会话",
			"updatedAt": "更新于 {time}",
			"updated.unknown": "等待用量更新",
			"printedAt": "出票时间 {time}",
			"session.id": "会话 ID {id}",
			"unknownModel": "未知模型",
			"unknownProvider": "未知来源",
			"unpriced": "未计价",
			"partial": "部分计价",
			"notAvailable": "—",
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
			"total.estimated": "本会话预估费用",
			"total.known": "已知部分费用",
			"total.disclaimer": "按用量与配置单价估算，实际账单以服务商为准。",
			"stats.calls": "模型调用",
			"stats.tokens": "Token 用量",
			"stats.cacheHit": "缓存命中率",
			"stats.avg": "平均每次",
			"view.label": "小票视图",
			"view.overview": "概览",
			"view.models": "模型明细",
			"mix.title": "Token 结构",
			"mix.reasoning": "其中推理 {tokens}，已包含在输出中。",
			"models.title": "模型分布",
			"models.metric": "模型分布指标",
			"models.metric.cost": "按金额",
			"models.metric.tokens": "按 Token",
			"models.tokenCount": "{count} tokens",
			"models.count": "{count} 个模型",
			"models.more": "还有 {count} 个模型，切换到模型明细查看。",
			"time.title": "时间与峰谷",
			"detail.title": "逐模型明细",
			"detail.input": "普通输入",
			"detail.cacheRead": "缓存命中输入",
			"detail.cacheWrite": "缓存写入",
			"detail.output": "输出",
			"detail.reasoning": "其中推理",
			"detail.partial": "此模型有未配置单价的用量；显示的是可计算部分。",
			"copy.action": "复制摘要",
			"copy.success": "摘要已复制",
			"copy.failed": "复制失败，请检查浏览器剪贴板权限",
			"totals.peakCost": "其中工作日高峰时段费用 {amount}",
			"peak.note": "配置的高峰窗口（北京时间 {window}）单价 ×{multiplier}",
			"totals.unpriced": "包含未计价模型，合计费用仅供参考",
			"footer": "—— 谢谢惠顾 ——"
		};
		/** 英文词典，与中文权威 key 一致。 */
		const en = {
			"action.label": "Receipt",
			"action.aria": "Show this conversation usage receipt",
			"modal.title": "Usage Receipt",
			"modal.eyebrow": "SESSION RECEIPT",
			"modal.close": "Close",
			"empty": "No usage data for this conversation yet",
			"session.untitled": "Untitled conversation",
			"updatedAt": "Updated {time}",
			"updated.unknown": "Waiting for usage",
			"printedAt": "Printed at {time}",
			"session.id": "Session {id}",
			"unknownModel": "Unknown model",
			"unknownProvider": "Unknown provider",
			"unpriced": "Unpriced",
			"partial": "Partly priced",
			"notAvailable": "—",
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
			"total.estimated": "Estimated session cost",
			"total.known": "Known portion of cost",
			"total.disclaimer": "Estimated from recorded usage and configured rates; the provider bill is authoritative.",
			"stats.calls": "Model calls",
			"stats.tokens": "Tokens used",
			"stats.cacheHit": "Cache hit rate",
			"stats.avg": "Average per call",
			"view.label": "Receipt view",
			"view.overview": "Overview",
			"view.models": "Model details",
			"mix.title": "Token mix",
			"mix.reasoning": "Of these, {tokens} reasoning tokens are already included in output.",
			"models.title": "Model distribution",
			"models.metric": "Model distribution metric",
			"models.metric.cost": "By cost",
			"models.metric.tokens": "By tokens",
			"models.tokenCount": "{count} tokens",
			"models.count": "{count} models",
			"models.more": "{count} more models are available in Model details.",
			"time.title": "Time and peak rates",
			"detail.title": "Per-model details",
			"detail.input": "Regular input",
			"detail.cacheRead": "Cached input",
			"detail.cacheWrite": "Cache write",
			"detail.output": "Output",
			"detail.reasoning": "Of which reasoning",
			"detail.partial": "Some usage has no configured rate; this shows only the calculable portion.",
			"copy.action": "Copy summary",
			"copy.success": "Summary copied",
			"copy.failed": "Could not copy; check clipboard permissions",
			"totals.peakCost": "Peak-hour portion {amount}",
			"peak.note": "Configured peak window (Beijing {window}) ×{multiplier}",
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