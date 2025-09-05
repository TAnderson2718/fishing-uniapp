# Miniapp E2E 测试指南

本项目的小程序为 `uni-app` 工程。要运行基于 `miniprogram-automator` 的自动化测试，需要先生成 `mp-weixin` 产物并用微信开发者工具打开，以便生成 `project.config.json`（其中包含 `appid`）。

## 前置准备
1. 安装微信开发者工具（macOS）：
   - 常见 CLI 路径：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
2. 构建 mp-weixin 产物：
   - 在项目根目录或 apps/miniapp 下执行：
     - `npm run build:mp-weixin` 或 `npm run dev:mp-weixin`
   - 构建完成后，记下输出目录（如 `dist/build/mp-weixin`）。
3. 用微信开发者工具打开该输出目录，确保生成 `project.config.json` 且包含 `appid`。

## 运行自动化测试
- 环境变量：
  - `MINIAPP_PROJECT_PATH`：指向上面输出目录（包含 `project.config.json`）
  - `cliPath`（可选）：CLI 可执行路径，如 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- 命令：
  - `cd apps/miniapp && npm i`
  - `npm run test:e2e`

## 注意
- CI 环境下通常无法直接安装与授权微信开发者工具，因此仓库内提供了占位任务。建议在本地或自托管 Runner 上执行小程序自动化测试。

