'use strict';

const path = require('path');

const DEFAULTS = {
  executable: 'lilypond',
  version: '',
  output: { format: 'svg' },
  cache: { enable: true, dir: '.cache/lilypond' },
  onError: 'auto'
};

// 合并默认值与 hexo.config.lilypond
function load(hexoConfig) {
  const user = (hexoConfig && hexoConfig.lilypond) || {};
  return {
    executable: user.executable || DEFAULTS.executable,
    version: user.version || DEFAULTS.version,
    output: Object.assign({}, DEFAULTS.output, user.output || {}),
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

module.exports = { DEFAULTS, load, resolveExecutable };
