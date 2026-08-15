'use strict';

// 把用户源码包成可直接编译的 LilyPond 文件：
//   1) 去掉用户自带的 \version 行，避免重复声明
//   2) 前置 \version + \pointAndClickOff
//   3) 后置最小 \paper / \layout（engraving 调优留后续）
// 返回 { content, offset }，offset 表示用户源码首行相对包装后文件的
// 行偏移（用于把 LilyPond 报错行号换算回用户源码行号）。
function wrap(source, version) {
  const cleaned = String(source || '')
    .replace(/^\s*\\version\s+".*?"\s*(\r?\n|$)/gm, '')
    .trim();

  const header = [];
  if (version) header.push(`\\version "${version}"`);
  header.push('\\pointAndClickOff');

  // 头部 N 行 + 1 个空行之后才是用户源码首行
  const offset = header.length + 1;

  return {
    content: [header.join('\n'), cleaned, '\\paper { tagline = ##f }', '\\layout {}'].join('\n\n') + '\n',
    offset
  };
}

module.exports = { wrap };
