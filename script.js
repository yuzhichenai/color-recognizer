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

  const MAX_IMAGE_SIZE = 4096;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 20;
  const ZOOM_STEP = 0.1;

  function init() {
    setupCanvas();

    fileInput.addEventListener('change', onFileSelect);
    pasteBtn.addEventListener('click', onPasteClick);
    document.addEventListener('paste', onPaste);

    displayCanvas.addEventListener('click', onCanvasClick);
    displayCanvas.addEventListener('mousedown', onMouseDown);
    displayCanvas.addEventListener('mousemove', onMouseMove);
    displayCanvas.addEventListener('mouseup', onMouseUp);
    displayCanvas.addEventListener('mouseleave', onMouseUp);

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
      renderHistory();
      showToast('已清空取色记录');
    });
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

    copyBtn.querySelector('.btn-text').textContent = '复制色号';
    copyBtn.style.background = '';

    addHistory(hex, color);
    updateStatus();
  }

  function getContrastColor(color) {
    const lum = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    return lum > 0.5 ? '#1a1f2e' : '#e8eaed';
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
    historyCount.textContent = history.length;
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
        renderHistory();
      });

      wrapper.appendChild(del);
      wrapper.addEventListener('click', () => {
        currentColor = { r: item.color.r, g: item.color.g, b: item.color.b };
        colorSwatch.style.backgroundColor = item.hex;
        swatchHex.textContent = item.hex.toUpperCase();
        swatchHex.style.color = getContrastColor(item.color);
        hexValue.textContent = getColorString(item.color, colorFormat);
        rgbValue.textContent = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`;
        copyBtn.querySelector('.btn-text').textContent = '复制色号';
        copyBtn.style.background = '';
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
    const modeLabel = mode === 'click' ? '点击取色' : '区域取色';
    if (!isImageLoaded) {
      status.textContent = '就绪';
      return;
    }

    const parts = [
      `${offscreenCanvas.width}×${offscreenCanvas.height}`,
      modeLabel
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
