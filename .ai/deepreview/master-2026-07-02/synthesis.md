# Code Review Synthesis — 2026-07-02

## Overall Assessment
Generally well-structured codebase with clean patterns. Two functional correctness issues found (dead `sampleSize` state and pick sound firing on every mousemove in eyedropper mode) that affect user-facing behavior. One structural HTML issue (missing closing tag). Overall safe to merge after addressing the critical items.

## Critical Issues (must fix before merge)

### Pick Sound Fires Continuously in Eyedropper Mode
**File:** script.js:384,403
**Severity:** critical
**Category:** correctness
**What is wrong:** In `onMouseMove`, when `mode==='eyedropper'` or `altHeld`, `selectColor(color,false)` is called on every pixel the mouse crosses. `selectColor()` unconditionally calls `playPickSound()` at line 403, creating a new Web Audio oscillator on every mousemove event. In eyedropper mode, this means the pick sound fires dozens of times per second as the user moves the mouse, producing a continuous audio glitch.
**Impact:** Extremely poor UX in eyedropper mode — rapid, overlapping sound triggers make the feature unusable.
**Recommended change:** In `selectColor`, gate `playPickSound()` behind the `saveToHist` parameter: `if (saveToHist) playPickSound();`. The sound should only play on intentional picks (click or region select).

### Sample Size (网格) Controls Are Non-Functional
**File:** script.js:36,139
**Severity:** critical
**Category:** correctness
**What is wrong:** `sampleSize` is declared and assigned by the "网格" UI buttons (3/5/7), but is never read by any color-sampling function. Both `getPx()` (line 280) and the click/region handlers sample a single pixel or region average respectively — neither uses `sampleSize` to perform N×N area averaging. Users can interact with the grid-size buttons but they have no effect whatsoever.
**Impact:** Users are misled into believing they can control sample precision; the feature is dead UI.
**Recommended change:** Either implement N×N averaging in the click path using `sampleSize` (call `getRegionAvg` with a centered N×N box), or remove the sample-picker UI from the toolbar and the `sampleSize` variable.

## Warnings (should fix)

### Missing Closing `</div>` for `hsl-sliders` Causes Incorrect DOM Nesting
**File:** index.html:110-124
**Severity:** warning
**Category:** correctness
**What is wrong:** The `<div class="hsl-sliders">` opened on line 110 is never explicitly closed. The next `</div>` at the same indentation level is on line 124, which browsers will treat as closing `hsl-sliders`. This nests the `copyBtn` button (line 123) inside `hsl-sliders` instead of as a sibling in `color-details`.
**Impact:** While browsers recover gracefully, the DOM structure differs from intent. Could cause styling or layout issues if the sliders container receives CSS that affects its children unexpectedly.
**Recommended change:** Insert `</div>` between line 122 and line 123 to properly close the `hsl-sliders` div before the `copyBtn` button.

### Lock Feature Is Purely Cosmetic With No Functional Enforcement
**File:** script.js:38,106-107,114,426,436
**Severity:** warning
**Category:** correctness
**What is wrong:** The `_locked` Set is loaded from localStorage, persisted via `saveLocks()`, and checked by `isLocked()` to apply a CSS border class. However: (a) there is no UI anywhere to lock/unlock items (no `.add()` or `.delete()` calls on `_locked`), so the set is always empty; (b) even if items were locked, the delete handler at line 438 does not check `isLocked()` before splicing, so locked items can still be deleted freely.
**Impact:** Dead code that adds confusion — the `locked` CSS class (`.history-item.locked`) exists but can never be triggered through normal use, and if triggered manually, the lock is not enforced.
**Recommended change:** Either implement lock/unlock UI (e.g., right-click or long-press on history items) with enforcement in the delete handler, or remove the `_locked`/`isLocked`/`saveLocks`/`loadLocks` code and the `.locked` CSS rule entirely.

### Shared Palette URLs Cannot Be Restored
**File:** script.js:486
**Severity:** warning
**Category:** correctness
**What is wrong:** `sharePalette()` generates a URL with `?p=<hexes>` query parameter, but the app never parses `location.search` or `URLSearchParams` to restore a palette from that URL. Visiting a shared link simply loads the app in its default state.
**Impact:** The sharing feature is one-directional — users can copy a share link, but recipients see nothing when they open it.
**Recommended change:** In `init()`, add logic to parse `?p=` from the URL, decode the hex values, and either pre-populate the history or display a "shared palette" overlay.

## Suggestions (nice to have)

### Context Menu Listeners Attached Outside `init()`
**File:** script.js:516
**Severity:** suggestion
**Category:** architecture
**What is wrong:** `$$('.ctx-item').forEach(...)` runs at script parse time (outside `init()`), unlike all other event binding which happens inside `init()` after `DOMContentLoaded`.
**Impact:** Works correctly because the script loads at end of `<body>`, but is architecturally inconsistent and fragile if the script were ever loaded earlier.
**Recommended change:** Move the context menu listener binding inside `init()` for consistency.

### Redundant Condition in `onCanvasClick`
**File:** script.js:366
**Severity:** suggestion
**Category:** maintainability
**What is wrong:** The guard `if (!imgState()||mode==='eyedropper'||mode!=='click') return;` has a redundant check — `mode==='eyedropper'` is already covered by `mode!=='click'`.
**Impact:** No functional impact; purely a readability concern.
**Recommended change:** Simplify to `if (!imgState()||mode!=='click') return;`.

### Status Indicator Always Green
**File:** style.css:19
**Severity:** suggestion
**Category:** maintainability
**What is wrong:** The `.status-dot` is hardcoded to green (`#22c55e`). It never changes to reflect errors, missing images, or other non-ready states.
**Impact:** The status dot is purely decorative and conveys no actionable information.
**Recommended change:** Consider toggling the dot color based on application state (e.g., red on error, yellow on loading) or remove it if it will remain static.

## Documentation Drift
The following doc/comment updates were identified (suggestion-level):
- [ ] The placeholder hints at line 53 of index.html advertise `+`/`-` zoom and drag-to-pan but don't mention the `0` key for 100% reset or `S` for dominant color extraction, while the help modal does list them. Consider aligning the two.

## What Looks Good
- Audio playback pattern (`AudioContext.resume()` + `osc.stop()`) properly handles browser autoplay policies.
- Drag-and-drop with `dragCounter` correctly handles nested element enter/leave events.
- `_suppressClick` / `panMoved` pattern correctly prevents spurious click events after drag-pan.
- `_hexCancel` flag properly handles Escape during inline HEX editing without racing with the `blur` handler.
- `renderHist` correctly uses `innerHTML = ''` for full rebuild and handles delete via stable `realIdx`.
- Alpha channel integration across HEX/RGB/HSL formats is consistent — `rgba()`/`hsla()` emitted when `_alpha < 255`.
- CSS custom properties enable clean light/dark theme toggle.
- `requestIdleCallback` with `setTimeout` fallback is a good progressive enhancement pattern.
- CSS animation classes (`bounce`, `favBounce`) are properly isolated and brief (120ms).
