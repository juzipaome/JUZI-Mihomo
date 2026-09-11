# JUZI Mihomo

Windows + Clash Verge Rev / Mihomo 的个人规则配置。

这个仓库可以公开：真实机场订阅地址不会提交到 GitHub。公开配置只保留：

```yaml
proxy-providers:
  iKuuu_V2:
    url: "__IKUUU_SUBSCRIPTION_URL__"
```

Cloudflare Worker 在运行时读取公开模板，用 Worker Secret 中保存的真实订阅地址替换占位符，再把最终 YAML 返回给 Clash Verge Rev。

## 目录

```text
config/JUZI-PC.yaml
worker/src/index.js
worker/wrangler.toml.example
.github/workflows/validate.yml
```

## GitHub

建议创建 Public Repository：`JUZI-Mihomo`

仓库创建后，模板 Raw 地址类似：

```text
https://raw.githubusercontent.com/<你的用户名>/JUZI-Mihomo/main/config/JUZI-PC.yaml
```

## Cloudflare Worker

进入 `worker/`：

```bash
npm install -g wrangler
cp wrangler.toml.example wrangler.toml
wrangler login
```

把 `wrangler.toml` 里的 `TEMPLATE_URL` 改成上面的 GitHub Raw 地址。

保存真实机场订阅 URL：

```bash
wrangler secret put IKUUU_URL
```

生成随机订阅密钥：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

保存随机密钥：

```bash
wrangler secret put SUB_TOKEN
```

部署：

```bash
wrangler deploy
```

Clash Verge Rev 最终订阅：

```text
https://<你的Worker域名>/sub/<SUB_TOKEN>
```

## 工作流

```text
CVR
 -> Cloudflare Worker
 -> GitHub 最新 JUZI-PC.yaml
 -> 注入 IKUUU_URL Secret
 -> 返回完整 Mihomo YAML
```

以后改 GitHub 配置即可，CVR 订阅 URL 不需要变化。

## 安全

- 不要把真实 iKuuu URL 写进 Public Repo。
- 不要把 IKUUU_URL / SUB_TOKEN 写进 `wrangler.toml`。
- 不要提交机场原始下发 YAML；它包含真实节点服务器与连接凭据。
- GitHub Actions 会检查公开模板中的订阅 URL 是否仍然是占位符。
- `SUB_TOKEN` 本身就是订阅访问凭据；泄露后重新生成并更新 Secret。

## 当前配置思路

- AI 单独策略组。
- 其它海外流量统一跟随「节点选择」。
- 国外下载只匹配明确下载/CDN域名，并走机场“下载专用”节点。
- 国内域名/IP DIRECT。
- 免费日本节点参与普通自动选择；AI 的日本自动仍只选 IEPL。
- Microsoft / OneDrive 默认 DIRECT，需要时可切代理或国外下载。
