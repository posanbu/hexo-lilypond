'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { wrap } = require('../lib/wrapper');

test('wrap: 无 version 时只注入 pointAndClickOff', () => {
  const { content, offset } = wrap('{ c1 }', '');
  assert.strictEqual(offset, 2); // header 1 行 + 1 空行
  assert.ok(content.includes('\\pointAndClickOff'));
  assert.ok(!content.includes('\\version'));
  assert.ok(content.includes('{ c1 }'));
  assert.ok(content.includes('\\paper { tagline = ##f }'));
  assert.ok(content.includes('\\layout {}'));
});

test('wrap: 有 version 时注入 \\version', () => {
  const { content, offset } = wrap('{ c1 }', '2.26.0');
  assert.strictEqual(offset, 3); // header 2 行 + 1 空行
  assert.ok(content.includes('\\version "2.26.0"'));
  assert.ok(content.includes('\\pointAndClickOff'));
});

test('wrap: 去掉用户自带 \\version 行', () => {
  const src = '\\version "2.20.0"\n{ c1 }';
  const { content } = wrap(src, '2.26.0');
  assert.ok(!content.includes('2.20.0'));
  assert.ok(content.includes('2.26.0'));
});
