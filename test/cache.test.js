'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { key } = require('../lib/cache');

test('key: 确定性（同输入同哈希）', () => {
  const a = key('{c1}', '2.26.0', '1.0.1', { format: 'svg' });
  const b = key('{c1}', '2.26.0', '1.0.1', { format: 'svg' });
  assert.strictEqual(a, b);
});

test('key: 任一因子变化即变', () => {
  const base = key('{c1}', '2.26.0', '1.0.1', { format: 'svg' });
  assert.notStrictEqual(base, key('{c2}', '2.26.0', '1.0.1', { format: 'svg' }));
  assert.notStrictEqual(base, key('{c1}', '2.24.0', '1.0.1', { format: 'svg' }));
  assert.notStrictEqual(base, key('{c1}', '2.26.0', '1.0.2', { format: 'svg' }));
  assert.notStrictEqual(base, key('{c1}', '2.26.0', '1.0.1', { format: 'png' }));
});

test('key: 返回 64 位 hex', () => {
  assert.match(key('{c1}', '', '', {}), /^[0-9a-f]{64}$/);
});
