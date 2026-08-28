'use strict';

function formatNumber(value) {
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

function replaceAttribute(tag, name, value) {
  const pattern = new RegExp('\\b' + name + '="[^"]*"');
  if (!pattern.test(tag)) {
    throw new Error('SVG root is missing ' + name);
  }
  return tag.replace(pattern, name + '="' + value + '"');
}

function side(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

// 扩展 LilyPond -dcrop 生成的紧边界 SVG。
// 物理尺寸和 viewBox 按同一比例增加，因此谱面本身的字号与比例不变。
function addPadding(source, paddingMm) {
  const padding = {
    top: side(paddingMm && paddingMm.top),
    right: side(paddingMm && paddingMm.right),
    bottom: side(paddingMm && paddingMm.bottom),
    left: side(paddingMm && paddingMm.left)
  };
  if (padding.top + padding.right + padding.bottom + padding.left === 0) {
    return source;
  }

  const rootMatch = source.match(/^\s*<svg\b[^>]*>/);
  if (!rootMatch) {
    throw new Error('SVG root not found');
  }

  const root = rootMatch[0];
  const widthMatch = root.match(/\bwidth="([0-9.]+)mm"/);
  const heightMatch = root.match(/\bheight="([0-9.]+)mm"/);
  const viewBoxMatch = root.match(/\bviewBox="([^"]+)"/);
  if (!widthMatch || !heightMatch || !viewBoxMatch) {
    throw new Error('SVG root must use millimetre width/height and a viewBox');
  }

  const widthMm = Number.parseFloat(widthMatch[1]);
  const heightMm = Number.parseFloat(heightMatch[1]);
  const viewBox = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
  if (
    !Number.isFinite(widthMm) ||
    !Number.isFinite(heightMm) ||
    widthMm <= 0 ||
    heightMm <= 0 ||
    viewBox.length !== 4 ||
    viewBox.some(value => !Number.isFinite(value)) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  ) {
    throw new Error('SVG dimensions are invalid');
  }

  const [x, y, width, height] = viewBox;
  const unitsPerMmX = width / widthMm;
  const unitsPerMmY = height / heightMm;
  const paddedWidthMm = widthMm + padding.left + padding.right;
  const paddedHeightMm = heightMm + padding.top + padding.bottom;
  const paddedViewBox = [
    x - padding.left * unitsPerMmX,
    y - padding.top * unitsPerMmY,
    width + (padding.left + padding.right) * unitsPerMmX,
    height + (padding.top + padding.bottom) * unitsPerMmY
  ];

  let paddedRoot = replaceAttribute(root, 'width', formatNumber(paddedWidthMm) + 'mm');
  paddedRoot = replaceAttribute(paddedRoot, 'height', formatNumber(paddedHeightMm) + 'mm');
  paddedRoot = replaceAttribute(paddedRoot, 'viewBox', paddedViewBox.map(formatNumber).join(' '));
  return source.replace(root, paddedRoot);
}

module.exports = { addPadding };
