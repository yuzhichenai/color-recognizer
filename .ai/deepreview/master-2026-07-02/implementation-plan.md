# Implementation Plan — master — 2026-07-02

## Summary
8 fixes: 2 critical (pick sound glitch in eyedropper mode, dead sampleSize UI), 3 warnings (missing closing tag, dead lock feature, unparseable share URLs), 3 suggestions (redundant guard, inconsistent event binding, documentation alignment). Scope: ~30 lines changed across 3 files. Low risk overall.

## Fix Plan

### Fix 1: Pick Sound Fires Continuously in Eyedropper Mode
**File(s):** script.js:403
**Priority:** critical
**Approach:** Gate `playPickSound()` behind the `saveToHist` parameter so it only fires on intentional picks (click or region select), not on every mousemove in eyedropper mode.
**Code change:**
```javascript
// line 403 — replace:
updateStatus(); updateExportBtn(); playPickSound();
// with:
updateStatus(); updateExportBtn(); if (saveToHist) playPickSound();
```
**Verification:** Enter eyedropper mode (or hold Alt), move mouse rapidly over the canvas — no sound should play. Click to pick — sound should play once.

---

### Fix 2: Implement sampleSize (N×N Area Averaging) in Click Path
**File(s):** script.js:364-370
**Priority:** critical
**Approach:** Replace the single-pixel `getPx()` call in `onCanvasClick` with a centered `sampleSize × sampleSize` region average via the existing `getRegionAvg()`. Also simplify the redundant guard condition (addresses Fix 6 suggestion simultaneously).
**Code change:**
```javascript
// lines 364-370 — replace the entire function:
function onCanvasClick(e) {
  if (_suppressClick) { _suppressClick = false; return; }
  if (!imgState() || mode !== 'click') return;
  const pos = gcc(e), s = imgState(); if (!inside(pos.x, pos.y, s)) return;
  const ic = c2i(pos.x, pos.y, s);
  const half = Math.floor(sampleSize / 2);
  const color = getRegionAvg(ic.x - half, ic.y - half, ic.x + half, ic.y + half, s);
  if (color) { _lastPickCoord = { x: ic.x, y: ic.y }; selectColor(color); showTooltip(pos.x, pos.y, color); }
}
```
**Verification:** Set 网格 to 3, click on an area with mixed colors — the picked color should be an average of the 3×3 block, not a single pixel. Repeat with 5 and 7 to confirm different averaging behavior.

---

### Fix 3: Missing Closing `</div>` for hsl-sliders
**File(s):** index.html:122-123
**Priority:** warning
**Approach:** Insert `</div>` between the last slider row (`sliderA`) and the `copyBtn` button so that `copyBtn` is a sibling of the sliders inside `color-details`, not nested inside `hsl-sliders`.
**Code change:**
```html
<!-- line 122, before the closing </div> of the A slider -->
                  <span class="slider-val" id="sliderValA">255</span></div>
              </div>
              <button class="btn-copy" id="copyBtn"><span class="btn-text">复制色号</span></button>
```
The `</div>` after the `A` slider row on line 122 closes the `slider-row`. A new `</div>` must be inserted on its own line after that to close `hsl-sliders`:
```html
                  <span class="slider-val" id="sliderValA">255</span></div>
              </div>
              </div>
              <button class="btn-copy" id="copyBtn"><span class="btn-text">复制色号</span></button>
```
**Verification:** Inspect DOM in DevTools — `copyBtn` should be a direct child of `color-details`, not nested inside `hsl-sliders`.

---

### Fix 4: Remove Dead Lock Feature Code
**File(s):** script.js:38,106-107,114,225,426,436,525; style.css:150
**Priority:** warning
**Approach:** Remove all lock-related code since there is no UI to lock/unlock items and the feature has no functional enforcement. This cleans up dead variables, functions, localStorage operations, and CSS rules.
**Code changes:**

**script.js line 38** — remove `_locked = new Set(), ` from the declaration:
```javascript
// before:
let _curColor = null, _history = [], _favs = new Set(), _locked = new Set(), _search = '', _alpha = 255, _lastPickCoord = null;
// after:
let _curColor = null, _history = [], _favs = new Set(), _search = '', _alpha = 255, _lastPickCoord = null;
```

**script.js lines 106-107** — remove both functions:
```javascript
// remove these two lines entirely:
function saveLocks() { try { localStorage.setItem('cr-locks', JSON.stringify([..._locked])); } catch (_) {} }
function loadLocks() { try { const d = localStorage.getItem('cr-locks'); return d ? new Set(JSON.parse(d)) : new Set(); } catch (_) { return new Set(); } }
```

**script.js line 114** — remove `_locked = loadLocks();`:
```javascript
// before:
_favs = loadFavs(); _locked = loadLocks();
// after:
_favs = loadFavs();
```

**script.js line 225** — remove `_locked = loadLocks();`:
```javascript
// before:
loadHist(); _favs = loadFavs(); _locked = loadLocks();
// after:
loadHist(); _favs = loadFavs();
```

**script.js lines 426** — remove `isLocked` function:
```javascript
// remove this line entirely:
function isLocked(hex) { return _locked.has(hex); }
```

**script.js line 436** — remove the locked class condition:
```javascript
// before:
wr.className = 'history-item' + (isLocked(item.hex) ? ' locked' : '');
// after:
wr.className = 'history-item';
```

**script.js line 525** — remove `_locked = loadLocks();`:
```javascript
// before:
loadHist(); _favs = loadFavs(); _locked = loadLocks();
// after:
loadHist(); _favs = loadFavs();
```

**style.css line 150** — remove the `.history-item.locked` rule:
```css
/* remove this line: */
.history-item.locked { border-color: var(--primary); }
```
**Verification:** App loads without errors. History items render normally. No `_locked` or `isLocked` references remain via grep.

---

### Fix 5: Restore Shared Palette from `?p=` URL Query Parameter
**File(s):** script.js:111-115 (inside `init()`)
**Priority:** warning
**Approach:** Parse `?p=<hexes>` from `location.search` in `init()`. For each valid 6-char hex, decode to RGB and push to `_history`. If items were loaded, select the last color and render history.
**Code change:** Insert after `_favs = loadFavs();` (line 114) and before the onboarding check (line 115):
```javascript
  function init() {
    soundOn = localStorage.getItem(SNDK) !== 'off';
    D.mg.style.display = 'none'; D.hm.setAttribute('hidden',''); D.em.setAttribute('hidden',''); D.onb.setAttribute('hidden','');
    _favs = loadFavs();

    const urlParams = new URLSearchParams(location.search);
    const shared = urlParams.get('p');
    if (shared && _history.length === 0) {
      const hexes = shared.split(',').filter(h => /^[0-9A-Fa-f]{6}$/.test(h));
      hexes.slice(0, HIST_MAX).forEach(h => {
        const hex = '#' + h;
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        addHist(hex, { r, g, b });
      });
      if (_history.length > 0) {
        const last = _history[_history.length - 1];
        selectColor(last.color, false);
        saveSel();
        saveHist();
        renderHist();
        toast(`已加载 ${_history.length} 个共享颜色`);
      }
    }

    if (!localStorage.getItem(ONBK)) D.onb.removeAttribute('hidden');
```
**Verification:** Construct a URL like `...?p=ff0000,00ff00,0000ff` and open it — the history should show red, green, and blue. Without `?p=`, normal behavior is unchanged.

---

### Fix 6: Redundant Condition in `onCanvasClick` Guard
**Note:** Already addressed in Fix 2, which replaces the entire `onCanvasClick` function. The simplified guard `if (!imgState() || mode !== 'click') return;` replaces the redundant `if (!imgState()||mode==='eyedropper'||mode!=='click') return;`.

---

### Fix 7: Move Context Menu Listeners Inside `init()`
**File(s):** script.js:516
**Priority:** suggestion
**Approach:** Move the `$$('.ctx-item').forEach(...)` binding from script-parse time into `init()` for architectural consistency with all other event bindings. Place it after the DOM-reliant event setup (e.g., after line 132).
**Code change:**
```javascript
// Remove from current location (line 516, at script parse time) — delete this line:
$$('.ctx-item').forEach(item=>{item.addEventListener('click',()=>{D.ct.setAttribute('hidden','');switch(item.dataset.action){case'copy':if(_curColor)copyColor('hex');break;case'reset':resetZoom();break;case'dominant':extractDominant();break;}});});

// Insert inside init(), after line 132 (cv contextmenu listener):
// Add:
  $$('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      D.ct.setAttribute('hidden', '');
      switch (item.dataset.action) {
        case 'copy': if (_curColor) copyColor('hex'); break;
        case 'reset': resetZoom(); break;
        case 'dominant': extractDominant(); break;
      }
    });
  });
```
**Verification:** Right-click context menu items (Copy, Reset, Extract Dominant) still work correctly after the move.

---

### Fix 8: Documentation Updates — Align Placeholder Hints with Help Modal
**File(s):** index.html:51-54
**Priority:** suggestion
**Approach:** The placeholder shortcuts display `+`/`-` zoom and drag-to-pan but do not mention the `0` key for 100% reset or `S` for dominant color extraction, while the help modal lists them. Add the missing shortcuts.
**Code change:**
```html
<!-- index.html lines 51-54 — replace the four shortcut spans: -->
            <div class="placeholder-shortcuts">
              <span class="shortcut"><kbd>Ctrl+V</kbd> 粘贴</span>
              <span class="shortcut"><kbd>+</kbd><kbd>-</kbd> 缩放</span>
              <span class="shortcut"><kbd>0</kbd> 100%</span>
              <span class="shortcut"><kbd>拖拽</kbd> 平移</span>
              <span class="shortcut"><kbd>C</kbd> 复制色号</span>
              <span class="shortcut"><kbd>S</kbd> 提取主色调</span>
              <span class="shortcut"><kbd>Alt</kbd> 吸管</span>
              <span class="shortcut"><kbd>?</kbd> 快捷键</span>
            </div>
```
**Verification:** Placeholder area displays `0 100%` and `S 提取主色调` shortcuts matching the help modal entries.

---

## Order of Operations
- Fix 2 and Fix 6 touch the same function — both are resolved in Fix 2's code block.
- Fix 4 (remove lock code) must be applied before Fix 5 (share palette), which adds code near removed lines.
- All other fixes are independent — apply in any order after satisfying the above.

## Risk
- **Fix 2 (sampleSize):** The `getRegionAvg` call uses `getRegionAvg(ic.x-half, ic.y-half, ic.x+half, ic.y+half, s)` which already clamps coordinates internally. No risk of out-of-bounds access. However, edge-case: `sampleSize` of 1 produces a 1×1 region (equivalent to single pixel), which is correct.
- **Fix 4 (dead lock code):** `saveLocks()` is never called anywhere in the codebase — removal has zero side effects. The CSS rule `.history-item.locked` could never be triggered since `_locked` was always empty.
- **Fix 5 (share URL):** The URL parsing only activates when `_history.length === 0` at init time, preventing double-loading if localStorage already has history. The `addHist` function already handles duplicates, so no risk of corrupted state.
