# JUZI Mihomo

面向 Mihomo 的公开配置模板，目前同时提供：

- Windows + Clash Verge Rev：`config/JUZI-PC.yaml`
- Android + Mishka ROOT TPROXY：`config/JUZI-Mobile.yaml`

> 公开仓库不包含真实机场订阅地址、节点列表或访问令牌。

## 功能

- 按国内、海外、AI、下载等场景组织策略组。
- AI 策略组保留全部节点入口，便于手动固定节点。
- GitHub 下载域名优先走“国外下载”，其它 GitHub 走“节点选择”，避免被 Microsoft 规则集误接管。
- 通过代理提供者动态加载订阅节点。
- 使用一个 Cloudflare Worker 在运行时注入私有订阅地址，同时提供 PC / Mobile 两个订阅入口。

## 文件结构

```text
config/JUZI-PC.yaml             # Windows / Clash Verge Rev
config/JUZI-Mobile.yaml         # Android / Mishka ROOT TPROXY
worker/src/index.js             # Cloudflare Worker
worker/wrangler.toml.example    # Worker 配置示例
.github/workflows/validate.yml  # 配置校验
```

## 模板 Raw 地址

PC：

```text
https://raw.githubusercontent.com/juzipaome/JUZI-Mihomo/main/config/JUZI-PC.yaml
```

Mobile：

```text
https://raw.githubusercontent.com/juzipaome/JUZI-Mihomo/main/config/JUZI-Mobile.yaml
```

模板中的订阅地址是占位符 `__IKUUU_SUBSCRIPTION_URL__`，不能直接获取真实节点。真实订阅地址只保存在 Cloudflare Worker Secret 中。

## Cloudflare Worker

Worker 只需要部署一份，不需要为手机再新建一个 Worker。

进入 `worker/` 目录：

```powershell
Copy-Item .\wrangler.toml.example .\wrangler.toml
npx wrangler@latest login
npx wrangler@latest deploy
```

首次部署时设置私密变量：

```powershell
npx wrangler@latest secret put IKUUU_URL
$token = py -3 -c "import secrets; print(secrets.token_urlsafe(32))"
$token | npx wrangler@latest secret put SUB_TOKEN
```

如果 Worker 已经部署过并且 `IKUUU_URL`、`SUB_TOKEN` 都已经设置好，这次只需要重新执行：

```powershell
npx wrangler@latest deploy
```

不需要重新创建 Worker，也不需要重设 Secret。

## 订阅地址

假设当前 Worker 是：

```text
https://juzi-mihomo-sub.<你的workers子域>.workers.dev
```

并且已有 `SUB_TOKEN`。

PC 原订阅地址继续有效：

```text
https://juzi-mihomo-sub.<你的workers子域>.workers.dev/sub/<SUB_TOKEN>
```

也可以显式写成：

```text
https://juzi-mihomo-sub.<你的workers子域>.workers.dev/sub/<SUB_TOKEN>/pc
```

Android / Mishka 使用：

```text
https://juzi-mihomo-sub.<你的workers子域>.workers.dev/sub/<SUB_TOKEN>/mobile
```

Worker 会自动读取对应的公开模板，再把 `IKUUU_URL` Secret 注入后返回完整 YAML。

## Android / Mishka

`JUZI-Mobile.yaml` 是按 ROOT TPROXY 设计的：

- Mihomo 内置 `tun.enable: false`
- 推荐 Mishka 选择 **ROOT TPROXY**
- 不使用 Android `VpnService`
- AI 默认香港，可手动改日本/美国/新加坡
- 免费日本节点参与普通自动选择
- “下载专用”节点只用于明确的国外下载/CDN

如果改用 Mishka 的 VPN 或 ROOT TUN 模式，不建议直接沿用这份 Mobile 模板里的 TUN 设置，应单独调整。

## 更新配置

只修改 GitHub 中的 `config/JUZI-PC.yaml` 或 `config/JUZI-Mobile.yaml` 即可。Worker 每次请求都会读取最新 Raw 配置，所以以后改规则通常**不用重新部署 Worker**。

只有修改 `worker/src/index.js` 或 Wrangler 配置时，才需要再次 `npx wrangler deploy`。

## 安全注意事项

- 不要提交真实机场订阅地址、节点下发 YAML 或任何 token。
- 不要把 `IKUUU_URL`、`SUB_TOKEN` 写入公开文件。
- 不要在公开 Issue、截图或日志中粘贴完整 Worker 订阅 URL。
- GitHub Actions 会同时检查 PC / Mobile 模板是否仍使用安全占位符。

## 规则概览

- AI 使用独立策略组。
- 国内域名和 IP 默认直连。
- 海外流量统一跟随“节点选择”。
- GitHub 大文件下载优先“国外下载”，其它 GitHub 正常代理。
- Microsoft / OneDrive 默认直连，可按需切换代理或国外下载。
