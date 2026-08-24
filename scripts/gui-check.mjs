/**
 * GUI 最终验证（完整版）：打开会话 → 点小票 → 完整内容 + 截图。
 *
 * 依赖本机的 DSH GUI 与 Playwright Chromium；路径与截图目录通过环境变量配置，
 * 不写死作者本机路径，便于共享与 CI：
 *   - RECEIPT_GUI_URL         Web GUI 地址（默认 http://127.0.0.1:3080/）
 *   - RECEIPT_PLAYWRIGHT      Playwright 包在 DSH 仓库 node_modules 中的绝对路径
 *   - RECEIPT_CHROMIUM        Chromium 可执行文件绝对路径
 *   - RECEIPT_EXPECT_ROW      待选中的会话行文案（默认 "小票会话费用统计插件"）
 *   - RECEIPT_OUT_PNG         截图输出文件（默认 scripts/receipt-demo.png）
 */
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const guiUrl = process.env.RECEIPT_GUI_URL ?? 'http://127.0.0.1:3080/'
const playwrightEntry = process.env.RECEIPT_PLAYWRIGHT
const chromiumPath = process.env.RECEIPT_CHROMIUM
const expectRow = process.env.RECEIPT_EXPECT_ROW ?? '小票会话费用统计插件'
const outPng = process.env.RECEIPT_OUT_PNG ?? resolve(__dirname, 'receipt-demo.png')

if (!playwrightEntry || !chromiumPath) {
  console.error('Missing RECEIPT_PLAYWRIGHT or RECEIPT_CHROMIUM; refusing to guess author-local paths.')
  process.exit(2)
}

const { chromium } = createRequire(playwrightEntry)(playwrightEntry)

const browser = await chromium.launch({ headless: true, executablePath: chromiumPath })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`))
await page.goto(guiUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(6000)
const row = page.locator('[class*="sessionRow"]', { hasText: expectRow }).first()
await row.click({ timeout: 5000 }).catch(() => {})
await page.waitForTimeout(5000)

// 点击小票按钮（dispatchEvent 保证命中 React 处理器）
const clicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes('查看本会话消费小票'))
  if (!btn) return false
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  return true
})
console.log('clicked:', clicked)
await page.waitForTimeout(2000)

const modal = page.locator('[data-receipt-modal]')
console.log('modal count:', await modal.count())
if (await modal.count() > 0) {
  const text = await modal.innerText()
  console.log('===== RECEIPT CONTENT =====')
  console.log(text)
  await page.screenshot({ path: outPng })
}
console.log('===== console errors =====')
console.log(logs.filter(l => l.startsWith('[error]') || l.startsWith('[pageerror]')).slice(0, 15).join('\n') || '(none)')
await browser.close()
