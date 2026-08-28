'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { load, resolveExecutable } = require('../lib/config');

test('load: 无用户配置时返回默认值', () => {
  assert.deepStrictEqual(load({}), {
    executable: 'lilypond',
    version: '',
    output: {
      format: 'svg',
      padding: { top: 1, right: 1, bottom: 2, left: 1 }
    },
    cache: { enable: true, dir: '.cache/lilypond' },
    onError: 'auto'
  });
});

test('load: 用户配置覆盖且未覆盖项保留默认', () => {
  const c = load({ lilypond: { version: '2.24.0', onError: 'fail', cache: { enable: false } } });
  assert.strictEqual(c.version, '2.24.0');
  assert.strictEqual(c.onError, 'fail');
  assert.strictEqual(c.cache.enable, false);
  assert.strictEqual(c.cache.dir, '.cache/lilypond');
  assert.strictEqual(c.executable, 'lilypond');
});

test('load: output 子项合并', () => {
  const c = load({ lilypond: { output: { format: 'png' } } });
  assert.strictEqual(c.output.format, 'png');
  assert.deepStrictEqual(c.output.padding, { top: 1, right: 1, bottom: 2, left: 1 });
});

test('load: padding 可按边覆盖', () => {
  const c = load({ lilypond: { output: { padding: { bottom: 3 } } } });
  assert.deepStrictEqual(c.output.padding, { top: 1, right: 1, bottom: 3, left: 1 });
});

test('load: padding 数字应用到四边，false 可关闭', () => {
  const uniform = load({ lilypond: { output: { padding: 1.5 } } });
  assert.deepStrictEqual(uniform.output.padding, { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 });

  const disabled = load({ lilypond: { output: { padding: false } } });
  assert.deepStrictEqual(disabled.output.padding, { top: 0, right: 0, bottom: 0, left: 0 });
});

test('resolveExecutable: 绝对路径原样返回', () => {
  const abs = '/usr/local/bin/lilypond';
  assert.strictEqual(resolveExecutable({ executable: abs }, '/site'), abs);
});

test('resolveExecutable: 含斜杠相对路径相对站点根解析', () => {
  const r = resolveExecutable({ executable: 'bin/lilypond' }, '/site');
  assert.strictEqual(r, path.resolve('/site', 'bin/lilypond'));
});

test('resolveExecutable: 裸名原样返回', () => {
  assert.strictEqual(resolveExecutable({ executable: 'lilypond' }, '/site'), 'lilypond');
});
