'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');
const wrapper = require('./wrapper');
const compiler = require('./compiler');
const cache = require('./cache');

const RENDERER_VERSION = '1.0.1';

// ctx: { config, sourceDir, publicDir, root, hexoRoot, cacheDir, log }
function createRenderer(ctx) {
  const executable = config.resolveExecutable(ctx.config, ctx.hexoRoot);

  // 构建 <figure> HTML（单行，避免被 markdown 的 HTML 块规则拆散）
  function buildFigure(hash) {
    const src = (ctx.root || '/') + 'lilypond/' + hash + '.svg';
    return '<figure class="lilypond-score"><img class="lilypond-score-image" src="' + src + '"></figure>';
  }

  // 版本检查（memoize，首次调用时执行一次）
  async function ensureVersion() {
    if (ctx._versionChecked) return ctx._versionResult;
    ctx._versionChecked = true;
    const res = await compiler.checkVersion(executable);
    if (res.ok && ctx.config.version && res.version && res.version !== ctx.config.version) {
      res.mismatch = 'LilyPond version mismatch: configured=' + ctx.config.version + ', actual=' + res.version;
    }
    ctx._versionResult = res;
    return res;
  }

  async function compileInline(source, opts) {
    return compileWrapped(wrapper.wrap(source, ctx.config.version), opts);
  }

  async function compileFile(fileRel, opts) {
    const base = path.resolve(ctx.sourceDir);
    const abs = path.resolve(base, fileRel);
    // 防路径穿越（parser 已校验，这里再保险）
    if (abs !== base && !abs.startsWith(base + path.sep)) {
      return { ok: false, error: { message: 'invalid score path: ' + fileRel } };
    }
    if (!fs.existsSync(abs)) {
      return { ok: false, error: { message: 'score file not found: ' + fileRel } };
    }
    const source = fs.readFileSync(abs, 'utf8');
    return compileWrapped(wrapper.wrap(source, ctx.config.version), opts);
  }

  async function compileWrapped(wrapped, opts) {
    const hash = cache.key(wrapped.content, ctx.config.version, RENDERER_VERSION, ctx.config.output);
    const cached = ctx.config.cache.enable !== false && cache.has(hash, ctx.publicDir);
    if (cached) {
      return { ok: true, hash, html: buildFigure(hash), cached: true };
    }

    const buildDir = path.join(ctx.cacheDir, 'build', hash);
    const res = await compiler.compile(wrapped.content, { executable, cwd: buildDir, hash });
    if (!res.ok) {
      // 报错行号是相对包装后临时文件的，换算回用户源码行号
      const error = res.error && res.error.line != null
        ? Object.assign({}, res.error, { line: Math.max(1, res.error.line - wrapped.offset) })
        : res.error;
      return { ok: false, hash, error };
    }

    cache.write(hash, res.svgPath, ctx.publicDir);
    return { ok: true, hash, html: buildFigure(hash), cached: false };
  }

  return { buildFigure, ensureVersion, compileInline, compileFile };
}

module.exports = { createRenderer, RENDERER_VERSION };
