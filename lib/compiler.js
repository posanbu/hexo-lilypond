'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 编译一段 LilyPond 源码为 SVG。
// 成功 resolve({ ok:true, svgPath, stdout, stderr })
// 失败 resolve({ ok:false, error:{ line, col, message, raw } })
function compile(lySource, { executable, cwd, hash }) {
  return new Promise(resolve => {
    try {
      fs.mkdirSync(cwd, { recursive: true });
    } catch (err) {
      resolve({ ok: false, error: { message: 'cannot create build dir: ' + err.message } });
      return;
    }

    const lyPath = path.join(cwd, hash + '.ly');
    fs.writeFileSync(lyPath, lySource, 'utf8');

    // -dcrop 让 LilyPond 额外产出一个裁掉页边距的 <hash>.cropped.svg；
    // 否则默认 A4 页面会在嵌入的谱子下方留大片空白。
    const args = ['-dcrop', '-f', 'svg', '-o', path.join(cwd, hash), lyPath];
    let child;
    try {
      child = spawn(executable, args, { cwd });
    } catch (err) {
      resolve({ ok: false, error: { message: 'spawn failed: ' + err.message } });
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });

    child.on('error', err => {
      resolve({ ok: false, error: { message: 'failed to run lilypond: ' + err.message } });
    });

    child.on('close', code => {
      // 优先用裁边版；老版本 LilyPond 不支持 -dcrop 时退回原图。
      const cropped = path.join(cwd, hash + '.cropped.svg');
      const full = path.join(cwd, hash + '.svg');
      const svgPath = fs.existsSync(cropped) ? cropped : full;
      if (code === 0 && fs.existsSync(svgPath)) {
        resolve({ ok: true, svgPath, stdout, stderr });
      } else {
        resolve({ ok: false, error: parseError(stderr, stdout, code) });
      }
    });
  });
}

// 从 LilyPond 输出里解析错误行，形如：
//   /path/to/file.ly:7:3: error: syntax error, unexpected '}'
function parseError(stderr, stdout, code) {
  const combined = (stderr || '') + '\n' + (stdout || '');
  const re = /([^\s:][^:]*):(\d+):(\d+):\s+error:\s*([^\n]*)/;
  const m = combined.match(re);
  if (m) {
    return {
      line: parseInt(m[2], 10),
      col: parseInt(m[3], 10),
      message: m[4].trim(),
      raw: combined.trim()
    };
  }
  return { line: null, col: null, message: 'LilyPond exited with code ' + code, raw: combined.trim() };
}

// 读取 lilypond 版本号，形如 "GNU LilyPond 2.26.0 (running Guile 3.0)"
function checkVersion(executable) {
  return new Promise(resolve => {
    let child;
    try {
      child = spawn(executable, ['--version']);
    } catch (err) {
      resolve({ ok: false, version: null, error: 'failed to run lilypond: ' + err.message });
      return;
    }
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', err => {
      resolve({ ok: false, version: null, error: err.message });
    });
    child.on('close', code => {
      if (code !== 0) {
        resolve({ ok: false, version: null, error: 'lilypond --version exited with code ' + code });
        return;
      }
      const m = out.match(/\b(\d+\.\d+(?:\.\d+)?)\b/);
      resolve({ ok: true, version: m ? m[1] : null, raw: out.trim() });
    });
  });
}

module.exports = { compile, parseError, checkVersion };
