'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 缓存键：lilypond 源码 + 版本 + 渲染器版本 + 渲染选项
function key(lilypondSource, version, rendererVersion, options) {
  const input = [lilypondSource, version || '', rendererVersion || '', JSON.stringify(options || {})].join('\n');
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function svgName(hash) {
  return hash + '.svg';
}

// public/lilypond/<hash>.svg 是否存在
function has(hash, publicDir) {
  return fs.existsSync(path.join(publicDir, 'lilypond', svgName(hash)));
}

// 把编译好的 SVG 复制到 public/lilypond/<hash>.svg
function write(hash, svgPath, publicDir) {
  const dir = path.join(publicDir, 'lilypond');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(svgPath, path.join(dir, svgName(hash)));
}

function publicPath(hash, publicDir) {
  return path.join(publicDir, 'lilypond', svgName(hash));
}

module.exports = { key, has, write, publicPath };
