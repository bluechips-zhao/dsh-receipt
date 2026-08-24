/** CSS Modules 声明：client 类型检查需要 `*.module.css` 的默认导出形状。 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
