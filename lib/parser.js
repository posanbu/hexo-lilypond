'use strict';

// 解析围栏 info 串，如 `lilypond caption="..." width="70%"`（`lily` 为别名）
// v1 只确认语言为 lily/lilypond；caption/width 等选项解析已实现但暂未接入输出。
function parseFence(info) {
  const tokens = (info || '').trim().split(/\s+/);
  const lang = (tokens[0] || '').toLowerCase();
  if (lang !== 'lily' && lang !== 'lilypond') return null;
  return { lang, options: parseOptions(tokens.slice(1).join(' ')) };
}

// 解析 {% lilypond "scores/x.ly" %} 或 {% lilypond scores/x.ly %}
// args 是 Hexo 标签系统传入的字符串数组（已按空白切分，可能保留引号）。
function parseTagArgs(args) {
  const joined = (args || []).join(' ').trim();
  const m = joined.match(/^("([^"]+)"|'([^']+)'|(\S+))/);
  if (!m) return { file: null, options: {} };
  const file = m[2] || m[3] || m[4];
  if (!file || file.includes('..')) {
    return { file: null, options: {}, error: 'invalid or unsafe path: ' + file };
  }
  const rest = joined.slice(m[0].length).trim();
  return { file, options: parseOptions(rest) };
}

// 解析 k=v 选项串，如 `caption="属七和弦" width="70%"`
// TODO(后续阶段): 把 caption/id/class/width/alt 等映射进 <figure>/<img> 属性。
function parseOptions(str) {
  const options = {};
  const re = /(\w+)=("[^"]*"|'[^']*'|\S+)/g;
  let m;
  while ((m = re.exec(str || '')) !== null) {
    options[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return options;
}

module.exports = { parseFence, parseTagArgs, parseOptions };
