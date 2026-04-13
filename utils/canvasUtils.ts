import { Frame, TextConfig, PhotoConfig, HighlightRange, SpacingAdjustment } from '../types';
import { DEFAULT_FRAME } from '../constants';

/**
 * Detects a transparent or white frame in the template image.
 * Returns frame coordinates and whether it is transparent or opaque.
 */
export const detectFrame = (
  img: HTMLImageElement, 
  canvasWidth: number, 
  canvasHeight: number
): Frame => {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return DEFAULT_FRAME;

  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const { data, width, height } = imageData;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasTransparency = false;

  const step = 5; 
  for (let y = 0; y < height * 0.7; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 250) { 
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasTransparency = true;
      }
    }
  }

  if (!hasTransparency || (maxX - minX < 100)) {
    minX = width; minY = height; maxX = 0; maxY = 0;
    let foundWhite = false;
    for (let y = 0; y < height * 0.6; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 250 && g > 250 && b > 250) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            foundWhite = true;
        }
      }
    }
    if (!foundWhite && !hasTransparency) return DEFAULT_FRAME;
  }

  if (maxX <= minX || maxY <= minY || (maxX - minX < 100)) return DEFAULT_FRAME;

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    isTransparent: hasTransparency
  };
};

const ensureFontLoaded = async (fontName: string) => {
    try {
        await document.fonts.ready;
        return document.fonts.check(`12px "${fontName}"`);
    } catch (e) {
        return false;
    }
}

/**
 * Splits text into lines based ONLY on user-entered newlines.
 * Ensures metadata (highlights, spacing) maps correctly to lines.
 */
const splitLinesStrict = (text: string, highlights: HighlightRange[], spacing: SpacingAdjustment[], maxLines: number) => {
  const sourceLines = text.split('\n').slice(0, maxLines);
  const result = [];
  let currentOffset = 0;

  for (const lineText of sourceLines) {
    const startIdx = text.indexOf(lineText, currentOffset);
    const endIdx = startIdx + lineText.length;
    
    const lineHighlights = highlights
      .filter(h => h.start < endIdx && h.end > startIdx)
      .map(h => ({
        start: Math.max(0, h.start - startIdx),
        end: Math.min(lineText.length, h.end - startIdx),
        color: h.color
      }));

    const lineSpacing = (spacing || [])
      .filter(s => s.start < endIdx && s.end > startIdx)
      .map(s => ({
        start: Math.max(0, s.start - startIdx),
        end: Math.min(lineText.length, s.end - startIdx),
        value: s.value
      }));

    result.push({ text: lineText, highlights: lineHighlights, spacing: lineSpacing });
    currentOffset = endIdx + 1;
  }
  return result;
};

const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
  switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
  }
  return c;
});

/**
 * Renders a single line into SVG fragments, handling highlighting, spacing, and indicators.
 * Uses dx for reliable gap tightening in SVG.
 */
const generateLineFragments = (
    line: { text: string; highlights: HighlightRange[]; spacing: SpacingAdjustment[] },
    showIndicators: boolean
) => {
  const points = new Set<number>([0, line.text.length]);
  line.highlights.forEach(h => { points.add(h.start); points.add(h.end); });
  line.spacing.forEach(s => { points.add(s.start); points.add(s.end); });
  
  const sortedPoints = Array.from(points).sort((a, b) => a - b);
  let result = '';

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start === end) continue;

    const segment = line.text.substring(start, end);
    const h = line.highlights.find(range => start >= range.start && end <= range.end);
    const s = line.spacing.find(adj => start >= adj.start && end <= adj.end);

    let styleStr = '';
    if (h) styleStr += `fill: ${h.color};`;
    
    // Fix: Use dx attribute for spacing. Negative dx pulls subsequent text left.
    let dxAttr = '';
    if (s && segment.includes(' ')) {
        dxAttr = ` dx="${s.value}em"`;
    }

    if (styleStr || dxAttr) {
        result += `<tspan style="${styleStr}"${dxAttr}>${escapeXml(segment)}</tspan>`;
    } else {
        result += `<tspan>${escapeXml(segment)}</tspan>`;
    }

    // Visual indicator: hovering vertical bar
    if (s && showIndicators && segment.includes(' ')) {
        // dy lifts the bar, then second dy resets the baseline
        // dx is used to prevent the bar itself from consuming space
        result += `<tspan dy="-0.6em" dx="-0.1em" font-size="12" fill="#ffd700" fill-opacity="0.7" font-family="sans-serif">|</tspan><tspan dy="0.6em" dx="0.1em"></tspan>`;
    }
  }

  return result || `<tspan>${escapeXml(line.text)}</tspan>`;
};

const drawTextLayer = async (
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  cw: number,
  ch: number,
  frameEndY: number
): Promise<void> => {
  const { 
    content, 
    fontFamily, 
    lineHeight, 
    textAlign = 'center', 
    color = '#ffffff', 
    x = 0, 
    y = 0,
    maxLines = 3,
    highlights = [],
    spacingAdjustments = [],
    showGapIndicators = false
  } = config;
  
  if (!content.trim()) return;

  await ensureFontLoaded(fontFamily);

  const paddingX = 60;
  const bottomPadding = 40;
  const textAreaY = frameEndY + 20; 
  const textAreaHeight = ch - textAreaY - bottomPadding; 
  const textAreaWidth = cw - (paddingX * 2);

  const linesData = splitLinesStrict(content, highlights, spacingAdjustments, maxLines);
  
  // No auto-fitting: currentFontSize is directly taken from config.fontSize.
  const currentFontSize = config.fontSize;

  const totalTextHeight = linesData.length * currentFontSize * lineHeight;
  const startYOffset = (textAreaHeight - totalTextHeight) / 2;

  let xPosValue = cw / 2;
  let textAnchor = 'middle';
  if (textAlign === 'right') { xPosValue = cw - paddingX; textAnchor = 'end'; }
  else if (textAlign === 'left') { xPosValue = paddingX; textAnchor = 'start'; }

  const linesSvg = linesData.map((line, i) => {
    const yPos = textAreaY + startYOffset + (i * currentFontSize * lineHeight) + (currentFontSize * 0.85);
    return `<text x="${xPosValue}" y="${yPos}" text-anchor="${textAnchor}" fill="${color}" direction="rtl">${generateLineFragments(line, showGapIndicators)}</text>`;
  }).join('');

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">
      <style>
        text { 
          font-family: '${fontFamily}', 'Urdu Najd V3', 'UrduNajd', 'Noto Nastaliq Urdu', serif; 
          font-size: ${currentFontSize}px; 
          font-weight: ${fontFamily === 'Urdu Najd V3' ? 900 : 700};
        }
      </style>
      <g transform="translate(${x}, ${y})">
        ${linesSvg}
      </g>
    </svg>
  `;

  const img = new Image();
  img.crossOrigin = "anonymous";
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (err) => {
      console.error("SVG Render Error", err);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
};

export const renderCanvas = async (
  canvas: HTMLCanvasElement,
  templateImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null,
  frame: Frame,
  textConfig: TextConfig,
  photoConfig: PhotoConfig
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const drawPhoto = () => {
    if (photoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(frame.x, frame.y, frame.w, frame.h);
        ctx.clip();
    
        const imgRatio = photoImg.width / photoImg.height;
        const frameRatio = frame.w / frame.h;
        
        let renderW, renderH;
    
        if (imgRatio > frameRatio) {
          renderH = frame.h;
          renderW = frame.h * imgRatio;
        } else {
          renderW = frame.w;
          renderH = frame.w / imgRatio;
        }
    
        const centerX = frame.x + frame.w / 2;
        const centerY = frame.y + frame.h / 2;
        
        ctx.translate(centerX + photoConfig.x, centerY + photoConfig.y);
        ctx.scale(photoConfig.zoom, photoConfig.zoom);
        ctx.drawImage(photoImg, -renderW / 2, -renderH / 2, renderW, renderH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Upload Photo', frame.x + frame.w / 2, frame.y + frame.h / 2);
      }
  };

  const drawTemplate = () => {
    if (templateImg) {
        ctx.drawImage(templateImg, 0, 0, width, height);
    } else {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(0,0, width, height);
    }
  };

  if (frame.isTransparent) {
      drawPhoto();
      drawTemplate();
  } else {
      drawTemplate();
      drawPhoto();
  }

  if (templateImg || textConfig.content) {
      await drawTextLayer(ctx, textConfig, width, height, frame.y + frame.h);
  }
};