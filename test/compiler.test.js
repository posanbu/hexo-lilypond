'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { parseError } = require('../lib/compiler');

test('parseError: 从 lilypond 输出解析行/列/消息', () => {
  const r = parseError('/tmp/x.ly:7:3: error: syntax error, unexpected }', '', 1);
  assert.strictEqual(r.line, 7);
  assert.strictEqual(r.col, 3);
  assert.strictEqual(r.message, 'syntax error, unexpected }');
});

test('parseError: 无匹配时回退 exit code 文案', () => {
  const r = parseError('', 'some stdout', 2);
  assert.strictEqual(r.line, null);
  assert.strictEqual(r.col, null);
  assert.strictEqual(r.message, 'LilyPond exited with code 2');
});
