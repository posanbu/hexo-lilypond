'use strict';

const path = require('path');
const config = require('./lib/config');
const parser = require('./lib/parser');
const { createRenderer } = require('./lib/renderer');

// 匹配 ```lilypond ... ``` / ```lily ... ``` 围栏。组 1=反引号，组 2=选项串，组 3=源码。
const LILYPOND_FENCE = /(```+)[ \t]*lily(?:pond)?\b([^\n]*)\n([\s\S]*?)\n?[ \t]*\1[ \t]*(?=\n|$)/g;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isMarkdownSource(source) {
  return /\.(md|markdown|mdown|mkdn?)$/i.test(source || '');
}

const lilypondConfig = config.load(hexo.config);
const ctx = {
  config: lilypondConfig,
  sourceDir: hexo.source_dir,
  publicDir: hexo.public_dir,
  root: hexo.config.root || '/',
  hexoRoot: hexo.base_dir,
  cacheDir: path.resolve(hexo.base_dir, lilypondConfig.cache.dir),
  log: hexo.log
};

const renderer = createRenderer(ctx);

// dev（hexo server / hexo s）时 embed，其余（generate/deploy 等）fail
const cmd = (hexo.env && hexo.env.cmd) || '';
const isDev = cmd === 'server' || cmd === 's';
const onError = lilypondConfig.onError === 'embed'
  ? 'embed'
  : lilypondConfig.onError === 'fail'
    ? 'fail'
    : (isDev ? 'embed' : 'fail');

let versionChecked = false;
async function checkVersionOnce() {
  if (versionChecked) return;
  versionChecked = true;
  const res = await renderer.ensureVersion();
  if (!res.ok) {
    const msg = 'LilyPond 不可用: ' + (res.error || 'unknown');
    if (onError === 'fail') throw new Error(msg);
    hexo.log.warn(msg);
    return;
  }
  if (res.mismatch) {
    if (onError === 'fail') throw new Error(res.mismatch);
    hexo.log.warn(res.mismatch);
  }
}

function formatError(postSource, scoreLabel, err) {
  const lines = ['LilyPond compilation failed'];
  if (postSource) lines.push('Post:    ' + postSource);
  lines.push('Score:   ' + scoreLabel);
  if (err && err.line != null) {
    lines.push('LilyPond: line ' + err.line + (err.col != null ? ':' + err.col : '') + ': ' + err.message);
  } else {
    lines.push('LilyPond: ' + ((err && err.message) || 'unknown error'));
  }
  return lines.join('\n');
}

function errorBlock(postSource, scoreLabel, err) {
  return '<pre class="lilypond-error">' + escapeHtml(formatError(postSource, scoreLabel, err)) + '</pre>';
}

// 围栏代码块：before_post_render 阶段把 ```lilypond 替换成 <figure>
hexo.extend.filter.register('before_post_render', async data => {
  if (!isMarkdownSource(data.source)) return;
  const content = data.content;
  if (typeof content !== 'string' || content.indexOf('lily') === -1) return;

  const matches = Array.from(content.matchAll(LILYPOND_FENCE));
  if (matches.length === 0) return;

  await checkVersionOnce();

  let out = '';
  let last = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    out += content.slice(last, m.index);

    const result = await renderer.compileInline(m[3], {});
    if (result.ok) {
      out += result.html;
    } else {
      if (onError === 'fail') {
        throw new Error(formatError(data.source, 'lilypond block #' + (i + 1), result.error));
      }
      out += errorBlock(data.source, 'lilypond block #' + (i + 1), result.error);
    }

    last = m.index + m[0].length;
  }
  out += content.slice(last);
  data.content = out;
}, 9);

// 独立 .ly 文件标签：{% lilypond "scores/x.ly" %} / {% lilypond scores/x.ly %}
hexo.extend.tag.register('lilypond', async args => {
  const { file, error } = parser.parseTagArgs(args);
  if (error || !file) {
    return errorBlock(null, file || '(missing path)', { message: error || 'lilypond tag 缺少文件路径' });
  }
  await checkVersionOnce();
  const result = await renderer.compileFile(file, {});
  if (result.ok) return result.html;
  if (onError === 'fail') {
    throw new Error(formatError(null, file, result.error));
  }
  return errorBlock(null, file, result.error);
}, { async: true });
