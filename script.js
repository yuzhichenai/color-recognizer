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
  const copyBtn = document.getElementById('copyBtn');
  const historyList = document.getElementById('historyList');
  const status = document.getElementById('status');
  const colorTooltip = document.getElementById('colorTooltip');
  const tooltipSwatch = document.getElementById('tooltipSwatch');
  const tooltipHex = document.getElementById('tooltipHex');
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
  let imageRect = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
  let currentColor = null;

  const CANVAS_W = 800;
  const CANVAS_H = 600;

  function init() {
    displayCanvas.width = CANVAS_W;
    displayCanvas.height = CANVAS_H;
    drawCheckerboard();

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', onFileSelect);

    pasteBtn.addEventListener('click', onPasteClick);

    document.addEventListener('paste', onPaste);

    displayCanvas.addEventListener('click', onCanvasClick);
    displayCanvas.addEventListener('mousedown', onMouseDown);
    displayCanvas.addEventListener('mousemove', onMouseMove);
    displayCanvas.addEventListener('mouseup', onMouseUp);
    displayCanvas.addEventListener('mouseleave', onMouseUp);

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        if (!isImageLoaded) return;
        displayCanvas.style.cursor = 'crosshair';
      });
    });

    copyBtn.addEventListener('click', copyColor);

    canvasWrapper.addEventListener('dragover', e => {
      e.preventDefault();
      canvasWrapper.classList.add('dragover');
    });
    canvasWrapper.addEventListener('dragleave', () => {
      canvasWrapper.classList.remove('dragover');
    });
    canvasWrapper.addEventListener('drop', e => {
      e.preventDefault();
      canvasWrapper.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadImageFromFile(file);
      }
    });
  }

  function drawCheckerboard() {
    const size = 10;
    displayCtx.fillStyle = '#ffffff';
    displayCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    displayCtx.fillStyle = '#e8e8e8';
    for (let y = 0; y < CANVAS_H; y += size) {
      for (let x = 0; x < CANVAS_W; x += size) {
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
      setStatus('剪贴板中没有图片');
    }).catch(() => {
      setStatus('无法读取剪贴板，请按 Ctrl+V 粘贴');
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

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = img.width;
    offscreenCanvas.height = img.height;
    offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.drawImage(img, 0, 0);

    isImageLoaded = true;
    placeholder.style.display = 'none';

    fitImageToCanvas();
    render();
    setStatus(`已加载: ${img.width}×${img.height} 像素`);
    displayCanvas.style.cursor = 'crosshair';
  }

  function fitImageToCanvas() {
    const iw = sourceImage.width;
    const ih = sourceImage.height;
    const scale = Math.min(CANVAS_W / iw, CANVAS_H / ih, 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (CANVAS_W - dw) / 2;
    const dy = (CANVAS_H - dh) / 2;
    imageRect = { x: dx, y: dy, w: dw, h: dh, scale };
  }

  function render() {
    drawCheckerboard();
    if (!isImageLoaded) return;
    displayCtx.drawImage(sourceImage, imageRect.x, imageRect.y, imageRect.w, imageRect.h);
    if (isDragging && dragStart && dragEnd && mode === 'region') {
      drawSelectionRect();
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
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height)
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

    displayCtx.fillStyle = 'rgba(108, 92, 231, 0.08)';
    displayCtx.fillRect(x, y, w, h);

    displayCtx.strokeStyle = '#6c5ce7';
    displayCtx.lineWidth = 2;
    displayCtx.strokeRect(x, y, w, h);

    displayCtx.strokeStyle = '#ffffff';
    displayCtx.lineWidth = 1;
    displayCtx.setLineDash([4, 4]);
    displayCtx.strokeRect(x, y, w, h);
    displayCtx.setLineDash([]);

    displayCtx.fillStyle = '#6c5ce7';
    displayCtx.font = '12px -apple-system, sans-serif';
    displayCtx.fillText(`${Math.round(w / imageRect.scale)}×${Math.round(h / imageRect.scale)}`, x + 6, y - 6);
  }

  function selectColor(color) {
    currentColor = color;
    const hex = rgbToHex(color.r, color.g, color.b);
    const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;

    colorSwatch.style.backgroundColor = hex;
    swatchHex.textContent = hex.toUpperCase();
    swatchHex.style.color = getContrastColor(color);
    hexValue.textContent = hex.toUpperCase();
    rgbValue.textContent = rgb;

    copyBtn.querySelector('.btn-text').textContent = '复制色号';
    copyBtn.style.background = '#00b894';

    addHistory(hex, color);
    setStatus(`已取色: ${hex.toUpperCase()}`);
  }

  function getContrastColor(color) {
    const lum = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    return lum > 0.5 ? '#2d3436' : '#ffffff';
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
    if (history.length > 20) history.shift();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-hint">还没有取色记录</p>';
      return;
    }
    historyList.innerHTML = '';
    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.style.backgroundColor = item.hex;
      el.title = item.hex.toUpperCase();
      el.addEventListener('click', () => {
        colorSwatch.style.backgroundColor = item.hex;
        swatchHex.textContent = item.hex.toUpperCase();
        swatchHex.style.color = getContrastColor(item.color);
        hexValue.textContent = item.hex.toUpperCase();
        rgbValue.textContent = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`;
        currentColor = item.color;
        copyBtn.querySelector('.btn-text').textContent = '复制色号';
        copyBtn.style.background = '#00b894';
      });
      historyList.appendChild(el);
    });
  }

  function copyColor() {
    const hex = hexValue.textContent;
    if (hex === '------' || !currentColor) {
      setStatus('还没有取色');
      return;
    }
    navigator.clipboard.writeText(hex).then(() => {
      const btnText = copyBtn.querySelector('.btn-text');
      btnText.textContent = '✅ 已复制';
      copyBtn.style.background = '#00a381';
      setStatus(`已复制: ${hex}`);
      setTimeout(() => {
        btnText.textContent = '复制色号';
        copyBtn.style.background = '#00b894';
      }, 2000);
    }).catch(() => {
      setStatus('复制失败，请手动复制');
    });
  }

  function setStatus(msg) {
    status.textContent = msg;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
