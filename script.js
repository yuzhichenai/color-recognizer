(function () {
  const $ = id => document.getElementById(id);
  const $$ = s => document.querySelectorAll(s);

  const D = {
    cv: $('mainCanvas'), ctx: $('mainCanvas').getContext('2d'),
    wr: $('canvasWrapper'), ph: $('placeholder'),
    fi: $('fileInput'),
    cs: $('colorSwatch'), sh: $('swatchHex'), hv: $('hexValue'), rv: $('rgbValue'), hslv: $('hslValue'),
    cb: $('copyBtn'), hl: $('historyList'), hc: $('historyCount'), cl: $('clearHistoryBtn'),
    st: $('status'), tt: $('colorTooltip'), tts: $('tooltipSwatch'), tth: $('tooltipHex'),
    zl: $('zoomLabel'), pl: $('panLabel'),
    mg: $('magnifier'), mgc: $('magnifierCanvas'), mgcx: $('magnifierCanvas').getContext('2d'),
    mgh: $('magnifierHex'), mgco: $('magnifierCoord'),
    cn: $('colorName'), cnv: $('colorNameValue'),
    ps: $('paletteSection'), ds: $('dominantSection'), dl: $('dominantList'),
    ct: $('contextMenu'), cm: $('contrastSection'), ctr: $('contrastResult'), cti: $('contrastInput'),
    em: $('exportModal'), ec: $('exportCode'), ecb: $('exportCopyBtn'), eb: $('exportBtn'),
    sb: $('shareBtn'), hm: $('helpModal'), hb: $('helpBtn'), chb: $('closeHelpBtn'),
    rb: $('resetBtn'), pb: $('paletteImgBtn'),
    dob: $('dropOverlay'), ts: $('toast'),
    ft: $('favToggle'), rd: $('refreshDominant'),
    sH: $('sliderH'), sS: $('sliderS'), sL: $('sliderL'),
    svH: $('sliderValH'), svS: $('sliderValS'), svL: $('sliderValL'),
    tabs: $('imageTabs'), tabsScroll: $('tabsScroll'), tabAdd: $('tabAddBtn'),
    onb: $('onboarding'), onbStart: $('onbStartBtn'), onbDont: $('onbDontShow'),
    cchk: $('contrastCheck')
  };

  const modeBtns = $$('.mode-btn'), sampleBtns = $$('.sample-btn'), copyMinis = $$('.copy-mini'), exportTabs = $$('.export-tab');

  let images = {}, activeId = null, idCounter = 0;
  let mode = 'click', sampleSize = 3, altHeld = false, favOnly = false;
  let canvasW = 0, canvasH = 0, dragCounter = 0, isPanning = false, panStart = null, panOffset = { x: 0, y: 0 };

  const MAX_IMG = 4096, ZOOM_MIN = 0.1, ZOOM_MAX = 20, ZOOM_STEP = 0.1, HIST_MAX = 20, MAG_SZ = 7, DOM_CNT = 8;
  const SK = 'cr-history', SELK = 'cr-selected', FAVK = 'cr-favs', ONBK = 'cr-onboarded';

  function imgState() {
    return activeId ? images[activeId] : null;
  }

  function getCurrent(key) {
    const s = imgState();
    return s ? s[key] : null;
  }

  setConst('currentColor', null);
  setConst('history', []);
  setConst('dominantColors', []);
  setConst('offCvs', null);
  setConst('offCtx', null);
  setConst('zoomLevel', 1);
  setConst('imageRect', { x: 0, y: 0, w: 0, h: 0, bs: 1, s: 1 });
  setConst('locked', new Set());
  setConst('srcImg', null);

  function setConst(k, v) {
    Object.defineProperty(this, k, { get: () => { const s = imgState(); return s ? s[k] : v; }, set: (nv) => { const s = imgState(); if (s) s[k] = nv; } });
  }

  function ensureState() {
    if (!activeId || !images[activeId]) return null;
    return images[activeId];
  }

  let _curColor = null, _history = [], _favs = new Set(), _locked = new Set();

  function curColor() { return _curColor; }
  function setCurColor(c) { _curColor = c; }
  function getHistory() { return _history; }
  function setHistory(h) { _history = h; }
  function isLocked(hex) { return _locked.has(hex.toLowerCase()); }
  function toggleLock(hex) { const h = hex.toLowerCase(); if (_locked.has(h)) _locked.delete(h); else _locked.add(h); saveLocks(); }

  const CNAME = [
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
    { n: '雪白 Snow', r: 255, g: 250, b: 250 }, { n: '浅黄 LightYellow', r: 255, g: 255, b: 224 }, { n: '薄荷 MintCream', r: 245, g: 255, b: 250 },
    { n: '桃色 PeachPuff', r: 255, g: 218, b: 185 }, { n: '小麦色 Wheat', r: 245, g: 222, b: 179 }, { n: '棕褐色 Tan', r: 210, g: 180, b: 140 },
    { n: '沙色 SandyBrown', r: 244, g: 164, b: 96 }, { n: '秋麒麟 Goldenrod', r: 218, g: 165, b: 32 }, { n: '深红 Crimson', r: 220, g: 20, b: 60 },
    { n: '耐火砖 FireBrick', r: 178, g: 34, b: 34 }, { n: '赤陶色 Terracotta', r: 204, g: 102, b: 51 }, { n: '铜色 Copper', r: 184, g: 115, b: 51 },
    { n: '锈红 Rust', r: 183, g: 65, b: 14 }, { n: '酒红 Burgundy', r: 128, g: 0, b: 32 }, { n: '珊瑚粉 Salmon', r: 250, g: 128, b: 114 },
    { n: '深粉红 DeepPink', r: 255, g: 20, b: 147 }, { n: '绿宝石 Turquoise', r: 64, g: 224, b: 208 }, { n: '碧绿 Aquamarine', r: 127, g: 255, b: 212 },
    { n: '春绿 SpringGreen', r: 0, g: 255, b: 127 }, { n: '酸橙 LimeGreen', r: 50, g: 205, b: 50 }, { n: '草绿 LawnGreen', r: 124, g: 252, b: 0 },
    { n: '黄绿 YellowGreen', r: 154, g: 205, b: 50 }, { n: '海绿 SeaGreen', r: 46, g: 139, b: 87 }, { n: '石板灰 SlateGray', r: 112, g: 128, b: 144 },
    { n: '赭色 Sienna', r: 160, g: 82, b: 45 }, { n: '鞍棕 SaddleBrown', r: 139, g: 69, b: 19 }, { n: '棕色 Brown', r: 165, g: 42, b: 42 },
    { n: '深棕 DarkBrown', r: 101, g: 55, b: 0 }, { n: '摩卡 Mocha', r: 150, g: 100, b: 60 }, { n: '猩红 Scarlet', r: 255, g: 36, b: 0 },
    { n: '胭脂红 Carmine', r: 150, g: 0, b: 24 }, { n: '朱红 Vermilion', r: 227, g: 66, b: 52 }, { n: '紫红 Fuchsia', r: 255, g: 0, b: 255 }
  ];

  function findName(r, g, b) {
    let md = 1 / 0, best = null;
    for (const c of CNAME) { const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2; if (d < md) { md = d; best = c; } }
    return best && md < 60000 ? best.n : null;
  }

  function saveHist() { try { localStorage.setItem(SK + activeId, JSON.stringify(_history)); } catch (_) {} }
  function loadHist() {
    try {
      const d = localStorage.getItem(SK + activeId);
      if (d) { const p = JSON.parse(d); if (Array.isArray(p)) { _history = p.slice(0, HIST_MAX); return; } }
    } catch (_) {}
    _history = [];
  }
  function saveSel() { try { localStorage.setItem(SELK, JSON.stringify({ hex: _curColor ? rgb2h(_curColor.r, _curColor.g, _curColor.b) : null, color: _curColor })); } catch (_) {} }
  function loadSel() { try { const d = localStorage.getItem(SELK); if (d) { const p = JSON.parse(d); if (p && p.hex && p.color) return p; } } catch (_) {} return null; }
  function loadFavs() { try { const d = localStorage.getItem(FAVK); return d ? new Set(JSON.parse(d)) : new Set(); } catch (_) { return new Set(); } }
  function saveFavs() { try { localStorage.setItem(FAVK, JSON.stringify([..._favs])); } catch (_) {} }
  function saveLocks() { try { localStorage.setItem('cr-locks', JSON.stringify([..._locked])); } catch (_) {} }
  function loadLocks() { try { const d = localStorage.getItem('cr-locks'); return d ? new Set(JSON.parse(d)) : new Set(); } catch (_) { return new Set(); } }

  D.mgc.width = MAG_SZ; D.mgc.height = MAG_SZ;

  function init() {
    D.mg.style.display = 'none'; D.hm.setAttribute('hidden', ''); D.em.setAttribute('hidden', ''); D.onb.setAttribute('hidden', '');
    _favs = loadFavs(); _locked = loadLocks();

    if (!localStorage.getItem(ONBK)) D.onb.removeAttribute('hidden');
    D.onbStart.addEventListener('click', () => { if (D.onbDont.checked) localStorage.setItem(ONBK, '1'); D.onb.setAttribute('hidden', ''); });

    D.fi.setAttribute('multiple', '');
    setupCanvas();
    const wr = D.wr.getBoundingClientRect();
    canvasW = Math.floor(wr.width * (window.devicePixelRatio || 1));
    canvasH = Math.floor(wr.height * (window.devicePixelRatio || 1));
    D.cv.width = canvasW; D.cv.height = canvasH;
    drawChk();
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('dragenter', dEnter);
    document.addEventListener('dragover', dOver);
    document.addEventListener('dragleave', dLeave);
    document.addEventListener('drop', dDrop);
    document.addEventListener('click', hideCtx);

    D.wr.addEventListener('wheel', onWheel, { passive: false });
    D.wr.addEventListener('contextmenu', onCtxMenu);

    const cv = D.cv;
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

    D.fi.addEventListener('change', onFileSelect);
    $('pasteBtn').addEventListener('click', onPasteClick);
    D.tabAdd.addEventListener('click', () => D.fi.click());

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); mode = btn.dataset.mode;
        if (mode === 'eyedropper' && imgState()) D.st.textContent = '🔍 吸管模式：悬停即取色';
        else updateStatus();
      });
    });

    sampleBtns.forEach(b => {
      b.addEventListener('click', () => {
        sampleBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active'); sampleSize = parseInt(b.dataset.size);
      });
    });

    D.cb.addEventListener('click', () => copyColor('hex'));
    copyMinis.forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); copyColor(b.dataset.format); }); });

    D.hb.addEventListener('click', () => toggleModal(D.hm));
    D.chb.addEventListener('click', () => toggleModal(D.hm));
    D.hm.addEventListener('click', e => { if (e.target === D.hm || e.target.closest('.help-modal-backdrop')) toggleModal(D.hm); });

    D.eb.addEventListener('click', showExport);
    D.ecb.addEventListener('click', () => { if (D.ec.textContent) { navigator.clipboard.writeText(D.ec.textContent); toast('代码已复制'); } });
    exportTabs.forEach(t => { t.addEventListener('click', () => { exportTabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); showExport(); }); });
    D.em.addEventListener('click', e => { if (e.target === D.em || e.target.closest('.help-modal-backdrop')) toggleModal(D.em); });

    D.sb.addEventListener('click', sharePalette);
    D.pb.addEventListener('click', exportPaletteImg);
    D.rb.addEventListener('click', resetZoom);

    D.cl.addEventListener('click', () => {
      _history = _history.filter(h => _favs.has(h.hex));
      if (_history.length === 0) { saveHist(); renderHist(); toast('已清空全部'); }
      else { saveHist(); renderHist(); toast('已清除非收藏记录'); }
    });

    D.ft.addEventListener('click', () => { favOnly = !favOnly; D.ft.classList.toggle('active'); D.ft.textContent = favOnly ? '★' : '☆'; renderHist(); });
    D.rd.addEventListener('click', extractDominant);
    D.cchk.addEventListener('click', checkContrast);
    D.cti.addEventListener('keydown', e => { if (e.key === 'Enter') checkContrast(); });

    [D.sH, D.sS, D.sL].forEach(sl => sl.addEventListener('input', onSliderChange));

    renderHist();
    const restored = loadSel();
    if (restored && restored.color) {
      setCurColor(restored.color);
      const { r, g, b } = restored.color;
      D.cs.style.backgroundColor = restored.hex;
      D.sh.textContent = (restored.hex || '#------').toUpperCase();
      D.sh.style.color = contrastColor(restored.color);
      updateDisplay(restored.color);
    }
  }

  function toggleModal(m) { if (m.hasAttribute('hidden')) m.removeAttribute('hidden'); else m.setAttribute('hidden', ''); }

  function createImgState() {
    const id = ++idCounter;
    const state = {
      id, srcImg: null, offCvs: null, offCtx: null, zoomLevel: 1,
      imageRect: { x: 0, y: 0, w: 0, h: 0, bs: 1, s: 1 },
      dominantColors: []
    };
    images[id] = state;
    return state;
  }

  function switchImage(id) {
    if (activeId === id) return;
    activeId = id;
    const s = images[id];
    if (s) {
      loadHist();
      _favs = loadFavs();
      _locked = loadLocks();
      if (s.offCtx) {
        D.ph.style.display = 'none';
        s.zoomLevel = s.zoomLevel || 1;
        renderState(s);
      }
    }
    renderTabs();
    updateStatus();
  }

  function renderTabs() {
    const ids = Object.keys(images);
    D.tabs.hidden = ids.length === 0;
    D.tabsScroll.innerHTML = '';
    ids.forEach(id => {
      const s = images[id];
      const tab = document.createElement('button');
      tab.className = 'img-tab' + (id === activeId ? ' active' : '');
      tab.textContent = s.name || `图片 ${id}`;
      tab.addEventListener('click', () => switchImage(id));
      const close = document.createElement('span');
      close.className = 'tab-close'; close.textContent = '×';
      close.addEventListener('click', e => { e.stopPropagation(); closeImage(id); });
      tab.appendChild(close);
      D.tabsScroll.appendChild(tab);
    });
  }

  function closeImage(id) {
    if (Object.keys(images).length <= 1) { toast('至少保留一张图片'); return; }
    delete images[id];
    if (activeId === id) {
      const remaining = Object.keys(images);
      switchImage(remaining[remaining.length - 1]);
    }
    renderTabs();
  }

  function setupCanvas() {
    new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(width * dpr), h = Math.floor(height * dpr);
        if (w !== canvasW || h !== canvasH) {
          canvasW = w; canvasH = h;
          D.cv.width = w; D.cv.height = h;
          const s = imgState();
          if (s && s.offCtx) { fitImg(s); renderState(s); updateStatus(); } else drawChk();
        }
      }
    }).observe(D.wr);
  }

  function drawChk() {
    if (canvasW < 2 || canvasH < 2) return;
    const c = D.ctx;
    c.fillStyle = '#fff'; c.fillRect(0, 0, canvasW, canvasH);
    c.fillStyle = '#e8e8e8';
    const sz = Math.max(8, Math.floor(canvasW / 80));
    for (let y = 0; y < canvasH; y += sz) for (let x = 0; x < canvasW; x += sz) if ((Math.floor(x / sz) + Math.floor(y / sz)) % 2 === 0) c.fillRect(x, y, sz, sz);
  }

  function onFileSelect(e) {
    const files = [...e.target.files];
    files.forEach(f => loadImg(f));
    D.fi.value = '';
  }

  function loadImg(file) {
    if (!file.type.startsWith('image/')) { toast('不支持的格式'); return; }
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => processImg(img, file.name);
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  }

  function processImg(img, name) {
    const state = createImgState();
    state.name = name || `图片 ${state.id}`;
    let sw = img.width, sh = img.height;
    if (sw > MAX_IMG || sh > MAX_IMG) { const r = Math.min(MAX_IMG / sw, MAX_IMG / sh); sw = Math.round(sw * r); sh = Math.round(sh * r); }
    state.offCvs = document.createElement('canvas');
    state.offCvs.width = sw; state.offCvs.height = sh;
    state.offCtx = state.offCvs.getContext('2d');
    state.offCtx.drawImage(img, 0, 0, sw, sh);
    state.zoomLevel = 1;
    state.dominantColors = [];
    activeId = state.id;
    D.ph.style.display = 'none'; D.zl.hidden = false;
    loadHist();
    _favs = loadFavs();
    _locked = loadLocks();
    fitImg(state); renderState(state); updateStatus();
    D.cv.style.cursor = 'crosshair';
    renderTabs();
    if (Object.keys(images).length === 1) D.tabs.removeAttribute('hidden');
    requestIdleCallback ? requestIdleCallback(() => extractDominant()) : setTimeout(extractDominant, 200);
  }

  function fitImg(s) {
    let cw = canvasW, ch = canvasH;
    if (cw < 10 || ch < 10) {
      const r = D.wr.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cw = Math.floor(r.width * dpr); ch = Math.floor(r.height * dpr);
      if (cw > 10 && ch > 10) { canvasW = cw; canvasH = ch; D.cv.width = cw; D.cv.height = ch; }
    }
    const iw = s.offCvs.width, ih = s.offCvs.height;
    const bs = Math.min(cw / iw, ch / ih, 1);
    const sc = bs * s.zoomLevel;
    s.imageRect = { x: (cw - iw * sc) / 2, y: (ch - ih * sc) / 2, w: iw * sc, h: ih * sc, bs, s: sc };
  }

  function renderState(s) {
    drawChk();
    if (!s || !s.offCtx) return;
    D.ctx.drawImage(s.offCvs, s.imageRect.x, s.imageRect.y, s.imageRect.w, s.imageRect.h);
    D.zl.hidden = s.zoomLevel === 1;
    if (s.zoomLevel !== 1) D.zl.textContent = `${Math.round(s.zoomLevel * 100)}%`;
    D.pl.hidden = panOffset.x === 0 && panOffset.y === 0;
    if (!D.pl.hidden) D.pl.textContent = `(${Math.round(panOffset.x)}, ${Math.round(panOffset.y)})`;
  }

  function inside(cx, cy, s) {
    const r = s.imageRect;
    return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
  }
  function c2i(cx, cy, s) { return { x: Math.round((cx - s.imageRect.x) / s.imageRect.s), y: Math.round((cy - s.imageRect.y) / s.imageRect.s) }; }

  function gcc(e) {
    const r = D.cv.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * (canvasW / r.width), y: (cy - r.top) * (canvasH / r.height) };
  }

  function getPx(ix, iy, s) {
    if (!s || !s.offCtx) return null;
    ix = Math.max(0, Math.min(ix, s.offCvs.width - 1));
    iy = Math.max(0, Math.min(iy, s.offCvs.height - 1));
    const d = s.offCtx.getImageData(ix, iy, 1, 1).data;
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

  function updateDisplay(color) {
    const hex = rgb2h(color.r, color.g, color.b);
    const hsl = rgb2hsl(color.r, color.g, color.b);
    D.hv.textContent = hex.toUpperCase();
    D.rv.textContent = `rgb(${color.r}, ${color.g}, ${color.b})`;
    D.hslv.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const nm = findName(color.r, color.g, color.b);
    if (nm) { D.cn.hidden = false; D.cnv.textContent = nm; } else D.cn.hidden = true;
    D.sH.value = hsl.h; D.svH.textContent = hsl.h;
    D.sS.value = hsl.s; D.svS.textContent = hsl.s;
    D.sL.value = hsl.l; D.svL.textContent = hsl.l;
    updatePalette(color);
    checkContrast();
  }

  function updatePalette(color) {
    const hsl = rgb2hsl(color.r, color.g, color.b);
    D.ps.hidden = false;
    renderPal('paletteComplementary', [gcs(hsl2rgb((hsl.h + 180) % 360, hsl.s, hsl.l), 'hex')]);
    renderPal('paletteAnalogous', [gcs(hsl2rgb((hsl.h + 30) % 360, hsl.s, hsl.l), 'hex'), gcs(hsl2rgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l), 'hex')]);
    renderPal('paletteTriadic', [gcs(hsl2rgb((hsl.h + 120) % 360, hsl.s, hsl.l), 'hex'), gcs(hsl2rgb((hsl.h + 240) % 360, hsl.s, hsl.l), 'hex')]);
  }

  function renderPal(id, hexes) {
    const c = $(id).querySelector('.palette-colors');
    c.innerHTML = '';
    hexes.forEach(h => {
      const el = document.createElement('div');
      el.className = 'palette-swatch'; el.style.backgroundColor = h; el.dataset.hex = h.toUpperCase();
      el.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(h.toUpperCase()); toast(`已复制 ${h.toUpperCase()}`); });
      c.appendChild(el);
    });
  }

  function extractDominant() {
    const s = imgState();
    if (!s || !s.offCtx) return;
    D.dl.innerHTML = '<p class="empty-hint" style="font-size:10px">提取中…</p>';
    D.ds.hidden = false;
    const w = s.offCvs.width, h = s.offCvs.height;
    const step = Math.max(1, Math.floor(Math.sqrt(w * h / 5000)));
    const data = s.offCtx.getImageData(0, 0, w, h).data;
    const buckets = {};
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = Math.round(data[i] / 32) * 32, g = Math.round(data[i + 1] / 32) * 32, b = Math.round(data[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;
        if (buckets[key]) buckets[key].count++;
        else buckets[key] = { r: data[i], g: data[i + 1], b: data[i + 2], count: 1 };
      }
    }
    const sorted = Object.values(buckets).sort((a, b) => b.count - a.count).slice(0, DOM_CNT);
    if (s) s.dominantColors = sorted;
    D.dl.innerHTML = '';
    sorted.forEach(c => {
      const hex = rgb2h(c.r, c.g, c.b);
      const el = document.createElement('div');
      el.className = 'dominant-item'; el.style.backgroundColor = hex; el.dataset.hex = hex.toUpperCase();
      el.addEventListener('click', () => { navigator.clipboard.writeText(hex.toUpperCase()); toast(`已复制 ${hex.toUpperCase()}`); });
      D.dl.appendChild(el);
    });
  }

  function checkContrast() {
    if (!_curColor) return;
    const input = D.cti.value.trim();
    if (!input || !/^#[0-9a-f]{6}$/i.test(input)) { D.ctr.innerHTML = ''; D.cm.hidden = false; return; }
    D.cm.hidden = false;
    const r2 = parseInt(input.slice(1, 3), 16), g2 = parseInt(input.slice(3, 5), 16), b2 = parseInt(input.slice(5, 7), 16);
    const lum1 = luminance(_curColor.r, _curColor.g, _curColor.b);
    const lum2 = luminance(r2, g2, b2);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    const aaNorm = ratio >= 4.5, aaLarge = ratio >= 3, aaaNorm = ratio >= 7, aaaLarge = ratio >= 4.5;
    D.ctr.innerHTML = `
      <div class="contrast-row">对比度 <strong>${ratio.toFixed(2)}:1</strong></div>
      <div class="contrast-row">
        <span class="contrast-badge ${aaNorm ? 'pass' : 'fail'}">AA ${aaNorm ? '✓' : '✗'}</span> 正文
        <span class="contrast-badge ${aaLarge ? 'pass' : 'fail'}">AA ${aaLarge ? '✓' : '✗'}</span> 大文本
        <span class="contrast-badge ${aaaNorm ? 'pass' : 'fail'}">AAA ${aaaNorm ? '✓' : '✗'}</span> 正文
        <span class="contrast-badge ${aaaLarge ? 'pass' : 'fail'}">AAA ${aaaLarge ? '✓' : '✗'}</span> 大文本
      </div>`;
  }

  function luminance(r, g, b) {
    const [R, G, B] = [r / 255, g / 255, b / 255].map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function onCanvasClick(e) {
    if (!imgState() || mode === 'eyedropper' || mode !== 'click') return;
    const pos = gcc(e), s = imgState();
    if (!inside(pos.x, pos.y, s)) return;
    const ic = c2i(pos.x, pos.y, s);
    const color = getPx(ic.x, ic.y, s);
    if (color) { selectColor(color); showTooltip(pos.x, pos.y, color); }
  }

  function onMouseDown(e) {
    const s = imgState();
    if (!s) return;
    const pos = gcc(e);

    if (mode === 'region') {
      if (!inside(pos.x, pos.y, s)) return;
      isPanning = false;
      isDragging = true; dragStart = { x: pos.x, y: pos.y }; dragEnd = { x: pos.x, y: pos.y };
      return;
    }

    if (s.zoomLevel > 1 && (inside(pos.x, pos.y, s) || true)) {
      isPanning = true; panStart = { x: e.clientX, y: e.clientY };
      D.wr.classList.add('panning');
      return;
    }
  }

  let isDragging = false, dragStart = null, dragEnd = null;

  function onMouseMove(e) {
    const s = imgState();
    if (!s) return;
    const pos = gcc(e);
    const inn = inside(pos.x, pos.y, s);
    D.cv.style.cursor = inn ? 'crosshair' : 'default';

    if (isPanning) {
      const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
      s.imageRect.x += dx; s.imageRect.y += dy;
      panOffset.x += dx; panOffset.y += dy;
      panStart = { x: e.clientX, y: e.clientY };
      renderState(s); return;
    }

    if (isDragging && mode === 'region') { dragEnd = { x: pos.x, y: pos.y }; renderState(s); return; }

    if (inn) {
      const ic = c2i(pos.x, pos.y, s);
      const color = getPx(ic.x, ic.y, s);
      if (color) {
        D.mg.style.display = 'flex';
        updateMag(e, color, ic, s);
        if (mode === 'eyedropper' || altHeld) {
          selectColor(color, false);
          showTooltip(pos.x, pos.y, color);
          D.st.textContent = `🔍 ${gcs(color, 'hex')} · (${ic.x}, ${ic.y})`;
        } else {
          if (!_curColor) D.st.textContent = `(${ic.x}, ${ic.y}) · ${gcs(color, 'hex')}`;
        }
      }
    } else { D.mg.style.display = 'none'; }
  }

  function onMouseEnter(e) {
    const s = imgState();
    if (!s) return;
    const pos = gcc(e);
    D.mg.style.display = inside(pos.x, pos.y, s) ? 'flex' : 'none';
  }

  function onMouseLeave() {
    if (isDragging && mode === 'region') { isDragging = false; dragStart = null; dragEnd = null; const s = imgState(); if (s) renderState(s); }
    D.mg.style.display = 'none'; isPanning = false; D.wr.classList.remove('panning');
  }

  function onMouseUp() {
    if (isPanning) { isPanning = false; D.wr.classList.remove('panning'); return; }
    if (!isDragging || mode !== 'region') return;
    isDragging = false;
    if (!dragStart || !dragEnd) return;
    const s = imgState();
    if (!s) return;
    const x1 = Math.min(dragStart.x, dragEnd.x), y1 = Math.min(dragStart.y, dragEnd.y);
    const x2 = Math.max(dragStart.x, dragEnd.x), y2 = Math.max(dragStart.y, dragEnd.y);
    const p1 = c2i(x1, y1, s), p2 = c2i(x2, y2, s);
    const avg = getRegionAvg(p1.x, p1.y, p2.x, p2.y, s);
    if (avg) { selectColor(avg); showTooltip((x1 + x2) / 2, (y1 + y2) / 2, avg); }
    dragStart = null; dragEnd = null; renderState(s);
  }

  function onTouchStart(e) { e.preventDefault(); const t = e.touches[0]; D.cv.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY })); }
  function onTouchMove(e) { e.preventDefault(); const t = e.touches[0]; D.cv.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY })); }
  function onTouchEnd(e) {
    D.cv.dispatchEvent(new MouseEvent('mouseup'));
    const t = e.changedTouches[0];
    D.cv.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY }));
  }

  function getRegionAvg(ix1, iy1, ix2, iy2, s) {
    if (!s || !s.offCtx) return null;
    ix1 = Math.max(0, Math.min(ix1, s.offCvs.width - 1));
    iy1 = Math.max(0, Math.min(iy1, s.offCvs.height - 1));
    ix2 = Math.max(0, Math.min(ix2, s.offCvs.width - 1));
    iy2 = Math.max(0, Math.min(iy2, s.offCvs.height - 1));
    const w = ix2 - ix1 + 1, h = iy2 - iy1 + 1;
    if (w <= 0 || h <= 0) return null;
    const d = s.offCtx.getImageData(ix1, iy1, w, h).data;
    const c = w * h; let tr = 0, tg = 0, tb = 0;
    for (let i = 0; i < c; i++) { tr += d[i * 4]; tg += d[i * 4 + 1]; tb += d[i * 4 + 2]; }
    return { r: Math.round(tr / c), g: Math.round(tg / c), b: Math.round(tb / c) };
  }

  function selectColor(color, saveToHist) {
    if (saveToHist === undefined) saveToHist = true;
    setCurColor(color);
    const hex = rgb2h(color.r, color.g, color.b);
    D.cs.style.backgroundColor = hex;
    D.sh.textContent = hex.toUpperCase();
    D.sh.style.color = contrastColor(color);
    updateDisplay(color);
    D.cb.querySelector('.btn-text').textContent = '复制色号';
    D.cb.style.background = '';
    if (saveToHist) { addHist(hex, color); saveSel(); }
    updateStatus();
  }

  function contrastColor(color) { const l = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255; return l > 0.5 ? '#1a1f2e' : '#e8eaed'; }

  function updateMag(e, color, ic, s) {
    const rect = D.cv.getBoundingClientRect();
    const cx = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    D.mg.style.left = cx + 'px'; D.mg.style.top = cy + 'px';
    const half = Math.floor(MAG_SZ / 2);
    const d = s.offCtx.getImageData(Math.max(0, ic.x - half), Math.max(0, ic.y - half), MAG_SZ, MAG_SZ);
    D.mgcx.putImageData(d, 0, 0);
    D.mgh.textContent = rgb2h(color.r, color.g, color.b).toUpperCase();
    D.mgco.textContent = `(${ic.x}, ${ic.y})`;
  }

  function showTooltip(cx, cy, color) {
    const hex = rgb2h(color.r, color.g, color.b);
    D.tts.style.backgroundColor = hex; D.tth.textContent = hex.toUpperCase();
    const ww = D.wr.getBoundingClientRect().width, wh = D.wr.getBoundingClientRect().height;
    D.tt.style.left = (ww / 2) + 'px'; D.tt.style.top = (wh * 0.6) + 'px';
    D.tt.style.transform = 'translate(-50%, -50%)'; D.tt.style.display = 'flex';
    clearTimeout(D.tt._t);
    D.tt._t = setTimeout(() => { D.tt.style.display = 'none'; }, 2000);
  }

  function addHist(hex, color) {
    if (_history.length > 0 && _history[_history.length - 1].hex === hex) return;
    _history.push({ hex, color: { r: color.r, g: color.g, b: color.b } });
    if (_history.length > HIST_MAX) _history.shift();
    saveHist(); renderHist();
  }

  function renderHist() {
    const items = favOnly ? _history.filter(h => _favs.has(h.hex)) : _history;
    D.hc.textContent = `${items.length}/${HIST_MAX}`;
    if (items.length === 0) { D.hl.innerHTML = `<p class="empty-hint">${favOnly ? '暂无收藏' : '暂无记录'}</p>`; D.cl.classList.add('hidden'); return; }
    D.cl.classList.remove('hidden');
    D.hl.innerHTML = '';
    items.forEach((item, idx) => {
      const realIdx = _history.indexOf(item);
      const wr = document.createElement('div');
      wr.className = 'history-item' + (isLocked(item.hex) ? ' locked' : '');
      wr.style.backgroundColor = item.hex;

      const del = document.createElement('button');
      del.className = 'delete-btn'; del.textContent = '×';
      del.addEventListener('click', e => { e.stopPropagation(); _history.splice(realIdx, 1); _favs.delete(item.hex); saveHist(); saveFavs(); renderHist(); });

      const fav = document.createElement('button');
      const isFav = _favs.has(item.hex);
      fav.className = 'fav-btn' + (isFav ? ' favorited' : '');
      fav.textContent = isFav ? '★' : '☆';
      fav.addEventListener('click', e => { e.stopPropagation(); if (_favs.has(item.hex)) _favs.delete(item.hex); else _favs.add(item.hex); saveFavs(); renderHist(); });

      wr.appendChild(del); wr.appendChild(fav);
      wr.addEventListener('click', () => {
        const c = item.color;
        setCurColor({ r: c.r, g: c.g, b: c.b });
        D.cs.style.backgroundColor = item.hex;
        D.sh.textContent = item.hex.toUpperCase();
        D.sh.style.color = contrastColor(c);
        updateDisplay(c);
        D.cb.querySelector('.btn-text').textContent = '复制色号';
        D.cb.style.background = '';
      });
      D.hl.appendChild(wr);
    });
  }

  function copyColor(fmt) {
    if (!_curColor) { toast('还没有取色'); return; }
    const text = gcs(_curColor, fmt);
    navigator.clipboard.writeText(text).then(() => {
      const labels = { hex: 'HEX', rgb: 'RGB', hsl: 'HSL' };
      D.cb.querySelector('.btn-text').textContent = `✅ ${labels[fmt]} 已复制`;
      D.cb.style.background = '#0d7377';
      setTimeout(() => { D.cb.querySelector('.btn-text').textContent = '复制色号'; D.cb.style.background = ''; }, 2000);
    }).catch(() => toast('复制失败'));
  }

  function resetZoom() {
    const s = imgState();
    if (!s) return;
    if (s.zoomLevel !== 1) { s.zoomLevel = 1; panOffset = { x: 0, y: 0 }; fitImg(s); renderState(s); updateStatus(); toast('已重置缩放'); }
  }

  function onSliderChange() {
    if (!_curColor) return;
    const h = parseInt(D.sH.value), s = parseInt(D.sS.value), l = parseInt(D.sL.value);
    D.svH.textContent = h; D.svS.textContent = s; D.svL.textContent = l;
    const rgb = hsl2rgb(h, s, l);
    setCurColor(rgb);
    const hex = rgb2h(rgb.r, rgb.g, rgb.b);
    D.cs.style.backgroundColor = hex; D.sh.textContent = hex.toUpperCase();
    D.sh.style.color = contrastColor(rgb);
    updateDisplay(rgb);
    D.st.textContent = `微调中 · ${hex.toUpperCase()}`;
  }

  function showExport() {
    if (!_curColor) { toast('还没有取色'); return; }
    const active = document.querySelector('.export-tab.active');
    const type = active ? active.dataset.type : 'css';
    const all = [_curColor, ..._history.map(h => h.color).slice(0, 9)];
    const hexes = all.map(c => gcs(c, 'hex'));
    let code = '';
    switch (type) {
      case 'css':
        code = ':root {\n'; hexes.forEach((h, i) => { code += `  --color-${i + 1}: ${h};\n`; }); code += '}'; break;
      case 'tailwind':
        code = '@theme {\n'; hexes.forEach((h, i) => { code += `  --color-${i + 1}: ${h};\n`; }); code += '}'; break;
      case 'scss':
        hexes.forEach((h, i) => { code += `$${i === 0 ? 'primary' : 'color-' + (i + 1)}: ${h};\n`; }); break;
    }
    D.ec.textContent = code;
    toggleModal(D.em);
  }

  function exportPaletteImg() {
    const colors = _history.map(h => h.hex);
    if (colors.length === 0 && !_curColor) { toast('没有颜色可导出'); return; }
    const all = _curColor ? [_curColor, ..._history.map(h => h.color)] : _history.map(h => h.color);
    const hexes = all.map(c => gcs(c, 'hex'));
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    const gap = 4, sw = 60, sh = 40, cols = Math.min(hexes.length, 5), rows = Math.ceil(hexes.length / cols);
    cvs.width = cols * (sw + gap) + gap; cvs.height = rows * (sh + 20 + gap) + gap;
    ctx.fillStyle = '#1a1f2e'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    hexes.forEach((h, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = gap + col * (sw + gap), y = gap + row * (sh + 20 + gap);
      ctx.fillStyle = h; ctx.fillRect(x, y, sw, sh);
      ctx.fillStyle = '#e8eaed'; ctx.font = '10px monospace';
      ctx.textAlign = 'center'; ctx.fillText(h, x + sw / 2, y + sh + 14);
    });
    const link = document.createElement('a');
    link.download = 'palette.png';
    link.href = cvs.toDataURL();
    link.click();
    toast('色卡图片已下载');
  }

  function sharePalette() {
    if (_history.length === 0) { toast('还没有取色记录'); return; }
    const data = _history.map(h => h.hex.replace('#', '')).join(',');
    const url = `${location.origin}${location.pathname}?p=${data}`;
    navigator.clipboard.writeText(url).then(() => toast('分享链接已复制')).catch(() => toast('复制失败，请手动复制'));
  }

  function onWheel(e) {
    const s = imgState();
    if (!s) return; e.preventDefault();
    const d = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const n = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s.zoomLevel + d));
    if (n !== s.zoomLevel) { s.zoomLevel = n; fitImg(s); renderState(s); updateStatus(); }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (isDragging) { isDragging = false; dragStart = null; dragEnd = null; const s = imgState(); if (s) renderState(s); return; }
      if (!D.hm.hasAttribute('hidden')) { toggleModal(D.hm); return; }
      if (!D.em.hasAttribute('hidden')) { toggleModal(D.em); return; }
      D.ct.setAttribute('hidden', ''); return;
    }
    if (e.key === '?') { toggleModal(D.hm); return; }
    if (e.key === 'Alt') { altHeld = true; if (imgState()) D.st.textContent = '🔍 按住 Alt：吸管模式'; return; }
    if (!imgState()) return;
    if (e.key === '0' && !e.ctrlKey && !e.metaKey) { resetZoom(); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); const s = imgState(); const n = Math.min(ZOOM_MAX, s.zoomLevel + ZOOM_STEP); if (n !== s.zoomLevel) { s.zoomLevel = n; fitImg(s); renderState(s); updateStatus(); } return; }
    if (e.key === '-') { e.preventDefault(); const s = imgState(); const n = Math.max(ZOOM_MIN, s.zoomLevel - ZOOM_STEP); if (n !== s.zoomLevel) { s.zoomLevel = n; fitImg(s); renderState(s); updateStatus(); } return; }
    if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) { copyColor('hex'); return; }
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) { extractDominant(); return; }
  }

  function onKeyUp(e) {
    if (e.key === 'Alt') { altHeld = false; if (imgState()) updateStatus(); }
  }

  function onCtxMenu(e) {
    e.preventDefault();
    D.ct.style.left = (e.clientX - D.wr.getBoundingClientRect().left) + 'px';
    D.ct.style.top = (e.clientY - D.wr.getBoundingClientRect().top) + 'px';
    D.ct.removeAttribute('hidden');
  }

  function hideCtx() { D.ct.setAttribute('hidden', ''); }
  $$('.ctx-item').forEach(item => { item.addEventListener('click', () => { D.ct.setAttribute('hidden', ''); switch (item.dataset.action) { case 'copy': if (_curColor) copyColor('hex'); break; case 'reset': resetZoom(); break; case 'dominant': extractDominant(); break; } }); });

  function dEnter(e) { e.preventDefault(); dragCounter++; if (dragCounter === 1) D.dob.classList.add('active'); }
  function dOver(e) { e.preventDefault(); }
  function dLeave(e) { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dragCounter = 0; D.dob.classList.remove('active'); } }
  function dDrop(e) { e.preventDefault(); dragCounter = 0; D.dob.classList.remove('active'); [...e.dataTransfer.files].forEach(f => { if (f.type.startsWith('image/')) loadImg(f); }); }

  function updateStatus() {
    const s = imgState();
    if (!s) { D.st.textContent = '就绪'; return; }
    const parts = [`${s.offCvs.width}×${s.offCvs.height}`];
    if (mode === 'click') parts.push('点击取色');
    else if (mode === 'eyedropper') parts.push('🔍 吸管取色');
    else parts.push('区域取色');
    if (s.zoomLevel !== 1) parts.push(`${Math.round(s.zoomLevel * 100)}%`);
    if (_curColor) parts.push(gcs(_curColor, 'hex'));
    D.st.textContent = parts.join(' · ');
  }

  function toast(msg) {
    D.ts.textContent = msg; D.ts.classList.add('show');
    clearTimeout(D.ts._t);
    D.ts._t = setTimeout(() => D.ts.classList.remove('show'), 3000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
