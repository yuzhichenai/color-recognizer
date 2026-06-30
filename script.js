(function () {
  const displayCanvas = document.getElementById('mainCanvas');
  const displayCtx = displayCanvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const placeholder = document.getElementById('placeholder');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const colorSwatch = document.getElementById('colorSwatch');
  const swatchHex = document.getElementById('swatchHex');
  const hexValue = document.getElementById('hexValue');
  const rgbValue = document.getElementById('rgbValue');
  const formatLabel = document.getElementById('formatLabel');
  const copyBtn = document.getElementById('copyBtn');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const status = document.getElementById('status');
  const colorTooltip = document.getElementById('colorTooltip');
  const tooltipSwatch = document.getElementById('tooltipSwatch');
  const tooltipHex = document.getElementById('tooltipHex');
  const zoomLabel = document.getElementById('zoomLabel');
  const magnifier = document.getElementById('magnifier');
  const magnifierCanvas = document.getElementById('magnifierCanvas');
  const magnifierCtx = magnifierCanvas.getContext('2d');
  const magnifierHex = document.getElementById('magnifierHex');
  const magnifierCoord = document.getElementById('magnifierCoord');
  const colorName = document.getElementById('colorName');
  const colorNameValue = document.getElementById('colorNameValue');
  const dropOverlay = document.getElementById('dropOverlay');
  const toast = document.getElementById('toast');
  const modeBtns = document.querySelectorAll('.mode-btn');

  let sourceImage = null;
  let offscreenCanvas = null;
  let offscreenCtx = null;
  let isImageLoaded = false;
  let mode = 'click';
  let isDragging = false;
  let dragStart = null;
  let dragEnd = null;
  let history = [];
  let imageRect = { x: 0, y: 0, w: 0, h: 0, baseScale: 1, scale: 1 };
  let currentColor = null;
  let zoomLevel = 1;
  let colorFormat = 'hex';
  let canvasW = 0;
  let canvasH = 0;
  let dragCounter = 0;
  let lastHoverColor = null;

  const MAX_IMAGE_SIZE = 4096;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 20;
  const ZOOM_STEP = 0.1;
  const STORAGE_KEY = 'color-recognizer-history';
  const SELECTED_KEY = 'color-recognizer-selected';
  const HISTORY_MAX = 20;
  const MAGNIFIER_SIZE = 7;
  const PIXEL_SCALE = 12;

  const COLOR_NAMES = [
    { name: '黑色 Black', r: 0, g: 0, b: 0 },
    { name: '白色 White', r: 255, g: 255, b: 255 },
    { name: '红色 Red', r: 255, g: 0, b: 0 },
    { name: '橙色 Orange', r: 255, g: 165, b: 0 },
    { name: '黄色 Yellow', r: 255, g: 255, b: 0 },
    { name: '绿色 Green', r: 0, g: 128, b: 0 },
    { name: '蓝色 Blue', r: 0, g: 0, b: 255 },
    { name: '紫色 Purple', r: 128, g: 0, b: 128 },
    { name: '灰色 Gray', r: 128, g: 128, b: 128 },
    { name: '银色 Silver', r: 192, g: 192, b: 192 },
    { name: '栗色 Maroon', r: 128, g: 0, b: 0 },
    { name: '橄榄色 Olive', r: 128, g: 128, b: 0 },
    { name: '深青色 Teal', r: 0, g: 128, b: 128 },
    { name: '藏青色 Navy', r: 0, g: 0, b: 128 },
    { name: '紫红色 Fuchsia', r: 255, g: 0, b: 255 },
    { name: '青色 Cyan', r: 0, g: 255, b: 255 },
    { name: '珊瑚红 Coral', r: 255, g: 127, b: 80 },
    { name: '番茄红 Tomato', r: 255, g: 99, b: 71 },
    { name: '金橙色 Gold', r: 255, g: 215, b: 0 },
    { name: '橙红色 OrangeRed', r: 255, g: 69, b: 0 },
    { name: '暗红色 DarkRed', r: 139, g: 0, b: 0 },
    { name: '印度红 IndianRed', r: 205, g: 92, b: 92 },
    { name: '浅珊瑚 LightCoral', r: 240, g: 128, b: 128 },
    { name: '三文鱼 Salmon', r: 250, g: 128, b: 114 },
    { name: '暗三文鱼 DarkSalmon', r: 233, g: 150, b: 122 },
    { name: '亮三文鱼 LightSalmon', r: 255, g: 160, b: 122 },
    { name: '深粉红 DeepPink', r: 255, g: 20, b: 147 },
    { name: '粉红 Pink', r: 255, g: 192, b: 203 },
    { name: '浅粉红 LightPink', r: 255, g: 182, b: 193 },
    { name: '热粉红 HotPink', r: 255, g: 105, b: 180 },
    { name: '淡紫红 PaleVioletRed', r: 219, g: 112, b: 147 },
    { name: '中紫红 MediumVioletRed', r: 199, g: 21, b: 133 },
    { name: '淡珊瑚 PaleCoral', r: 240, g: 128, b: 128 },
    { name: '玫瑰棕 RosyBrown', r: 188, g: 143, b: 143 },
    { name: '雪白 Snow', r: 255, g: 250, b: 250 },
    { name: '蜜瓜色 Honeydew', r: 240, g: 255, b: 240 },
    { name: '薄荷奶油 MintCream', r: 245, g: 255, b: 250 },
    { name: '天蓝 Azure', r: 240, g: 255, b: 255 },
    { name: '爱丽丝蓝 AliceBlue', r: 240, g: 248, b: 255 },
    { name: '薰衣草 Lavender', r: 230, g: 230, b: 250 },
    { name: '淡紫 Thistle', r: 216, g: 191, b: 216 },
    { name: '李子色 Plum', r: 221, g: 160, b: 221 },
    { name: '紫罗兰 Violet', r: 238, g: 130, b: 238 },
    { name: '兰花色 Orchid', r: 218, g: 112, b: 214 },
    { name: '中兰花色 MediumOrchid', r: 186, g: 85, b: 211 },
    { name: '暗紫罗兰 DarkViolet', r: 148, g: 0, b: 211 },
    { name: '蓝紫 BlueViolet', r: 138, g: 43, b: 226 },
    { name: '暗洋红 DarkMagenta', r: 139, g: 0, b: 139 },
    { name: '靛蓝 Indigo', r: 75, g: 0, b: 130 },
    { name: '暗板岩蓝 DarkSlateBlue', r: 72, g: 61, b: 139 },
    { name: '板岩蓝 SlateBlue', r: 106, g: 90, b: 205 },
    { name: '中板岩蓝 MediumSlateBlue', r: 123, g: 104, b: 238 },
    { name: '钢蓝色 SteelBlue', r: 70, g: 130, b: 180 },
    { name: '天蓝 SkyBlue', r: 135, g: 206, b: 235 },
    { name: '深天蓝 DeepSkyBlue', r: 0, g: 191, b: 255 },
    { name: '浅天蓝 LightSkyBlue', r: 135, g: 206, b: 250 },
    { name: '矢车菊蓝 CornflowerBlue', r: 100, g: 149, b: 237 },
    { name: '道奇蓝 DodgerBlue', r: 30, g: 144, b: 255 },
    { name: '皇家蓝 RoyalBlue', r: 65, g: 105, b: 225 },
    { name: '中蓝 MediumBlue', r: 0, g: 0, b: 205 },
    { name: '深蓝 DarkBlue', r: 0, g: 0, b: 139 },
    { name: '午夜蓝 MidnightBlue', r: 25, g: 25, b: 112 },
    { name: '浅钢蓝 LightSteelBlue', r: 176, g: 196, b: 222 },
    { name: '浅蓝 LightBlue', r: 173, g: 216, b: 230 },
    { name: '粉蓝 PowderBlue', r: 176, g: 224, b: 230 },
    { name: '淡青色 PaleTurquoise', r: 175, g: 238, b: 238 },
    { name: '浅青色 LightCyan', r: 224, g: 255, b: 255 },
    { name: '深青色 DarkCyan', r: 0, g: 139, b: 139 },
    { name: '水鸭色 Teal', r: 0, g: 128, b: 128 },
    { name: '中绿宝石 MediumTurquoise', r: 72, g: 209, b: 204 },
    { name: '绿宝石 Turquoise', r: 64, g: 224, b: 208 },
    { name: '浅海绿 LightSeaGreen', r: 32, g: 178, b: 170 },
    { name: '深岩灰 DarkSlateGray', r: 47, g: 79, b: 79 },
    { name: '中碧绿 MediumAquamarine', r: 102, g: 205, b: 170 },
    { name: '碧绿 Aquamarine', r: 127, g: 255, b: 212 },
    { name: '暗绿 DarkGreen', r: 0, g: 100, b: 0 },
    { name: '森林绿 ForestGreen', r: 34, g: 139, b: 34 },
    { name: '海绿 SeaGreen', r: 46, g: 139, b: 87 },
    { name: '中海绿 MediumSeaGreen', r: 60, g: 179, b: 113 },
    { name: '春绿 SpringGreen', r: 0, g: 255, b: 127 },
    { name: '中春绿 MediumSpringGreen', r: 0, g: 250, b: 154 },
    { name: '浅绿 LightGreen', r: 144, g: 238, b: 144 },
    { name: '淡绿 PaleGreen', r: 152, g: 251, b: 152 },
    { name: '黄绿 YellowGreen', r: 154, g: 205, b: 50 },
    { name: '草绿 LawnGreen', r: 124, g: 252, b: 0 },
    { name: '查特酒绿 Chartreuse', r: 127, g: 255, b: 0 },
    { name: '绿黄 GreenYellow', r: 173, g: 255, b: 47 },
    { name: '橄榄褐 OliveDrab', r: 107, g: 142, b: 35 },
    { name: '暗橄榄绿 DarkOliveGreen', r: 85, g: 107, b: 47 },
    { name: '酸橙绿 Lime', r: 0, g: 255, b: 0 },
    { name: '酸橙 LimeGreen', r: 50, g: 205, b: 50 },
    { name: '深卡其 DarkKhaki', r: 189, g: 183, b: 107 },
    { name: '卡其 Khaki', r: 240, g: 230, b: 140 },
    { name: '淡金 PaleGoldenrod', r: 238, g: 232, b: 170 },
    { name: '浅金黄 LightGoldenrodYellow', r: 250, g: 250, b: 210 },
    { name: '柠檬绸 LemonChiffon', r: 255, g: 250, b: 205 },
    { name: '浅黄 LightYellow', r: 255, g: 255, b: 224 },
    { name: '玉米色 Cornsilk', r: 255, g: 248, b: 220 },
    { name: '米色 Beige', r: 245, g: 245, b: 220 },
    { name: '鹿皮色 Bisque', r: 255, g: 228, b: 196 },
    { name: '纳瓦霍白 NavajoWhite', r: 255, g: 222, b: 173 },
    { name: '小麦色 Wheat', r: 245, g: 222, b: 179 },
    { name: '鹿色 BurlyWood', r: 222, g: 184, b: 135 },
    { name: '棕褐色 Tan', r: 210, g: 180, b: 140 },
    { name: '玫瑰色 RosyBrown', r: 188, g: 143, b: 143 },
    { name: '沙色 SandyBrown', r: 244, g: 164, b: 96 },
    { name: '秋麒麟 Goldenrod', r: 218, g: 165, b: 32 },
    { name: '暗秋麒麟 DarkGoldenrod', r: 184, g: 134, b: 11 },
    { name: '秘鲁色 Peru', r: 205, g: 133, b: 63 },
    { name: '巧克力色 Chocolate', r: 210, g: 105, b: 30 },
    { name: '鞍棕色 SaddleBrown', r: 139, g: 69, b: 19 },
    { name: '赭色 Sienna', r: 160, g: 82, b: 45 },
    { name: '棕色 Brown', r: 165, g: 42, b: 42 },
    { name: '深棕 DarkBrown', r: 101, g: 55, b: 0 },
    { name: '摩卡色 Mocha', r: 150, g: 100, b: 60 },
    { name: '原木色 Wood', r: 180, g: 140, b: 100 },
    { name: '赤陶色 Terracotta', r: 204, g: 102, b: 51 },
    { name: '铜色 Copper', r: 184, g: 115, b: 51 },
    { name: '暗灰 DarkGray', r: 169, g: 169, b: 169 },
    { name: '灰 Gray', r: 128, g: 128, b: 128 },
    { name: '暗灰 DimGray', r: 105, g: 105, b: 105 },
    { name: '浅灰 LightGray', r: 211, g: 211, b: 211 },
    { name: '亮钢蓝 LightSteelBlue', r: 176, g: 196, b: 222 },
    { name: '石板灰 SlateGray', r: 112, g: 128, b: 144 },
    { name: '暗石板灰 DarkSlateGray', r: 47, g: 79, b: 79 },
    { name: '白烟 WhiteSmoke', r: 245, g: 245, b: 245 },
    { name: '贝壳 Seashell', r: 255, g: 245, b: 238 },
    { name: '老花色 OldLace', r: 253, g: 245, b: 230 },
    { name: '花白 FloralWhite', r: 255, g: 250, b: 240 },
    { name: '象牙色 Ivory', r: 255, g: 255, b: 240 },
    { name: '古白 AntiqueWhite', r: 250, g: 235, b: 215 },
    { name: '亚麻色 Linen', r: 250, g: 240, b: 230 },
    { name: '薰衣草腮红 LavenderBlush', r: 255, g: 240, b: 245 },
    { name: '淡粉 MistyRose', r: 255, g: 228, b: 225 },
    { name: '茜色 Gainsboro', r: 220, g: 220, b: 220 },
    { name: '桃色 PeachPuff', r: 255, g: 218, b: 185 },
    { name: '浅鲑鱼 LightSalmon', r: 255, g: 160, b: 122 },
    { name: '深鲑鱼 DarkSalmon', r: 233, g: 150, b: 122 },
    { name: '橙红 Coral', r: 255, g: 127, b: 80 },
    { name: '暗橙红 DarkCoral', r: 205, g: 91, b: 69 },
    { name: '耐火砖 FireBrick', r: 178, g: 34, b: 34 },
    { name: '深红 Crimson', r: 220, g: 20, b: 60 },
    { name: '暗红 DarkRed', r: 139, g: 0, b: 0 },
    { name: '猩红 Scarlet', r: 255, g: 36, b: 0 },
    { name: '勃艮第酒红 Burgundy', r: 128, g: 0, b: 32 },
    { name: '锈红 Rust', r: 183, g: 65, b: 14 },
    { name: '朱红 Vermilion', r: 227, g: 66, b: 52 },
    { name: '胭脂红 Carmine', r: 150, g: 0, b: 24 }
  ];

  function findColorName(r, g, b) {
    let minDist = Infinity;
    let best = null;
    for (const c of COLOR_NAMES) {
      const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
      if (d < minDist) {
        minDist = d;
        best = c;
      }
    }
    return best && minDist < 60000 ? best.name : null;
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (_) {}
  }

  function loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          history.length = 0;
          history.push(...parsed.slice(0, HISTORY_MAX));
        }
      }
    } catch (_) {}
  }

  function saveSelected(hex, color) {
    try {
      localStorage.setItem(SELECTED_KEY, JSON.stringify({ hex, color }));
    } catch (_) {}
  }

  function loadSelected() {
    try {
      const data = localStorage.getItem(SELECTED_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.hex && parsed.color) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }

  magnifierCanvas.width = MAGNIFIER_SIZE;
  magnifierCanvas.height = MAGNIFIER_SIZE;

  function init() {
    magnifier.style.display = 'none';
    loadHistory();
    setupCanvas();

    fileInput.addEventListener('change', onFileSelect);
    pasteBtn.addEventListener('click', onPasteClick);
    document.addEventListener('paste', onPaste);

    displayCanvas.addEventListener('click', onCanvasClick);
    displayCanvas.addEventListener('dblclick', onDblClick);
    displayCanvas.addEventListener('mousedown', onMouseDown);
    displayCanvas.addEventListener('mousemove', onMouseMove);
    displayCanvas.addEventListener('mouseup', onMouseUp);
    displayCanvas.addEventListener('mouseleave', onMouseLeave);
    displayCanvas.addEventListener('mouseenter', onMouseEnter);

    canvasWrapper.addEventListener('wheel', onWheel, { passive: false });

    document.addEventListener('keydown', onKeyDown);

    document.addEventListener('dragenter', onDocDragEnter);
    document.addEventListener('dragover', onDocDragOver);
    document.addEventListener('dragleave', onDocDragLeave);
    document.addEventListener('drop', onDocDrop);

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        updateStatus();
      });
    });

    copyBtn.addEventListener('click', copyColor);

    document.getElementById('colorHexGroup').addEventListener('click', cycleFormat);
    document.getElementById('colorRgbGroup').addEventListener('click', cycleFormat);

    clearHistoryBtn.addEventListener('click', () => {
      history = [];
      saveHistory();
      renderHistory();
      showToast('已清空取色记录');
    });

    renderHistory();
    const restored = loadSelected();
    if (restored) {
      currentColor = restored.color;
      const r = restored.color.r, g = restored.color.g, b = restored.color.b;
      const hex = restored.hex;
      colorSwatch.style.backgroundColor = hex;
      swatchHex.textContent = hex.toUpperCase();
      swatchHex.style.color = getContrastColor(restored.color);
      hexValue.textContent = getColorString(restored.color, colorFormat);
      rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
    }
  }

  function setupCanvas() {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(width * dpr);
        const h = Math.floor(height * dpr);
        if (w !== canvasW || h !== canvasH) {
          canvasW = w;
          canvasH = h;
          displayCanvas.width = w;
          displayCanvas.height = h;
          if (isImageLoaded) {
            fitImageToCanvas();
            render();
            updateStatus();
          } else {
            drawCheckerboard();
          }
        }
      }
    });
    ro.observe(canvasWrapper);
  }

  function drawCheckerboard() {
    displayCtx.fillStyle = '#ffffff';
    displayCtx.fillRect(0, 0, canvasW, canvasH);
    displayCtx.fillStyle = '#e8e8e8';
    const size = Math.max(8, Math.floor(canvasW / 80));
    for (let y = 0; y < canvasH; y += size) {
      for (let x = 0; x < canvasW; x += size) {
        if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
          displayCtx.fillRect(x, y, size, size);
        }
      }
    }
  }

  function onFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    loadImageFromFile(file);
    fileInput.value = '';
  }

  function loadImageFromFile(file) {
    if (!file.type.startsWith('image/')) {
      setStatus('不支持的文件格式');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = e.target.result;
    };
    reader.onerror = () => setStatus('读取文件失败');
    reader.readAsDataURL(file);
  }

  function onPasteClick() {
    navigator.clipboard.read().then(items => {
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          item.getType(imageType).then(blob => {
            const img = new Image();
            img.onload = () => processImage(img);
            img.src = URL.createObjectURL(blob);
          });
          return;
        }
      }
      showToast('剪贴板中没有图片');
    }).catch(() => {
      showToast('请按 Ctrl+V 快捷键粘贴图片');
    });
  }

  function onPaste(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const img = new Image();
        img.onload = () => processImage(img);
        img.src = URL.createObjectURL(blob);
        setStatus('已从剪贴板粘贴图片');
        return;
      }
    }
  }

  function processImage(img) {
    sourceImage = img;

    let sw = img.width;
    let sh = img.height;

    if (sw > MAX_IMAGE_SIZE || sh > MAX_IMAGE_SIZE) {
      const ratio = Math.min(MAX_IMAGE_SIZE / sw, MAX_IMAGE_SIZE / sh);
      sw = Math.round(sw * ratio);
      sh = Math.round(sh * ratio);
    }

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = sw;
    offscreenCanvas.height = sh;
    offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.drawImage(img, 0, 0, sw, sh);

    isImageLoaded = true;
    zoomLevel = 1;
    placeholder.style.display = 'none';
    zoomLabel.hidden = false;

    fitImageToCanvas();
    render();
    updateStatus();
    displayCanvas.style.cursor = 'crosshair';
  }

  function fitImageToCanvas() {
    const iw = offscreenCanvas.width;
    const ih = offscreenCanvas.height;
    const baseScale = Math.min(canvasW / iw, canvasH / ih, 1);
    const scale = baseScale * zoomLevel;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (canvasW - dw) / 2;
    const dy = (canvasH - dh) / 2;
    imageRect = { x: dx, y: dy, w: dw, h: dh, baseScale, scale };
  }

  function render() {
    drawCheckerboard();
    if (!isImageLoaded) return;
    displayCtx.save();
    displayCtx.drawImage(offscreenCanvas, imageRect.x, imageRect.y, imageRect.w, imageRect.h);
    if (isDragging && dragStart && dragEnd && mode === 'region') {
      drawSelectionRect();
    }
    displayCtx.restore();

    if (zoomLevel !== 1) {
      zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
      zoomLabel.hidden = false;
    } else {
      zoomLabel.hidden = true;
    }
  }

  function isInsideImage(cx, cy) {
    return cx >= imageRect.x && cx <= imageRect.x + imageRect.w &&
           cy >= imageRect.y && cy <= imageRect.y + imageRect.h;
  }

  function canvasToImage(cx, cy) {
    const ix = (cx - imageRect.x) / imageRect.scale;
    const iy = (cy - imageRect.y) / imageRect.scale;
    return { x: Math.round(ix), y: Math.round(iy) };
  }

  function getCanvasCoords(e) {
    const rect = displayCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasW / rect.width),
      y: (e.clientY - rect.top) * (canvasH / rect.height)
    };
  }

  function getPixelColor(ix, iy) {
    if (!offscreenCtx) return null;
    ix = Math.max(0, Math.min(ix, offscreenCanvas.width - 1));
    iy = Math.max(0, Math.min(iy, offscreenCanvas.height - 1));
    const data = offscreenCtx.getImageData(ix, iy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2] };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function getColorString(color, format) {
    switch (format) {
      case 'hex': return rgbToHex(color.r, color.g, color.b).toUpperCase();
      case 'rgb': return `rgb(${color.r}, ${color.g}, ${color.b})`;
      case 'hsl': {
        const hsl = rgbToHsl(color.r, color.g, color.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
    }
  }

  const formatLabels = { hex: 'HEX', rgb: 'RGB', hsl: 'HSL' };

  function cycleFormat() {
    const keys = ['hex', 'rgb', 'hsl'];
    const idx = keys.indexOf(colorFormat);
    colorFormat = keys[(idx + 1) % keys.length];
    formatLabel.textContent = formatLabels[colorFormat];
    if (currentColor) {
      hexValue.textContent = getColorString(currentColor, colorFormat);
    }
    updateStatus();
  }

  function onCanvasClick(e) {
    if (!isImageLoaded || mode !== 'click') return;
    const pos = getCanvasCoords(e);
    if (!isInsideImage(pos.x, pos.y)) return;
    const ic = canvasToImage(pos.x, pos.y);
    const color = getPixelColor(ic.x, ic.y);
    if (color) {
      selectColor(color);
      showTooltip(pos.x, pos.y, color);
    }
  }

  function onDblClick(e) {
    if (!isImageLoaded) return;
    if (zoomLevel !== 1) {
      zoomLevel = 1;
      fitImageToCanvas();
      render();
      updateStatus();
      showToast('已重置缩放');
    }
  }

  function onMouseDown(e) {
    if (!isImageLoaded || mode !== 'region') return;
    const pos = getCanvasCoords(e);
    if (!isInsideImage(pos.x, pos.y)) return;
    isDragging = true;
    dragStart = { x: pos.x, y: pos.y };
    dragEnd = { x: pos.x, y: pos.y };
  }

  function onMouseMove(e) {
    if (!isImageLoaded) return;
    const pos = getCanvasCoords(e);
    const inside = isInsideImage(pos.x, pos.y);
    displayCanvas.style.cursor = inside ? 'crosshair' : 'default';

    if (isDragging && mode === 'region') {
      dragEnd = { x: pos.x, y: pos.y };
      render();
    }

    if (inside) {
      const ic = canvasToImage(pos.x, pos.y);
      const color = getPixelColor(ic.x, ic.y);
      if (color) {
        magnifier.style.display = 'flex';
        lastHoverColor = color;
        updateMagnifier(e, color, ic);
        updateStatusHover(ic, color);
      }
    } else {
      magnifier.style.display = 'none';
    }
  }

  function onMouseEnter(e) {
    if (!isImageLoaded) return;
    const pos = getCanvasCoords(e);
    magnifier.style.display = isInsideImage(pos.x, pos.y) ? 'flex' : 'none';
  }

  function onMouseLeave() {
    if (isDragging && mode === 'region') {
      isDragging = false;
      dragStart = null;
      dragEnd = null;
      render();
    }
    magnifier.style.display = 'none';
  }

  function onMouseUp() {
    if (!isDragging || mode !== 'region') return;
    isDragging = false;

    if (!dragStart || !dragEnd) return;

    const x1 = Math.min(dragStart.x, dragEnd.x);
    const y1 = Math.min(dragStart.y, dragEnd.y);
    const x2 = Math.max(dragStart.x, dragEnd.x);
    const y2 = Math.max(dragStart.y, dragEnd.y);

    const p1 = canvasToImage(x1, y1);
    const p2 = canvasToImage(x2, y2);

    const avg = getRegionAverage(p1.x, p1.y, p2.x, p2.y);
    if (avg) {
      selectColor(avg);
      showTooltip((x1 + x2) / 2, (y1 + y2) / 2, avg);
    }

    dragStart = null;
    dragEnd = null;
    render();
  }

  function getRegionAverage(ix1, iy1, ix2, iy2) {
    if (!offscreenCtx) return null;
    ix1 = Math.max(0, Math.min(ix1, offscreenCanvas.width - 1));
    iy1 = Math.max(0, Math.min(iy1, offscreenCanvas.height - 1));
    ix2 = Math.max(0, Math.min(ix2, offscreenCanvas.width - 1));
    iy2 = Math.max(0, Math.min(iy2, offscreenCanvas.height - 1));

    const w = ix2 - ix1 + 1;
    const h = iy2 - iy1 + 1;
    if (w <= 0 || h <= 0) return null;

    const imageData = offscreenCtx.getImageData(ix1, iy1, w, h);
    const data = imageData.data;
    const count = w * h;
    let tr = 0, tg = 0, tb = 0;

    for (let i = 0; i < count; i++) {
      tr += data[i * 4];
      tg += data[i * 4 + 1];
      tb += data[i * 4 + 2];
    }

    return { r: Math.round(tr / count), g: Math.round(tg / count), b: Math.round(tb / count) };
  }

  function drawSelectionRect() {
    if (!dragStart || !dragEnd) return;
    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const w = Math.abs(dragEnd.x - dragStart.x);
    const h = Math.abs(dragEnd.y - dragStart.y);

    displayCtx.fillStyle = 'rgba(0, 229, 255, 0.06)';
    displayCtx.fillRect(x, y, w, h);
    displayCtx.strokeStyle = '#00e5ff';
    displayCtx.lineWidth = 2;
    displayCtx.strokeRect(x, y, w, h);
    displayCtx.strokeStyle = '#ffffff';
    displayCtx.lineWidth = 1;
    displayCtx.setLineDash([4, 4]);
    displayCtx.strokeRect(x, y, w, h);
    displayCtx.setLineDash([]);
    displayCtx.fillStyle = '#00e5ff';
    displayCtx.font = '12px -apple-system, sans-serif';
    displayCtx.fillText(`${Math.round(w / imageRect.scale)}×${Math.round(h / imageRect.scale)}`, x + 6, y - 6);
  }

  function selectColor(color) {
    currentColor = color;
    const hex = rgbToHex(color.r, color.g, color.b);

    colorSwatch.style.backgroundColor = hex;
    swatchHex.textContent = hex.toUpperCase();
    swatchHex.style.color = getContrastColor(color);
    hexValue.textContent = getColorString(color, colorFormat);
    rgbValue.textContent = `rgb(${color.r}, ${color.g}, ${color.b})`;

    const name = findColorName(color.r, color.g, color.b);
    if (name) {
      colorName.hidden = false;
      colorNameValue.textContent = name;
    } else {
      colorName.hidden = true;
    }

    copyBtn.querySelector('.btn-text').textContent = '复制色号';
    copyBtn.style.background = '';

    addHistory(hex, color);
    saveSelected(hex, color);
    updateStatus();
  }

  function getContrastColor(color) {
    const lum = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    return lum > 0.5 ? '#1a1f2e' : '#e8eaed';
  }

  function updateMagnifier(e, color, ic) {
    const rect = displayCanvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    magnifier.style.left = cx + 'px';
    magnifier.style.top = cy + 'px';

    const half = Math.floor(MAGNIFIER_SIZE / 2);
    const imageData = offscreenCtx.getImageData(
      Math.max(0, ic.x - half), Math.max(0, ic.y - half),
      MAGNIFIER_SIZE, MAGNIFIER_SIZE
    );

    const data = imageData.data;
    const len = imageData.width * imageData.height;

    for (let i = 0; i < len; i++) {
      const px = data[i * 4];
      const py = data[i * 4 + 1];
      const pz = data[i * 4 + 2];
      const idx = i * 4;
      data[idx] = px;
      data[idx + 1] = py;
      data[idx + 2] = pz;
      data[idx + 3] = 255;
    }

    magnifierCtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    magnifierCtx.putImageData(imageData, 0, 0);

    const hex = rgbToHex(color.r, color.g, color.b);
    magnifierHex.textContent = hex.toUpperCase();
    magnifierCoord.textContent = `(${ic.x}, ${ic.y})`;
  }

  function updateStatusHover(ic, color) {
    if (currentColor) return;
    const hex = rgbToHex(color.r, color.g, color.b);
    status.textContent = `(${ic.x}, ${ic.y}) · ${hex.toUpperCase()}`;
  }

  function showTooltip(cx, cy, color) {
    const hex = rgbToHex(color.r, color.g, color.b);
    tooltipSwatch.style.backgroundColor = hex;
    tooltipHex.textContent = hex.toUpperCase();
    colorTooltip.style.left = cx + 'px';
    colorTooltip.style.top = cy + 'px';
    colorTooltip.hidden = false;
    clearTimeout(colorTooltip._hideTimer);
    colorTooltip._hideTimer = setTimeout(() => {
      colorTooltip.hidden = true;
    }, 2000);
  }

  function addHistory(hex, color) {
    if (history.length > 0 && history[history.length - 1].hex === hex) return;
    history.push({ hex, color: { r: color.r, g: color.g, b: color.b } });
    if (history.length > HISTORY_MAX) history.shift();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    historyCount.textContent = `${history.length}/${HISTORY_MAX}`;
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-hint">暂无记录</p>';
      clearHistoryBtn.classList.add('hidden');
      return;
    }
    clearHistoryBtn.classList.remove('hidden');
    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'history-item';
      wrapper.style.backgroundColor = item.hex;
      wrapper.dataset.hex = item.hex.toUpperCase();

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '×';
      del.addEventListener('click', e => {
        e.stopPropagation();
        history.splice(index, 1);
        saveHistory();
        renderHistory();
      });

      wrapper.appendChild(del);
      wrapper.addEventListener('click', () => {
        const c = item.color;
        currentColor = { r: c.r, g: c.g, b: c.b };
        colorSwatch.style.backgroundColor = item.hex;
        swatchHex.textContent = item.hex.toUpperCase();
        swatchHex.style.color = getContrastColor(c);
        hexValue.textContent = getColorString(c, colorFormat);
        rgbValue.textContent = `rgb(${c.r}, ${c.g}, ${c.b})`;
        const name = findColorName(c.r, c.g, c.b);
        if (name) {
          colorName.hidden = false;
          colorNameValue.textContent = name;
        } else {
          colorName.hidden = true;
        }
        copyBtn.querySelector('.btn-text').textContent = '复制色号';
        copyBtn.style.background = '';
        saveSelected(item.hex, c);
      });
      historyList.appendChild(wrapper);
    });
  }

  function copyColor() {
    const text = hexValue.textContent;
    if (!text || text === '------' || !currentColor) {
      setStatus('还没有取色');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const btnText = copyBtn.querySelector('.btn-text');
      btnText.textContent = '✅ 已复制';
      copyBtn.style.background = '#0d7377';
      setStatus(`已复制: ${text}`);
      setTimeout(() => {
        btnText.textContent = '复制色号';
        copyBtn.style.background = '';
      }, 2000);
    }).catch(() => {
      setStatus('复制失败，请手动复制');
    });
  }

  function onWheel(e) {
    if (!isImageLoaded) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevel + delta));

    if (newZoom !== zoomLevel) {
      zoomLevel = newZoom;
      fitImageToCanvas();
      render();
      updateStatus();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (isDragging) {
        isDragging = false;
        dragStart = null;
        dragEnd = null;
        render();
      }
      return;
    }

    if (!isImageLoaded) return;

    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const newZoom = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP);
      if (newZoom !== zoomLevel) {
        zoomLevel = newZoom;
        fitImageToCanvas();
        render();
        updateStatus();
      }
      return;
    }

    if (e.key === '-') {
      e.preventDefault();
      const newZoom = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP);
      if (newZoom !== zoomLevel) {
        zoomLevel = newZoom;
        fitImageToCanvas();
        render();
        updateStatus();
      }
      return;
    }

    if (e.key === 'c' || e.key === 'C') {
      if (!e.ctrlKey && !e.metaKey) {
        copyColor();
      }
    }
  }

  function onDocDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dropOverlay.classList.add('active');
    }
  }

  function onDocDragOver(e) {
    e.preventDefault();
  }

  function onDocDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay.classList.remove('active');
    }
  }

  function onDocDrop(e) {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFromFile(file);
    } else {
      showToast('请拖入图片文件');
    }
  }

  function updateStatus() {
    if (!isImageLoaded) {
      status.textContent = '就绪';
      return;
    }

    const parts = [
      `${offscreenCanvas.width}×${offscreenCanvas.height}`,
      mode === 'click' ? '点击取色' : '区域取色'
    ];

    if (zoomLevel !== 1) {
      parts.push(`${Math.round(zoomLevel * 100)}%`);
    }

    if (currentColor) {
      parts.push(getColorString(currentColor, colorFormat));
    }

    status.textContent = parts.join(' · ');
  }

  function setStatus(msg) {
    status.textContent = msg;
  }

  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
