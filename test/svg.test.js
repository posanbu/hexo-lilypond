'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { addPadding } = require('../lib/svg');

test('addPadding: 同比例扩展物理尺寸与 viewBox', () => {
  const source = '<svg width="100mm" height="50mm" viewBox="10 20 200 100"><path d="M 0 0"/></svg>';
  const result = addPadding(source, { top: 3, right: 2, bottom: 4, left: 1 });

  assert.match(result, /width="103mm"/);
  assert.match(result, /height="57mm"/);
  assert.match(result, /viewBox="8 14 206 114"/);
  assert.match(result, /<path d="M 0 0"\/>/);
});

test('addPadding: 零留白不改 SVG', () => {
  const source = '<svg width="100mm" height="50mm" viewBox="0 0 200 100"></svg>';
  assert.strictEqual(addPadding(source, { top: 0, right: 0, bottom: 0, left: 0 }), source);
});

test('addPadding: 缺少毫米尺寸时明确报错', () => {
  const source = '<svg width="100px" height="50px" viewBox="0 0 200 100"></svg>';
  assert.throws(() => addPadding(source, { bottom: 2 }), /millimetre/);
});
