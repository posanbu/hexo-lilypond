# hexo-lilypond

在 Markdown 里直接写 LilyPond 乐谱，`hexo generate` 时调用本机 LilyPond CLI 编译成 SVG 嵌入页面。零 npm 运行依赖。

第一版只做 7 件事：` ```lilypond ` / ` ```lily ` 围栏、`{% lilypond %}` 标签、本机 CLI、SVG 输出、SHA256 缓存、版本检查、清晰报错。

## 安装

> 当前尚未发布到 npm registry。本地使用走 `file:` 依赖：

```bash
# 站点 package.json 里加依赖后 npm install（会建符号链接）
"dependencies": { "hexo-lilypond": "file:../hexo-lilypond" }
```

将来发布后改为：

```bash
npm install hexo-lilypond
```

## 环境准备

```bash
brew install lilypond
lilypond --version   # 记下版本号，对齐下面的 version 配置
```

## 配置（`_config.yml`）

```yaml
lilypond:
  executable: lilypond        # 裸名字走 PATH；可填绝对/相对路径
  version: "2.26.0"           # 与 `lilypond --version` 实际版本一致
  output:
    format: svg
  cache:
    enable: true
    dir: .cache/lilypond      # 编译临时目录（.ps/.midi/日志隔离在此）
  onError: auto               # auto | embed | fail
```

**重要**：另在 `_config.yml` 的 `exclude` 里加 `scores/**`，防止 `.ly` 源文件被复制到 `public/`：

```yaml
exclude:
  - "scores/**"
```

## 使用

### 1. 围栏代码块（`lilypond` 或简写 `lily`）

````markdown
```lilypond
\relative c' {
  c4 d e f |
  g a b c |
}
```
````

编译成：

```html
<figure class="lilypond-score"><img class="lilypond-score-image" src="/lilypond/<hash>.svg"></figure>
```

### 2. 独立 `.ly` 文件标签

把谱例文件放进 `source/scores/`，然后用标签引用（带不带引号均可）：

```
{% lilypond "scores/demo.ly" %}
{% lilypond scores/demo.ly %}
```

## 错误处理（`onError`）

| 值 | 行为 |
|---|---|
| `embed` | 页面内嵌 `<pre class="lilypond-error">…</pre>`，不中断构建 |
| `fail` | 抛错使构建失败，避免发布缺谱网站 |
| `auto` | `hexo server` 时 `embed`，`generate`/`deploy` 时 `fail` |

报错统一格式，含 Post / Score / line 三要素（行号已指回用户源码）：

```text
LilyPond compilation failed
Post:    _posts/xxx.md
Score:   lilypond block #3
LilyPond: line 7: syntax error, unexpected '}'
```

## 缓存

- SVG 直接缓存到 `public/lilypond/<hash>.svg`，命中即复用、不重跑 LilyPond。
- 缓存键 = `SHA256(谱例源码 + LilyPond 版本 + 渲染器版本 + 渲染选项)`，任一变化即重编译。

## 目录结构

```text
index.js                  # Hexo 感知层（唯一入口，注册 filter + tag）
lib/
  ├── config.js           # 读配置 + 默认值
  ├── parser.js           # 标签参数解析（caption/width 接口已留，未接入输出）
  ├── wrapper.js          # 包装源码（去 \version、注入 \pointAndClickOff、行偏移）
  ├── compiler.js         # spawn lilypond → SVG；错误行解析
  ├── cache.js            # SHA256 键 + public 缓存
  └── renderer.js         # 编排，输出 <figure>
test/                     # node:test 单测（零依赖）
```

`lib/` 不依赖全局 `hexo`（依赖注入），`index.js` 是唯一碰 `hexo` 的层。

## 主题样式

插件只输出稳定 HTML，样式由主题负责。参考：

```css
.lilypond-score { text-align: center; margin: 2em auto; }
.lilypond-score-image { max-width: 100%; height: auto; }
/* 深色模式反色：SVG 以 currentColor 上色，经 <img> 引入固定为黑，需 filter 反相；hue-rotate 保留彩色色相 */
.mdui-theme-dark .lilypond-score-image { filter: invert(1) hue-rotate(180deg); }
@media (prefers-color-scheme: dark) { .mdui-theme-auto .lilypond-score-image { filter: invert(1) hue-rotate(180deg); } }
```

## 开发

```bash
npm test   # node --test，零依赖
```

## License

MIT
