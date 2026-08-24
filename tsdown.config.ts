/**
 * 包内 tsdown 配置：一次产出 host 半（lib/index.js）与 browser 半（lib/client.js）。
 * harness 是 D: checkout 的 junction（node_modules 的兄弟目录），
 * 官方 platform 表与 lightningcss 从 checkout 解析。
 *
 * 注意（0.1.1-rc.2 起）：官方 `clientBundle` 预设通过 workspaceManifest
 * 从 checkout 的 packages 目录查找包清单，out-of-tree 插件（本包不在
 * checkout workspace 内）无法使用该预设。这里改为自包含配置：
 * - host 半：tsdown node 库（external schemastery/zod，与 profile 侧共享 schema 实例）；
 * - client 半：browser CJS 工厂（banner/footer 走 window.__ModuleLoader__.load），
 *   external = checkout 的 PLATFORM_MODULES + PRELOADED_CLIENT_EXTERNALS，
 *   其余依赖内联；CSS Modules 经 lightningcss 编译为 class map 并注入样式。
 *
 * 不在本文件 import 'tsdown' / 'lightningcss' 裸包名：它们只存在于 checkout
 * 的 node_modules，而本配置由 tsdown CLI 从插件目录加载（node 解析不到）。
 * 通过 harness junction 的相对路径解析即可；tsdown 的配置对象形状保持与
 * 官方 UserConfig 一致（见 packages/client/tsdown.client.ts）。
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from './harness/node_modules/lightningcss/node/index.mjs'
import { PLATFORM_MODULES, PRELOADED_CLIENT_EXTERNALS } from './harness/packages/client/web/src/platform.ts'

/** tsdown 求值时的仓库根（harness junction 指向 checkout）。 */
const REPOSITORY_ROOT = fileURLToPath(new URL('./harness/', import.meta.url))

/** 本插件仓库根（tsdown.config.ts 所在目录）。用于把 CSS 虚拟模块 id 归一化为项目相对路径。 */
const PLUGIN_ROOT = fileURLToPath(new URL('.', import.meta.url))

/** tsc 输出与源码之间的路径分隔标记（lib/types → src）。 */
const TYPES_MARKER = `${sep}lib${sep}types${sep}`
const SOURCE_MARKER = `${sep}src${sep}`

/** CSS Modules 虚拟 id 包装（官方配方的自包含复刻，见 packages/client/tsdown.client.ts）。 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** 把 import 的 .module.css 解析到物理文件（emitted → source-tree 重映射）。 */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const boundary = emitted.indexOf(TYPES_MARKER)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + TYPES_MARKER.length))
}

/**
 * CSS 虚拟模块 id 的物理路径表：以项目相对 id（`plugin-root/...` 形式）为键，
 * 记录真实绝对路径。这样虚拟 id 不含绝对路径，产物里的 `//#region` 注释可公开；
 * `resolveId` 注册、`load` 取回，二者共享同一张表。
 */
const cssModuleFiles = new Map<string, string>()

/** 生成项目相对（可用 `/` 分隔）的 CSS 虚拟 id。 */
function cssVirtualId(absolutePath: string): string {
  return relative(PLUGIN_ROOT, absolutePath).split(sep).join('/')
}

/** 生成样式注入模块（标签式，data-plugin-css 去重）。 */
function styleInjectionModule(id: string, fileId: string, css: string, classMap?: Readonly<Record<string, string>>): string {
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    '  const tag = document.createElement(\'style\');',
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

/** 把 lib/types 下的 map 指向浏览器可解析的源码 URL。 */
function browserSourcePath(source: string, sourcemapPath: string): string {
  if (!source.startsWith('.')) return source
  const physicalSource = resolvePath(dirname(sourcemapPath), source)
  const repositoryPath = relative(REPOSITORY_ROOT, physicalSource).split(sep).join('/')
  return repositoryPath.startsWith('packages/') ? `../../../${repositoryPath}` : source
}

/** host 半：node ESM 库，schemastery/zod 保持 external。 */
const hostConfig = {
  name: 'dsh-receipt',
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: {
    neverBundle: ['@deepseek-ai/schemastery', 'zod'],
    alwaysBundle: (specifier: string) =>
      !['@deepseek-ai/schemastery', 'zod'].includes(specifier) && !specifier.startsWith('node:'),
  },
}

/** client 半：browser CJS 工厂，平台模块保持 external，其余内联。 */
const clientExternals = [...PLATFORM_MODULES, ...PRELOADED_CLIENT_EXTERNALS]

const clientConfig = {
  name: 'dsh-receipt/client',
  entry: { client: 'lib/types/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: clientExternals,
    alwaysBundle: (specifier: string) => !clientExternals.includes(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
      const id = cssVirtualId(abs)
      cssModuleFiles.set(id, abs)
      return CSS_VIRTUAL_PREFIX + id + CSS_VIRTUAL_SUFFIX
    },
    async load(this: { addWatchFile(file: string): void }, virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const id = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      const fileId = cssModuleFiles.get(id) ?? resolvePath(PLUGIN_ROOT, id)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      const exportEntries = Object.entries(cssExports ?? {}).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      for (const [local, exp] of exportEntries) classMap[local] = exp.name
      return styleInjectionModule('dsh-receipt', fileId, code.toString(), classMap)
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    sourcemapPathTransform: browserSourcePath,
    banner: 'window.__ModuleLoader__.load({ id: "dsh-receipt", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [hostConfig, clientConfig]
