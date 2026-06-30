(function () {
  const dom = {};
  function q(id) { return document.getElementById(id); }
  function qs(s) { return document.querySelectorAll(s); }

  dom.displayCanvas = q('mainCanvas');
  dom.displayCtx = dom.displayCanvas.getContext('2d');
  dom.wrapper = q('canvasWrapper');
  dom.placeholder = q('placeholder');
  dom.fileInput = q('fileInput');
  dom.colorSwatch = q('colorSwatch');
  dom.swatchHex = q('swatchHex');
  dom.hexValue = q('hexValue');
  dom.rgbValue = q('rgbValue');
  dom.hslValue = q('hslValue');
  dom.copyBtn = q('copyBtn');
  dom.historyList = q('historyList');
  dom.historyCount = q('historyCount');
  dom.clearBtn = q('clearHistoryBtn');
  dom.status = q('status');
  dom.tooltip = q('colorTooltip');
  dom.tooltipSwatch = q('tooltipSwatch');
  dom.tooltipHex = q('tooltipHex');
  dom.zoomLabel = q('zoomLabel');
  dom.magnifier = q('magnifier');
  dom.magCanvas = q('magnifierCanvas');
  dom.magCtx = dom.magCanvas.getContext('2d');
  dom.magHex = q('magnifierHex');
  dom.magCoord = q('magnifierCoord');
  dom.colorName = q('colorName');
  dom.colorNameVal = q('colorNameValue');
  dom.paletteSection = q('paletteSection');
  dom.dominantSection = q('dominantSection');
  dom.dominantList = q('dominantList');
  dom.ctxMenu = q('contextMenu');
  dom.exportModal = q('exportModal');
  dom.exportCode = q('exportCode');
  dom.exportCopyBtn = q('exportCopyBtn');
  dom.exportBtn = q('exportBtn');
  dom.helpModal = q('helpModal');
  dom.helpBtn = q('helpBtn');
  dom.closeHelpBtn = q('closeHelpBtn');
  dom.resetBtn = q('resetBtn');
  dom.dropOverlay = q('dropOverlay');
  dom.toast = q('toast');
  dom.favToggle = q('favToggle');
  dom.refreshDominant = q('refreshDominant');
  dom.sliderH = q('sliderH');
  dom.sliderS = q('sliderS');
  dom.sliderL = q('sliderL');
  dom.sliderValH = q('sliderValH');
  dom.sliderValS = q('sliderValS');
  dom.sliderValL = q('sliderValL');
  dom.hslSliders = q('hslSliders');

  const modeBtns = qs('.mode-btn');
  const sampleBtns = qs('.sample-btn');
  const copyMinis = qs('.copy-mini');
  const exportTabs = qs('.export-tab');

  let sourceImage, offscreenCanvas, offscreenCtx;
  let isImageLoaded = false, mode = 'click', isDragging = false;
  let dragStart = null, dragEnd = null;
  let history = [], imageRect = { x: 0, y: 0, w: 0, h: 0, baseScale: 1, scale: 1 };
  let currentColor = null, zoomLevel = 1;
  let canvasW = 0, canvasH = 0, dragCounter = 0;
  let sampleSize = 3, altHeld = false, favOnly = false;
  let dominantColors = [];

  const MAX_IMAGE_SIZE = 4096, ZOOM_MIN = 0.1, ZOOM_MAX = 20, ZOOM_STEP = 0.1;
  const HISTORY_MAX = 20, MAGNIFIER_SIZE = 7, DOMINANT_COLORS = 8;
  const STORAGE_KEY = 'color-recognizer-history', SELECTED_KEY = 'color-recognizer-selected', FAV_KEY = 'color-recognizer-favs';

  const COLOR_NAMES = [
    { n: '黑色 Black', r: 0, g: 0, b: 0 }, { n: '白色 White', r: 255, g: 255, b: 255 }, { n: '红色 Red', r: 255, g: 0, b: 0 },
    { n: '橙色 Orange', r: 255, g: 165, b: 0 }, { n: '黄色 Yellow', r: 255, g: 255, b: 0 }, { n: '绿色 Green', r: 0, g: 128, b: 0 },
    { n: '蓝色 Blue', r: 0, g: 0, b: 255 }, { n: '紫色 Purple', r: 128, g: 0, b: 128 }, { n: '灰色 Gray', r: 128, g: 128, b: 128 },
    { n: '青色 Cyan', r: 0, g: 255, b: 255 }, { n: '珊瑚红 Coral', r: 255, g: 127, b: 80 }, { n: '番茄红 Tomato', r: 255, g: 99, b: 71 },
    { n: '金橙色 Gold', r: 255, g: 215, b: 0 }, { n: '粉红 Pink', r: 255, g: 192, b: 203 }, { n: '紫罗兰 Violet', r: 238, g: 130, b: 238 },
    { n: '天蓝 SkyBlue', r: 135, g: 206, b: 235 }, { n: '海军蓝 Navy', r: 0, g: 0, b: 128 }, { n: '森林绿 ForestGreen', r: 34, g: 139, b: 34 },
    { n: '巧克力色 Chocolate', r: 210, g: 105, b: 30 }, { n: '象牙色 Ivory', r: 255, g: 255, b: 240 }, { n: '薰衣草 Lavender', r: 230, g: 230, b: 250 },
    { n: '米色 Beige', r: 245, g: 245, b: 220 }, { n: '栗色 Maroon', r: 128, g: 0, b: 0 }, { n: '橄榄色 Olive', r: 128, g: 128, b: 0 },
    { n: '深青色 Teal', r: 0, g: 128, b: 128 }, { n: '蓝紫 BlueViolet', r: 138, g: 43, b: 226 }, { n: '靛蓝 Indigo', r: 75, g: 0, b: 130 },
    { n: '钢蓝色 SteelBlue', r: 70, g: 130, b: 180 }, { n: '矢车菊蓝 CornflowerBlue', r: 100, g: 149, b: 237 },
    { n: '暗红 DarkRed', r: 139, g: 0, b: 0 }, { n: '暗绿 DarkGreen', r: 0, g: 100, b: 0 }, { n: '暗蓝 DarkBlue', r: 0, g: 0, b: 139 },
    { n: '暗灰 DimGray', r: 105, g: 105, b: 105 }, { n: '浅灰 LightGray', r: 211, g: 211, b: 211 }, { n: '暗橙红 DarkCoral', r: 205, g: 91, b: 69 },
    { n: '雪白 Snow', r: 255, g: 250, b: 250 }, { n: '浅黄 LightYellow', r: 255, g: 255, b: 224 }, { n: '天蓝 Azure', r: 240, g: 255, b: 255 },
    { n: '薄荷奶油 MintCream', r: 245, g: 255, b: 250 }, { n: '桃色 PeachPuff', r: 255, g: 218, b: 185 },
    { n: '小麦色 Wheat', r: 245, g: 222, b: 179 }, { n: '棕褐色 Tan', r: 210, g: 180, b: 140 }, { n: '沙色 SandyBrown', r: 244, g: 164, b: 96 },
    { n: '秋麒麟 Goldenrod', r: 218, g: 165, b: 32 }, { n: '深红 Crimson', r: 220, g: 20, b: 60 }, { n: '耐火砖 FireBrick', r: 178, g: 34, b: 34 },
    { n: '赤陶色 Terracotta', r: 204, g: 102, b: 51 }, { n: '铜色 Copper', r: 184, g: 115, b: 51 }, { n: '锈红 Rust', r: 183, g: 65, b: 14 },
    { n: '勃艮第酒红 Burgundy', r: 128, g: 0, b: 32 }, { n: '珊瑚粉 Salmon', r: 250, g: 128, b: 114 }, { n: '深粉红 DeepPink', r: 255, g: 20, b: 147 },
    { n: '绿宝石 Turquoise', r: 64, g: 224, b: 208 }, { n: '碧绿 Aquamarine', r: 127, g: 255, b: 212 }, { n: '春绿 SpringGreen', r: 0, g: 255, b: 127 },
    { n: '酸橙 LimeGreen', r: 50, g: 205, b: 50 }, { n: '草绿 LawnGreen', r: 124, g: 252, b: 0 }, { n: '黄绿 YellowGreen', r: 154, g: 205, b: 50 },
    { n: '海绿 SeaGreen', r: 46, g: 139, b: 87 }, { n: '石板灰 SlateGray', r: 112, g: 128, b: 144 }, { n: '暗石板灰 DarkSlateGray', r: 47, g: 79, b: 79 },
    { n: '白烟 WhiteSmoke', r: 245, g: 245, b: 245 }, { n: '老花色 OldLace', r: 253, g: 245, b: 230 }, { n: '亚麻色 Linen', r: 250, g: 240, b: 230 },
    { n: '古白 AntiqueWhite', r: 250, g: 235, b: 215 }, { n: '鹿皮色 Bisque', r: 255, g: 228, b: 196 }, { n: '纳瓦霍白 NavajoWhite', r: 255, g: 222, b: 173 },
    { n: '赭色 Sienna', r: 160, g: 82, b: 45 }, { n: '鞍棕色 SaddleBrown', r: 139, g: 69, b: 19 },
    { n: '棕色 Brown', r: 165, g: 42, b: 42 }, { n: '深棕 DarkBrown', r: 101, g: 55, b: 0 }, { n: '摩卡色 Mocha', r: 150, g: 100, b: 60 },
    { n: '原木色 Wood', r: 180, g: 140, b: 100 }, { n: '猩红 Scarlet', r: 255, g: 36, b: 0 }, { n: '胭脂红 Carmine', r: 150, g: 0, b: 24 },
    { n: '朱红 Vermilion', r: 227, g: 66, b: 52 }, { n: '紫红色 Fuchsia', r: 255, g: 0, b: 255 }, { n: '薰衣草腮红 LavenderBlush', r: 255, g: 240, b: 245 },
    { n: '淡粉 MistyRose', r: 255, g: 228, b: 225 }, { n: '贝壳 Seashell', r: 255, g: 245, b: 238 }, { n: '花白 FloralWhite', r: 255, g: 250, b: 240 }
  ];

  function findColorName(r, g, b) {
    let md = Infinity, best = null;
    for (const c of COLOR_NAMES) { const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2; if (d < md) { md = d; best = c; } }
    return best && md < 60000 ? best.n : null;
  }

  function rf() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (_) {} }
  function lf() { try { const d = localStorage.getItem(STORAGE_KEY); if (d) { const p = JSON.parse(d); if (Array.isArray(p)) { history.length = 0; history.forEach(() => history.shift()); p.slice(0, HISTORY_MAX).forEach(h => history.push(h)); } } } catch (_) {} }
  function ss(h, c) { try { localStorage.setItem(SELECTED_KEY, JSON.stringify({ hex: h, color: c })); } catch (_) {} }
  function ls() { try { const d = localStorage.getItem(SELECTED_KEY); if (d) { const p = JSON.parse(d); if (p && p.hex && p.color) return p; } } catch (_) {} return null; }
  function loadFavs() { try { const d = localStorage.getItem(FAV_KEY); return d ? JSON.parse(d) : []; } catch (_) { return []; } }
  function saveFavs(f) { try { localStorage.setItem(FAV_KEY, JSON.stringify(f)); } catch (_) {} }

  dom.magCanvas.width = MAGNIFIER_SIZE;
  dom.magCanvas.height = MAGNIFIER_SIZE;

  function init() {
    dom.magnifier.style.display = 'none';
    lf();
    setupCanvas();

    dom.helpModal.setAttribute('hidden', '');
    dom.exportModal.setAttribute('hidden', '');

    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('dragenter', dGrabEnter);
    document.addEventListener('dragover', dGrabOver);
    document.addEventListener('dragleave', dGrabLeave);
    document.addEventListener('drop', dGrabDrop);
    document.addEventListener('click', hideCtx);

    dom.wrapper.addEventListener('wheel', onWheel, { passive: false });
    dom.wrapper.addEventListener('contextmenu', onContextMenu);

    const cv = dom.displayCanvas;
    cv.addEventListener('click', onCanvasClick);
    cv.addEventListener('dblclick', resetZoom);
    cv.addEventListener('mousedown', onMouseDown);
    cv.addEventListener('mousemove', onMouseMove);
    cv.addEventListener('mouseup', onMouseUp);
    cv.addEventListener('mouseleave', onMouseLeave);
    cv.addEventListener('mouseenter', onMouseEnter);
    cv.addEventListener('touchstart', onTouchStart, { passive: false });
    cv.addEventListener('touchmove', onTouchMove, { passive: false });
    cv.addEventListener('touchend', onTouchEnd);
    cv.addEventListener('contextmenu', e => e.preventDefault());

    dom.fileInput.addEventListener('change', onFileSelect);
    q('pasteBtn').addEventListener('click', onPasteClick);

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.mode === 'eyedropper') {
          modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          mode = 'eyedropper';
          if (isImageLoaded) dom.status.textContent = '🔍 吸管模式：悬停即取色';
          return;
        }
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        updateStatus();
      });
    });

    sampleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sampleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sampleSize = parseInt(btn.dataset.size);
      });
    });

    dom.copyBtn.addEventListener('click', () => copyColor('hex'));
    copyMinis.forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); copyColor(btn.dataset.format); }); });

    dom.helpBtn.addEventListener('click', () => toggleModal(dom.helpModal));
    dom.closeHelpBtn.addEventListener('click', () => toggleModal(dom.helpModal));
    dom.helpModal.addEventListener('click', e => { if (e.target === dom.helpModal || e.target.closest('.help-modal-backdrop')) toggleModal(dom.helpModal); });

    dom.exportBtn.addEventListener('click', showExport);
    dom.exportCopyBtn.addEventListener('click', () => { if (dom.exportCode.textContent) { navigator.clipboard.writeText(dom.exportCode.textContent); showToast('代码已复制'); } });
    exportTabs.forEach(tab => { tab.addEventListener('click', () => { exportTabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); showExport(); }); });
    dom.exportModal.addEventListener('click', e => { if (e.target === dom.exportModal || e.target.closest('.help-modal-backdrop')) toggleModal(dom.exportModal); });

    dom.resetBtn.addEventListener('click', resetZoom);

    dom.clearBtn.addEventListener('click', () => {
      history = history.filter(h => h.fav);
      if (history.length === 0) { rf(); renderHistory(); showToast('已清空全部'); }
      else { rf(); renderHistory(); showToast('已清除非收藏记录'); }
    });

    dom.favToggle.addEventListener('click', () => {
      favOnly = !favOnly;
      dom.favToggle.classList.toggle('active');
      dom.favToggle.textContent = favOnly ? '★' : '☆';
      renderHistory();
    });

    dom.refreshDominant.addEventListener('click', extractDominantColors);

    [dom.sliderH, dom.sliderS, dom.sliderL].forEach(sl => {
      sl.addEventListener('input', onSliderChange);
    });

    renderHistory();
    const restored = ls();
    if (restored) {
      currentColor = restored.color;
      const { r, g, b } = restored.color;
      const hex = restored.hex;
      dom.colorSwatch.style.backgroundColor = hex;
      dom.swatchHex.textContent = hex.toUpperCase();
      dom.swatchHex.style.color = getContrastColor(restored.color);
      updateColorDisplay(restored.color);
    }
  }

  function toggleModal(m) {
    if (m.hasAttribute('hidden')) m.removeAttribute('hidden');
    else m.setAttribute('hidden', '');
  }

  function setupCanvas() {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(width * dpr), h = Math.floor(height * dpr);
        if (w !== canvasW || h !== canvasH) {
          canvasW = w; canvasH = h;
          dom.displayCanvas.width = w; dom.displayCanvas.height = h;
          if (isImageLoaded) { fitImage(); render(); updateStatus(); } else drawCheckerboard();
        }
      }
    });
    ro.observe(dom.wrapper);
  }

  function drawCheckerboard() {
    const ctx = dom.displayCtx;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#e8e8e8';
    const s = Math.max(8, Math.floor(canvasW / 80));
    for (let y = 0; y < canvasH; y += s) for (let x = 0; x < canvasW; x += s) if ((Math.floor(x / s) + Math.floor(y / s)) % 2 === 0) ctx.fillRect(x, y, s, s);
  }

  function onFileSelect(e) { const f = e.target.files[0]; if (f) loadImage(f); dom.fileInput.value = ''; }
  function loadImage(file) {
    if (!file.type.startsWith('image/')) { setStatus('不支持的格式'); return; }
    const r = new FileReader();
    r.onload = e => { const img = new Image(); img.onload = () => processImage(img); img.src = e.target.result; };
    r.readAsDataURL(file);
  }

  function onPasteClick() {
    navigator.clipboard.read().then(items => {
      for (const item of items) {
        const t = item.types.find(t => t.startsWith('image/'));
        if (t) { item.getType(t).then(blob => { const img = new Image(); img.onload = () => processImage(img); img.src = URL.createObjectURL(blob); }); return; }
      }
      showToast('剪贴板中没有图片');
    }).catch(() => showToast('请按 Ctrl+V 粘贴图片'));
  }

  function onPaste(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) { const blob = item.getAsFile(); if (!blob) continue; const img = new Image(); img.onload = () => processImage(img); img.src = URL.createObjectURL(blob); return; }
    }
  }

  function processImage(img) {
    sourceImage = img;
    let sw = img.width, sh = img.height;
    if (sw > MAX_IMAGE_SIZE || sh > MAX_IMAGE_SIZE) { const r = Math.min(MAX_IMAGE_SIZE / sw, MAX_IMAGE_SIZE / sh); sw = Math.round(sw * r); sh = Math.round(sh * r); }
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = sw; offscreenCanvas.height = sh;
    offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.drawImage(img, 0, 0, sw, sh);
    isImageLoaded = true; zoomLevel = 1;
    dom.placeholder.style.display = 'none'; dom.zoomLabel.hidden = false;
    fitImage(); render(); updateStatus();
    dom.displayCanvas.style.cursor = 'crosshair';
    setTimeout(() => { showToast('正在提取主色调…'); extractDominantColors(); }, 100);
  }

  function fitImage() {
    const iw = offscreenCanvas.width, ih = offscreenCanvas.height;
    const bs = Math.min(canvasW / iw, canvasH / ih, 1);
    const s = bs * zoomLevel;
    imageRect = { x: (canvasW - iw * s) / 2, y: (canvasH - ih * s) / 2, w: iw * s, h: ih * s, baseScale: bs, scale: s };
  }

  function render() {
    drawCheckerboard();
    if (!isImageLoaded) return;
    dom.displayCtx.drawImage(offscreenCanvas, imageRect.x, imageRect.y, imageRect.w, imageRect.h);
    if (isDragging && dragStart && dragEnd && mode === 'region') drawSelection();
    dom.zoomLabel.hidden = zoomLevel === 1;
    if (zoomLevel !== 1) dom.zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function inside(cx, cy) { return cx >= imageRect.x && cx <= imageRect.x + imageRect.w && cy >= imageRect.y && cy <= imageRect.y + imageRect.h; }
  function c2i(cx, cy) { return { x: Math.round((cx - imageRect.x) / imageRect.scale), y: Math.round((cy - imageRect.y) / imageRect.scale) }; }

  function gcc(e) {
    const rect = dom.displayCanvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * (canvasW / rect.width), y: (cy - rect.top) * (canvasH / rect.height) };
  }

  function getPixel(ix, iy) {
    if (!offscreenCtx) return null;
    ix = Math.max(0, Math.min(ix, offscreenCanvas.width - 1));
    iy = Math.max(0, Math.min(iy, offscreenCanvas.height - 1));
    const d = offscreenCtx.getImageData(ix, iy, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  }

  function rgb2h(r, g, b) { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }

  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      switch (mx) { case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break; case g: h = ((b - r) / d + 2) / 6; break; case b: h = ((r - g) / d + 4) / 6; break; }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hsl2rgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const h2 = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return { r: Math.round(h2(p, q, h + 1 / 3) * 255), g: Math.round(h2(p, q, h) * 255), b: Math.round(h2(p, q, h - 1 / 3) * 255) };
  }

  function gcs(color, fmt) {
    switch (fmt) {
      case 'hex': return rgb2h(color.r, color.g, color.b).toUpperCase();
      case 'rgb': return `rgb(${color.r}, ${color.g}, ${color.b})`;
      case 'hsl': { const h = rgb2hsl(color.r, color.g, color.b); return `hsl(${h.h}, ${h.s}%, ${h.l}%)`; }
    }
  }

  function updateColorDisplay(color) {
    const hex = rgb2h(color.r, color.g, color.b);
    const hsl = rgb2hsl(color.r, color.g, color.b);
    dom.hexValue.textContent = hex.toUpperCase();
    dom.rgbValue.textContent = `rgb(${color.r}, ${color.g}, ${color.b})`;
    dom.hslValue.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const nm = findColorName(color.r, color.g, color.b);
    if (nm) { dom.colorName.hidden = false; dom.colorNameVal.textContent = nm; } else dom.colorName.hidden = true;

    dom.sliderH.value = hsl.h; dom.sliderValH.textContent = hsl.h;
    dom.sliderS.value = hsl.s; dom.sliderValS.textContent = hsl.s;
    dom.sliderL.value = hsl.l; dom.sliderValL.textContent = hsl.l;

    updatePalette(color);
  }

  function updatePalette(color) {
    const hsl = rgb2hsl(color.r, color.g, color.b);
    dom.paletteSection.hidden = false;
    renderPalette('paletteComplementary', [gcs(hsl2rgb((hsl.h + 180) % 360, hsl.s, hsl.l), 'hex')]);
    renderPalette('paletteAnalogous', [gcs(hsl2rgb((hsl.h + 30) % 360, hsl.s, hsl.l), 'hex'), gcs(hsl2rgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l), 'hex')]);
    renderPalette('paletteTriadic', [gcs(hsl2rgb((hsl.h + 120) % 360, hsl.s, hsl.l), 'hex'), gcs(hsl2rgb((hsl.h + 240) % 360, hsl.s, hsl.l), 'hex')]);
  }

  function renderPalette(id, hexes) {
    const c = document.getElementById(id).querySelector('.palette-colors');
    c.innerHTML = '';
    hexes.forEach(h => {
      const el = document.createElement('div');
      el.className = 'palette-swatch'; el.style.backgroundColor = h; el.dataset.hex = h.toUpperCase();
      el.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(h.toUpperCase()); showToast(`已复制 ${h.toUpperCase()}`); });
      c.appendChild(el);
    });
  }

  function extractDominantColors() {
    if (!offscreenCtx) return;
    dom.dominantList.innerHTML = '<p class="empty-hint" style="font-size:11px">提取中…</p>';
    dom.dominantSection.hidden = false;

    setTimeout(() => {
      const w = offscreenCanvas.width, h = offscreenCanvas.height;
      const step = Math.max(1, Math.floor(Math.sqrt(w * h / 5000)));
      const data = offscreenCtx.getImageData(0, 0, w, h).data;
      const buckets = {};

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const key = `${r},${g},${b}`;
          if (buckets[key]) { buckets[key].count++; } else { buckets[key] = { r: data[i], g: data[i + 1], b: data[i + 2], count: 1 }; }
        }
      }

      const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
      dominantColors = sorted.slice(0, DOMINANT_COLORS);

      dom.dominantList.innerHTML = '';
      dominantColors.forEach(c => {
        const hex = rgb2h(c.r, c.g, c.b);
        const el = document.createElement('div');
        el.className = 'dominant-item'; el.style.backgroundColor = hex; el.dataset.hex = hex.toUpperCase();
        el.addEventListener('click', () => { navigator.clipboard.writeText(hex.toUpperCase()); showToast(`已复制 ${hex.toUpperCase()}`); });
        dom.dominantList.appendChild(el);
      });
      showToast('主色调提取完成');
    }, 50);
  }

  function onCanvasClick(e) {
    if (!isImageLoaded || mode === 'eyedropper') return;
    if (mode !== 'click') return;
    const pos = gcc(e);
    if (!inside(pos.x, pos.y)) return;
    const ic = c2i(pos.x, pos.y);
    const color = getPixel(ic.x, ic.y);
    if (color) { selectColor(color); showTooltip(pos.x, pos.y, color); }
  }

  function onMouseDown(e) {
    if (!isImageLoaded || mode !== 'region') return;
    const pos = gcc(e);
    if (!inside(pos.x, pos.y)) return;
    isDragging = true; dragStart = { x: pos.x, y: pos.y }; dragEnd = { x: pos.x, y: pos.y };
  }

  function onMouseMove(e) {
    if (!isImageLoaded) return;
    const pos = gcc(e);
    const inn = inside(pos.x, pos.y);
    dom.displayCanvas.style.cursor = inn ? 'crosshair' : 'default';

    if (isDragging && mode === 'region') { dragEnd = { x: pos.x, y: pos.y }; render(); }

    if (inn) {
      const ic = c2i(pos.x, pos.y);
      const color = getPixel(ic.x, ic.y);
      if (color) {
        dom.magnifier.style.display = 'flex';
        updateMag(e, color, ic);
        if (mode === 'eyedropper' || altHeld) {
          selectColor(color);
          showTooltip(pos.x, pos.y, color);
          dom.status.textContent = `🔍 ${gcs(color, 'hex')} · (${ic.x}, ${ic.y})`;
        } else {
          updateHover(ic, color);
        }
      }
    } else {
      dom.magnifier.style.display = 'none';
    }
  }

  function onMouseEnter(e) {
    if (!isImageLoaded) return;
    const pos = gcc(e);
    dom.magnifier.style.display = inside(pos.x, pos.y) ? 'flex' : 'none';
  }

  function onMouseLeave() {
    if (isDragging && mode === 'region') { isDragging = false; dragStart = null; dragEnd = null; render(); }
    dom.magnifier.style.display = 'none';
  }

  function onMouseUp() {
    if (!isDragging || mode !== 'region') return;
    isDragging = false;
    if (!dragStart || !dragEnd) return;
    const x1 = Math.min(dragStart.x, dragEnd.x), y1 = Math.min(dragStart.y, dragEnd.y);
    const x2 = Math.max(dragStart.x, dragEnd.x), y2 = Math.max(dragStart.y, dragEnd.y);
    const p1 = c2i(x1, y1), p2 = c2i(x2, y2);
    const avg = getRegionAvg(p1.x, p1.y, p2.x, p2.y);
    if (avg) { selectColor(avg); showTooltip((x1 + x2) / 2, (y1 + y2) / 2, avg); }
    dragStart = null; dragEnd = null; render();
  }

  function onTouchStart(e) { e.preventDefault(); const t = e.touches[0]; dom.displayCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY })); }
  function onTouchMove(e) { e.preventDefault(); const t = e.touches[0]; dom.displayCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY })); }
  function onTouchEnd(e) {
    dom.displayCanvas.dispatchEvent(new MouseEvent('mouseup', {}));
    const t = e.changedTouches[0];
    dom.displayCanvas.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY }));
  }

  function getRegionAvg(ix1, iy1, ix2, iy2) {
    if (!offscreenCtx) return null;
    ix1 = Math.max(0, Math.min(ix1, offscreenCanvas.width - 1));
    iy1 = Math.max(0, Math.min(iy1, offscreenCanvas.height - 1));
    ix2 = Math.max(0, Math.min(ix2, offscreenCanvas.width - 1));
    iy2 = Math.max(0, Math.min(iy2, offscreenCanvas.height - 1));
    const w = ix2 - ix1 + 1, h = iy2 - iy1 + 1;
    if (w <= 0 || h <= 0) return null;
    const d = offscreenCtx.getImageData(ix1, iy1, w, h).data;
    const c = w * h; let tr = 0, tg = 0, tb = 0;
    for (let i = 0; i < c; i++) { tr += d[i * 4]; tg += d[i * 4 + 1]; tb += d[i * 4 + 2]; }
    return { r: Math.round(tr / c), g: Math.round(tg / c), b: Math.round(tb / c) };
  }

  function drawSelection() {
    if (!dragStart || !dragEnd) return;
    const x = Math.min(dragStart.x, dragEnd.x), y = Math.min(dragStart.y, dragEnd.y);
    const w = Math.abs(dragEnd.x - dragStart.x), h = Math.abs(dragEnd.y - dragStart.y);
    const ctx = dom.displayCtx;
    ctx.fillStyle = 'rgba(0,229,255,0.06)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
    ctx.fillStyle = '#00e5ff'; ctx.font = '12px sans-serif';
    ctx.fillText(`${Math.round(w / imageRect.scale)}×${Math.round(h / imageRect.scale)}`, x + 6, y - 6);
  }

  function selectColor(color) {
    currentColor = color;
    const hex = rgb2h(color.r, color.g, color.b);
    dom.colorSwatch.style.backgroundColor = hex;
    dom.swatchHex.textContent = hex.toUpperCase();
    dom.swatchHex.style.color = getContrastColor(color);
    updateColorDisplay(color);
    dom.copyBtn.querySelector('.btn-text').textContent = '复制色号';
    dom.copyBtn.style.background = '';
    addHistory(hex, color);
    ss(hex, color);
    updateStatus();
  }

  function getContrastColor(color) { const l = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255; return l > 0.5 ? '#1a1f2e' : '#e8eaed'; }

  function updateMag(e, color, ic) {
    const rect = dom.displayCanvas.getBoundingClientRect();
    const cx = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    dom.magnifier.style.left = cx + 'px'; dom.magnifier.style.top = cy + 'px';
    const half = Math.floor(MAGNIFIER_SIZE / 2);
    const d = offscreenCtx.getImageData(Math.max(0, ic.x - half), Math.max(0, ic.y - half), MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    dom.magCtx.putImageData(d, 0, 0);
    dom.magHex.textContent = rgb2h(color.r, color.g, color.b).toUpperCase();
    dom.magCoord.textContent = `(${ic.x}, ${ic.y})`;
  }

  function updateHover(ic, color) { if (currentColor) return; dom.status.textContent = `(${ic.x}, ${ic.y}) · ${rgb2h(color.r, color.g, color.b).toUpperCase()}`; }

  function showTooltip(cx, cy, color) {
    const hex = rgb2h(color.r, color.g, color.b);
    dom.tooltipSwatch.style.backgroundColor = hex;
    dom.tooltipHex.textContent = hex.toUpperCase();
    const ww = dom.wrapper.getBoundingClientRect().width;
    const wh = dom.wrapper.getBoundingClientRect().height;
    dom.tooltip.style.left = (ww / 2) + 'px';
    dom.tooltip.style.top = (wh * 0.6) + 'px';
    dom.tooltip.style.transform = 'translate(-50%, -50%)';
    dom.tooltip.style.display = 'flex';
    clearTimeout(dom.tooltip._hideTimer);
    dom.tooltip._hideTimer = setTimeout(() => { dom.tooltip.style.display = 'none'; }, 2000);
  }

  function addHistory(hex, color) {
    if (history.length > 0 && history[history.length - 1].hex === hex) return;
    const favs = loadFavs();
    const isFav = favs.includes(hex);
    history.push({ hex, color: { r: color.r, g: color.g, b: color.b }, fav: isFav });
    if (history.length > HISTORY_MAX) history.shift();
    rf(); renderHistory();
  }

  function toggleFav(index, e) {
    e.stopPropagation();
    history[index].fav = !history[index].fav;
    const favs = history.filter(h => h.fav).map(h => h.hex);
    saveFavs(favs);
    renderHistory();
  }

  function renderHistory() {
    const items = favOnly ? history.filter(h => h.fav) : history;
    dom.historyCount.textContent = `${items.length}/${HISTORY_MAX}`;
    if (items.length === 0) {
      dom.historyList.innerHTML = `<p class="empty-hint">${favOnly ? '暂无收藏' : '暂无记录'}</p>`;
      dom.clearBtn.classList.add('hidden');
      return;
    }
    dom.clearBtn.classList.remove('hidden');
    dom.historyList.innerHTML = '';
    items.forEach((item, idx) => {
      const realIdx = history.indexOf(item);
      const wrapper = document.createElement('div');
      wrapper.className = 'history-item';
      wrapper.style.backgroundColor = item.hex;
      wrapper.dataset.hex = item.hex.toUpperCase();

      const del = document.createElement('button');
      del.className = 'delete-btn'; del.textContent = '×';
      del.addEventListener('click', e => { e.stopPropagation(); history.splice(realIdx, 1); rf(); renderHistory(); });

      const fav = document.createElement('button');
      fav.className = 'fav-btn' + (item.fav ? ' favorited' : '');
      fav.textContent = item.fav ? '★' : '☆';
      fav.addEventListener('click', e => toggleFav(realIdx, e));

      wrapper.appendChild(del);
      wrapper.appendChild(fav);
      wrapper.addEventListener('click', () => {
        const c = item.color;
        currentColor = { r: c.r, g: c.g, b: c.b };
        dom.colorSwatch.style.backgroundColor = item.hex;
        dom.swatchHex.textContent = item.hex.toUpperCase();
        dom.swatchHex.style.color = getContrastColor(c);
        updateColorDisplay(c);
        dom.copyBtn.querySelector('.btn-text').textContent = '复制色号';
        dom.copyBtn.style.background = '';
        ss(item.hex, c);
      });
      dom.historyList.appendChild(wrapper);
    });
  }

  function copyColor(fmt) {
    if (!currentColor) { setStatus('还没有取色'); return; }
    const text = gcs(currentColor, fmt);
    navigator.clipboard.writeText(text).then(() => {
      const labels = { hex: 'HEX', rgb: 'RGB', hsl: 'HSL' };
      dom.copyBtn.querySelector('.btn-text').textContent = `✅ ${labels[fmt]} 已复制`;
      dom.copyBtn.style.background = '#0d7377';
      setStatus(`已复制: ${text}`);
      setTimeout(() => { dom.copyBtn.querySelector('.btn-text').textContent = '复制色号'; dom.copyBtn.style.background = ''; }, 2000);
    }).catch(() => setStatus('复制失败'));
  }

  function resetZoom() { if (!isImageLoaded) return; if (zoomLevel !== 1) { zoomLevel = 1; fitImage(); render(); updateStatus(); showToast('已重置缩放'); } }

  function onSliderChange() {
    if (!currentColor) return;
    const h = parseInt(dom.sliderH.value), s = parseInt(dom.sliderS.value), l = parseInt(dom.sliderL.value);
    dom.sliderValH.textContent = h; dom.sliderValS.textContent = s; dom.sliderValL.textContent = l;
    const rgb = hsl2rgb(h, s, l);
    currentColor = rgb;
    const hex = rgb2h(rgb.r, rgb.g, rgb.b);
    dom.colorSwatch.style.backgroundColor = hex;
    dom.swatchHex.textContent = hex.toUpperCase();
    dom.swatchHex.style.color = getContrastColor(rgb);
    updateColorDisplay(rgb);
    dom.status.textContent = `微调中 · ${hex.toUpperCase()}`;
  }

  function showExport() {
    if (!currentColor) { showToast('还没有取色'); return; }
    const active = document.querySelector('.export-tab.active');
    const type = active ? active.dataset.type : 'css';
    const all = [currentColor, ...history.map(h => h.color).slice(0, 9)];
    const hexes = all.map(c => gcs(c, 'hex'));

    let code = '';
    switch (type) {
      case 'css':
        code = ':root {\n';
        hexes.forEach((h, i) => { code += `  --color-${i + 1}: ${h};\n`; });
        code += '}';
        break;
      case 'tailwind':
        code = '@theme {\n';
        hexes.forEach((h, i) => { code += `  --color-${i + 1}: ${h};\n`; });
        code += '}';
        break;
      case 'scss':
        hexes.forEach((h, i) => { code += `$${i === 0 ? 'primary' : 'color-' + (i + 1)}: ${h};\n`; });
        break;
    }
    dom.exportCode.textContent = code;
    toggleModal(dom.exportModal);
  }

  function onWheel(e) {
    if (!isImageLoaded) return; e.preventDefault();
    const d = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const n = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevel + d));
    if (n !== zoomLevel) { zoomLevel = n; fitImage(); render(); updateStatus(); }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (isDragging) { isDragging = false; dragStart = null; dragEnd = null; render(); return; }
      if (!dom.helpModal.hasAttribute('hidden')) { toggleModal(dom.helpModal); return; }
      if (!dom.exportModal.hasAttribute('hidden')) { toggleModal(dom.exportModal); return; }
      dom.ctxMenu.setAttribute('hidden', '');
      return;
    }
    if (e.key === '?' || (e.key === '/')) { toggleModal(dom.helpModal); return; }
    if (e.key === 'Alt') { altHeld = true; if (isImageLoaded) { dom.status.textContent = '🔍 按住 Alt：吸管模式'; } return; }

    if (!isImageLoaded) return;
    if (e.key === '0' && !e.ctrlKey && !e.metaKey) { resetZoom(); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); const n = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP); if (n !== zoomLevel) { zoomLevel = n; fitImage(); render(); updateStatus(); } return; }
    if (e.key === '-') { e.preventDefault(); const n = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP); if (n !== zoomLevel) { zoomLevel = n; fitImage(); render(); updateStatus(); } return; }
    if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) { copyColor('hex'); return; }
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) { extractDominantColors(); return; }
  }

  function onKeyUp(e) {
    if (e.key === 'Alt') {
      altHeld = false;
      if (isImageLoaded) updateStatus();
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
    dom.ctxMenu.style.left = (e.clientX - dom.wrapper.getBoundingClientRect().left) + 'px';
    dom.ctxMenu.style.top = (e.clientY - dom.wrapper.getBoundingClientRect().top) + 'px';
    dom.ctxMenu.removeAttribute('hidden');
  }

  function hideCtx() { dom.ctxMenu.setAttribute('hidden', ''); }

  document.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      dom.ctxMenu.setAttribute('hidden', '');
      switch (item.dataset.action) {
        case 'copy': if (currentColor) copyColor('hex'); break;
        case 'reset': resetZoom(); break;
        case 'dominant': extractDominantColors(); break;
      }
    });
  });

  function dGrabEnter(e) { e.preventDefault(); dragCounter++; if (dragCounter === 1) dom.dropOverlay.classList.add('active'); }
  function dGrabOver(e) { e.preventDefault(); }
  function dGrabLeave(e) { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dom.dropOverlay.classList.remove('active'); } }
  function dGrabDrop(e) { e.preventDefault(); dragCounter = 0; dom.dropOverlay.classList.remove('active'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) loadImage(f); else showToast('请拖入图片文件'); }

  function updateStatus() {
    if (!isImageLoaded) { dom.status.textContent = '就绪'; return; }
    const parts = [`${offscreenCanvas.width}×${offscreenCanvas.height}`];
    if (mode === 'click') parts.push('点击取色');
    else if (mode === 'eyedropper') parts.push('🔍 吸管取色');
    else parts.push('区域取色');
    if (zoomLevel !== 1) parts.push(`${Math.round(zoomLevel * 100)}%`);
    if (currentColor) parts.push(gcs(currentColor, 'hex'));
    dom.status.textContent = parts.join(' · ');
  }

  function setStatus(msg) { dom.status.textContent = msg; }

  let tt = null;
  function showToast(msg) { dom.toast.textContent = msg; dom.toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => dom.toast.classList.remove('show'), 3000); }

  document.addEventListener('DOMContentLoaded', init);
})();
