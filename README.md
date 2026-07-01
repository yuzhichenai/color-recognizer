# 🎨 颜色识别器

> 上传图片，悬停/点击/框选取色，一键复制色号。纯前端，开箱即用。

<p align="center">
  <a href="https://yuzhichenai.github.io/color-recognizer/">
    <img src="https://img.shields.io/badge/在线体验-点击前往-00e5ff?style=for-the-badge" alt="在线体验">
  </a>
  <a href="https://github.com/yuzhichenai/color-recognizer/stargazers">
    <img src="https://img.shields.io/github/stars/yuzhichenai/color-recognizer?style=for-the-badge&color=ff6b35" alt="Stars">
  </a>
  <a href="https://github.com/yuzhichenai/color-recognizer/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-6b7280?style=for-the-badge" alt="License">
  </a>
</p>

<!-- 截图占位 -->
<!-- ![截图](screenshot.png) -->

---

## ✨ 功能一览

### 🎯 取色方式

| 模式 | 操作 | 适用场景 |
|------|------|---------|
| **点击取色** | 点击图片任意位置 | 精确取单个像素色 |
| **吸管取色** 👑 | 鼠标悬停即自动取色 | 快速浏览多个颜色 |
| **区域取色** | 拖拽框选区域，自动计算平均色 | 渐变色、大面积区域 |

> 按住 **`Alt`** 可在任意模式下临时切换为吸管模式。

### 🎨 主题与显示

- **亮/暗主题切换**：顶部 🌓 按钮一键切换，偏好自动保存
- **全屏画布模式**：按 `F` 键隐藏面板，画布最大化

### 📋 颜色信息

- **三格式并排显示**：HEX / RGB / HSL 同时展示，每行右侧独立复制按钮
- **HSL 滑块微调**：取色后拖动滑块微调，色环实时联动
- **颜色名称识别**：自动匹配 150+ 常见颜色名称（珊瑚红 Coral 等）
- **WCAG 对比度检查**：输入另一颜色 HEX，自动计算 AA/AAA 评级

### 🎨 色彩搭配

- **色盲模拟器**：取色后显示红/绿/蓝色盲三种模拟预览
- **图像滤镜**：亮度/对比度/饱和度三滑块，实时影响取色结果
- **色彩搭配**：互补色、近似色、三角调和三组配色方案

### 🖼️ 图片管理

- **多图片标签**：上传多张图片后通过标签栏切换
- **滚轮缩放**：`+` / `-` 或鼠标滚轮
- **拖拽平移**：放大后拖拽画布查看细节
- **一键重置**：双击画布或按 `0` 键恢复 100%
- **右键菜单**：快速复制颜色 / 重置缩放 / 提取主色

### 🗂️ 记录与收藏

- **取色记录**：最多保存 20 条，悬停显示色号
- **星标收藏**：标记重要颜色，支持筛选仅看收藏
- **清空全部**：仅清除非收藏记录
- **数据持久化**：刷新页面不丢失

### 📤 导出与分享

| 功能 | 说明 |
|------|------|
| **📦 导出代码** | CSS 变量 / Tailwind v4 / SCSS |
| **🖼️ 导出色卡** | 导出为 PNG 色卡图（色块 + HEX 标注）|
| **🔗 分享链接** | 取色记录编码为 URL，一键复制分享 |

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+V` | 粘贴图片 |
| `Alt` | 临时吸管模式 |
| `+` / `-` | 放大 / 缩小 |
| `0` | 重置缩放 100% |
| `F` | 全屏画布模式 |
| `C` | 复制当前色号 |
| `S` | 提取图片主色调 |
| `双击` | 重置缩放 |
| `右击` | 快捷菜单 |
| `Esc` | 取消选区 / 关闭弹窗 |
| `?` | 快捷键帮助面板 |

---

## 🚀 快速开始

### 在线使用

访问 [https://yuzhichenai.github.io/color-recognizer/](https://yuzhichenai.github.io/color-recognizer/) 即可。

### 本地运行

```bash
git clone https://github.com/yuzhichenai/color-recognizer.git
cd color-recognizer
open index.html
```

无需安装依赖，浏览器直接打开即可。

---

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **HTML5** | Canvas 2D API 绘制与像素操作 |
| **CSS3** | Grid / Flexbox 布局、backdrop-filter 毛玻璃、CSS 变量 |
| **JavaScript (ES6+)** | ResizeObserver、FileReader、Clipboard API、requestIdleCallback |
| **存储** | localStorage 持久化历史记录与偏好设置 |
| **部署** | GitHub Pages 静态托管 |

零第三方依赖，纯原生实现。

---

## 📋 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)。

**最新版本：v1.6.0**

---

## 📄 协议

[MIT](LICENSE)
