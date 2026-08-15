'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { parseFence, parseTagArgs, parseOptions } = require('../lib/parser');

test('parseFence: lily 与 lilypond 别名', () => {
  assert.deepStrictEqual(parseFence('lilypond'), { lang: 'lilypond', options: {} });
  assert.deepStrictEqual(parseFence('lily'), { lang: 'lily', options: {} });
});

test('parseFence: 大小写不敏感', () => {
  assert.deepStrictEqual(parseFence('LilyPond'), { lang: 'lilypond', options: {} });
});

test('parseFence: 非法语言返回 null', () => {
  assert.strictEqual(parseFence('javascript'), null);
  assert.strictEqual(parseFence(''), null);
});

test('parseFence: 解析选项', () => {
  assert.deepStrictEqual(parseFence('lilypond caption="属七和弦" width="70%"'), {
    lang: 'lilypond',
    options: { caption: '属七和弦', width: '70%' }
  });
});

test('parseTagArgs: 双引号/单引号/裸路径', () => {
  assert.deepStrictEqual(parseTagArgs(['"scores/demo.ly"']), { file: 'scores/demo.ly', options: {} });
  assert.deepStrictEqual(parseTagArgs(["'scores/demo.ly'"]), { file: 'scores/demo.ly', options: {} });
  assert.deepStrictEqual(parseTagArgs(['scores/demo.ly']), { file: 'scores/demo.ly', options: {} });
});

test('parseTagArgs: 路径穿越拦截', () => {
  const r = parseTagArgs(['../secret.ly']);
  assert.strictEqual(r.file, null);
  assert.ok(r.error);
});

test('parseTagArgs: 缺路径', () => {
  assert.deepStrictEqual(parseTagArgs([]), { file: null, options: {} });
});

test('parseTagArgs: 带选项', () => {
  assert.deepStrictEqual(parseTagArgs(['"scores/x.ly"', 'caption="hi"']), {
    file: 'scores/x.ly',
    options: { caption: 'hi' }
  });
});

test('parseOptions: k=v 与引号', () => {
  assert.deepStrictEqual(parseOptions('caption="a b" width=70% id=x'), {
    caption: 'a b', width: '70%', id: 'x'
  });
  assert.deepStrictEqual(parseOptions(''), {});
});
