const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const root = path.resolve(__dirname, '..');
const orange = '#FF6B35';

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function drawCenteredText(ctx, text, width, height, options) {
  const {
    color,
    fontFamily = 'Arial',
    fontWeight = 'bold',
    maxWidthRatio = 0.78,
    initialFontSize,
  } = options;

  let fontSize = initialFontSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;

  do {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    if (ctx.measureText(text).width <= width * maxWidthRatio) break;
    fontSize -= 8;
  } while (fontSize > 24);

  ctx.fillText(text, width / 2, height / 2);
}

function savePng(filePath, width, height, draw) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  ensureDir(filePath);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log(`Generated ${path.relative(root, filePath)} (${width}x${height})`);
}

function drawIcon(ctx, width, height) {
  ctx.fillStyle = orange;
  ctx.fillRect(0, 0, width, height);
  drawCenteredText(ctx, 'DQ', width, height, {
    color: '#FFFFFF',
    initialFontSize: Math.floor(width * 0.36),
    maxWidthRatio: 0.72,
  });
}

savePng(path.join(root, 'assets/images/icons/icon.png'), 1024, 1024, drawIcon);

savePng(path.join(root, 'assets/images/icons/splash.png'), 1284, 2778, (ctx, width, height) => {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  drawCenteredText(ctx, 'DishQuest', width, height, {
    color: orange,
    initialFontSize: 168,
    maxWidthRatio: 0.76,
  });
});

savePng(path.join(root, 'assets/images/android-icon-foreground.png'), 1024, 1024, drawIcon);