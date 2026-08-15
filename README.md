# 钱迹 · 手机本地记账

参考项目目录截图实现的 Vue 3 手机 H5 记账 PWA。账目和图片保存在当前手机浏览器的 IndexedDB，不上传服务器。

## 本地运行

要求 Node.js 18.20+。

```powershell
npm install
npm run dev
```

手机与电脑连接同一 Wi-Fi 后，打开终端显示的 `Network` 地址即可访问。开发地址可以使用页面，但浏览器通常要求 HTTPS 才允许安装 PWA。

## 构建与部署

```powershell
npm run build
npm run preview
```

把 `dist/` 部署到任意 HTTPS 静态站点。服务器必须将 Vue 路由回退到 `index.html`。首次在线打开后，浏览器会缓存应用壳；随后可离线打开并读取本地账目。

## 手机安装

- Android Chrome/Edge：浏览器菜单 → “安装应用”或“添加到主屏幕”。
- iPhone Safari：分享 → “添加到主屏幕”。
- 安装入口未出现时，确认网站使用 HTTPS，且未处于无痕模式。

## 数据与图片

- 金额以整数分保存，避免小数误差。
- 每笔账目可选择多张图片；上传后立即显示，保存时压缩并写入 IndexedDB。
- 清理浏览器数据、卸载浏览器或更换手机会丢失本地数据。
- 在“设置”中定期导出 ZIP；ZIP 包含账目 JSON 和图片，可在另一台设备导入。

## 验证

```powershell
npm test -- --run
npm run build
npx playwright test
npm audit
```

浏览器测试覆盖 375px、390px、430px 三种手机宽度，以及新增、多图预览、刷新持久化、编辑、删除、统计和 ZIP 导出。

