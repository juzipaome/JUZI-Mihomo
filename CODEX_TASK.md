# Codex 执行任务

1. 在当前 GitHub 账号创建一个 Public Repository，建议名：`JUZI-Mihomo`。
2. 把本目录全部文件提交到默认分支 `main`。
3. 严格确认 `config/JUZI-PC.yaml` 中 `iKuuu_V2.url` 仍为：
   `__IKUUU_SUBSCRIPTION_URL__`
4. 不要提交机场原始下发 YAML、节点 password/uuid 或真实订阅 URL。
5. 仓库创建后，把 `worker/wrangler.toml.example` 的 `TEMPLATE_URL` 改成：
   `https://raw.githubusercontent.com/<owner>/<repo>/main/config/JUZI-PC.yaml`
6. 如果当前环境可以操作 Cloudflare：
   - 部署 `worker/`
   - 将真实机场订阅 URL 设置为 Worker Secret `IKUUU_URL`
   - 生成至少 32 字节随机值并设置为 Worker Secret `SUB_TOKEN`
   - 返回最终 CVR 订阅 URL：`https://<worker>/sub/<SUB_TOKEN>`
7. 如果不能操作 Cloudflare，不要把任何 Secret 写进 GitHub；只输出需要用户在 Cloudflare 执行的步骤。
