# JUZI Mihomo

面向 Mihomo / Clash Verge Rev 的公开配置模板，适合 Windows 桌面端使用。仓库包含规则配置和一个可选的 Cloudflare Worker 部署方案。

> 公开仓库不包含真实机场订阅地址、节点列表或访问令牌。

## 功能

- 按国内、海外、AI、下载等场景组织策略组。
- AI 策略组保留全部节点入口，便于手动固定节点。
- 通过代理提供者动态加载订阅节点。
- 使用 Cloudflare Worker 在运行时注入私有订阅地址。
- Worker 返回固定的 `JUZI-Mihomo.yaml` 文件名，导入 Clash Verge Rev 后更易识别。

## 文件结构

```text
config/JUZI-PC.yaml             # Mihomo 配置模板
worker/src/index.js              # Cloudflare Worker
worker/wrangler.toml.example     # Worker 配置示例
.github/workflows/validate.yml   # 配置校验
```

## 直接使用配置模板

模板地址：

```text
https://raw.githubusercontent.com/juzipaome/JUZI-Mihomo/main/config/JUZI-PC.yaml
```

模板中的订阅地址是占位符，不能直接作为包含真实节点的订阅使用。使用前请在本地替换 `__IKUUU_SUBSCRIPTION_URL__`，或按下面的方式部署 Worker。包含真实订阅地址的本地文件不要提交到公开仓库。

## 部署 Cloudflare Worker

需要安装 Node.js，并准备 Cloudflare 账号。进入 `worker/` 目录执行：

```powershell
Copy-Item .\wrangler.toml.example .\wrangler.toml
npx wrangler@latest login
npx wrangler@latest deploy
```

为 Worker 设置私有变量：

```powershell
npx wrangler@latest secret put IKUUU_URL
$token = py -3 -c "import secrets; print(secrets.token_urlsafe(32))"
$token | npx wrangler@latest secret put SUB_TOKEN
```

部署完成后，使用 Wrangler 输出的 Worker 域名组成订阅地址：

```text
https://<你的Worker域名>/sub/<SUB_TOKEN>
```

将该地址导入 Clash Verge Rev。`SUB_TOKEN` 是访问凭据，不能提交到 GitHub；遗失或泄露时重新生成并覆盖 Secret 即可。

## 更新配置

只修改 `config/JUZI-PC.yaml` 并推送到 GitHub 即可。Worker 会在请求时读取最新的 Raw 配置，通常不需要重新部署 Worker。只有修改 `worker/` 中的代码或 Wrangler 配置时，才需要再次执行 `npx wrangler deploy`。

## 安全注意事项

- 不要提交真实机场订阅地址、节点下发 YAML 或任何 token。
- 不要把 `wrangler.toml`、`.env` 或 Secret 值提交到仓库。
- 不要在公开 Issue、截图或日志中粘贴完整订阅地址。
- GitHub Actions 会检查模板中的订阅地址是否仍为占位符。

## 规则概览

- AI 使用独立策略组，并提供全部节点入口。
- 国内域名和 IP 默认直连。
- 海外流量按地区和用途分组选择节点。
- 下载/CDN 流量使用独立策略组。
- Microsoft / OneDrive 默认直连，可按需切换代理。