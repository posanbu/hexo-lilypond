'use strict';

const path = require('path');

const DEFAULT_PADDING = Object.freeze({
  top: 1,
  right: 1,
  bottom: 2,
  left: 1
});

const DEFAULTS = {
  executable: 'lilypond',
  version: '',
  output: { format: 'svg', padding: DEFAULT_PADDING },
  cache: { enable: true, dir: '.cache/lilypond' },
  onError: 'auto'
};

function nonNegative(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizePadding(value) {
  if (value === false || value === 0) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const all = nonNegative(value, 0);
    return { top: all, right: all, bottom: all, left: all };
  }

  const input = value && typeof value === 'object' ? value : {};
  return {
    top: nonNegative(input.top, DEFAULT_PADDING.top),
    right: nonNegative(input.right, DEFAULT_PADDING.right),
    bottom: nonNegative(input.bottom, DEFAULT_PADDING.bottom),
    left: nonNegative(input.left, DEFAULT_PADDING.left)
  };
}

// 合并默认值与 hexo.config.lilypond
function load(hexoConfig) {
  const user = (hexoConfig && hexoConfig.lilypond) || {};
  const output = Object.assign({}, DEFAULTS.output, user.output || {});
  output.padding = normalizePadding(output.padding);
  return {
    executable: user.executable || DEFAULTS.executable,
    version: user.version || DEFAULTS.version,
    output,
    cache: Object.assign({}, DEFAULTS.cache, user.cache || {}),
    onError: user.onError || DEFAULTS.onError
  };
}

// 解析 executable：
//  - 绝对路径 → 原样返回
//  - 含 / 或 \ 的相对路径 → 相对站点根解析
//  - 裸名字（如 'lilypond'）→ 原样返回，交给系统 PATH
function resolveExecutable(config, hexoRoot) {
  const exe = config.executable;
  if (path.isAbsolute(exe)) return exe;
  if (exe.includes('/') || exe.includes('\\')) {
    return path.resolve(hexoRoot, exe);
  }
  return exe;
}

module.exports = { DEFAULTS, DEFAULT_PADDING, load, normalizePadding, resolveExecutable };
