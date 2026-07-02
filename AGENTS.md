# 项目规范

## 版本号

当前版本：v1.8.0

## 发布流程

1. 每次非修复式更新（含新功能、体验优化）必须同步更新 README.md 和 CHANGELOG.md。
2. GitHub 上的提交记录必须详细，包含：问题描述 → 根因分析 → 修复措施。
3. 每次非修复式更新完成后，由我审查通过后说"部署"再执行 git push（含推送仓库和标签）以及 Pages rebuild。未经审查不得将代码上传至 GitHub。

## 技术栈

原生 HTML + CSS + JavaScript，零依赖。

## 代码风格

- 不添加注释
- 遵循现有代码模式

## 积累的经验

### 已知 Bug 模式

1. **`isLocked`/类似函数缺失** — `renderHist()` 中引用了 `isLocked()` 但该函数从未定义。若未来发现历史区域或相关功能崩溃，优先检查 `renderHist` 等渲染函数中是否存在引用但未定义的标识符。
2. **逐级检查 `ReferenceError`** — 当一个功能看似正常但另一功能异常（如导出无代码），检查是否存在某项功能崩溃后阻断 `init()` 后续代码执行。可用浏览器的"Pause on exceptions"定位。
3. **`AudioContext` 自动播放策略** — 浏览器要求 AudioContext 在用户手势后才能 `resume()`。`resume()` 返回 Promise，必须 `await` 才能确保后续振荡器正常播放。未 await 会导致需要两次点击才发声。

### 关键约定

- 每次非修复式更新完成后，必须由用户审查通过并说"部署"才执行 `git push`。
- 提交信息必须包含：问题描述 → 根因分析 → 修复措施三部分。
- 发布时创建对应版本 tag（如 `v1.7.0`）并通过 `gh api` 触发 Pages rebuild。
- 所有页面加载时的错误均会阻断 `init()` 后续流程，因此 `init()` 中的每步操作都必须稳定无异常。

### v1.7.0 经验

1. **拖拽平移后 `click` 事件抑制** — `mouseup` 过后浏览器会触发 `click`。若拖拽平移了画布，需用 `panMoved` 标记 + `_suppressClick` 标志在 `onMouseUp` 中设置，`onCanvasClick` 中检查和清除，否则平移后松手会误取色。
2. **`disabled` 替代 `display:none` 避免布局抖动** — 用 `display:none` 显隐按钮会导致父容器高度突变、界面"拉扯"。改用 `disabled` 属性保持占据空间，配合 `:disabled` CSS 灰态即可。
3. **DOM `replaceWith` 触发同步 `blur` 事件** — `input.replaceWith(otherNode)` 会在移除 `input` 时同步派发 `blur`。Escape 取消路径需设取消标记（如 `_hexCancel` ），在 `blur` 中检查并跳过提交逻辑。
4. **CSS 动画与 DOM 全量重建冲突** — `renderHist()` 用 `innerHTML = ''` 重建全部元素，动画类（`favorited`）在新元素上从初始态开始，不会播放动画。解决方案：先用 `classList.toggle` 在旧元素上即时切换，再 `setTimeout(renderHist, 150)` 延迟重建，给浏览器留出动画播放窗口。
5. **`selectColor()` 的副驾驶作用** — `selectColor(color)`（saveToHist 默认 true）会执行 `addHist` + `playPickSound` + `saveSel` + `updateStatus` + `updateExportBtn`。撤销或恢复等场景需显式传 `selectColor({...}, false)` 阻止历史重复追加，并单独调用 `saveSel()` 持久化当前选中色。
