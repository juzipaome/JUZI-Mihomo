const PLACEHOLDER = "__IKUUU_SUBSCRIPTION_URL__";

const SUBSCRIPTION_META_HEADERS = [
  "subscription-userinfo",
  "profile-update-interval",
  "profile-web-page-url"
];

function mobileTemplateUrl(env) {
  if (env.MOBILE_TEMPLATE_URL) return env.MOBILE_TEMPLATE_URL;
  if (!env.TEMPLATE_URL) return null;
  return env.TEMPLATE_URL.replace(/JUZI-PC\.yaml$/, "JUZI-Mobile.yaml");
}

async function fetchSubscriptionMetadata(subscriptionUrl) {
  try {
    const response = await fetch(subscriptionUrl, {
      method: "GET",
      headers: {
        "User-Agent": "clash.meta",
        "Accept": "*/*"
      },
      redirect: "follow",
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    const metadata = {};
    for (const name of SUBSCRIPTION_META_HEADERS) {
      const value = response.headers.get(name);
      if (value) metadata[name] = value;
    }

    // 这里只需要机场返回的订阅元数据响应头，不需要下载/缓存整份节点配置。
    if (response.body) {
      await response.body.cancel().catch(() => {});
    }

    return metadata;
  } catch {
    // 元数据获取失败不应影响主配置订阅本身。
    return {};
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!env.SUB_TOKEN || !env.IKUUU_URL || !env.TEMPLATE_URL) {
      return new Response("Worker is not configured.", { status: 500 });
    }

    let templateUrl;
    let filename;

    // 向后兼容：原来的 /sub/<token> 继续返回 PC 配置。
    if (url.pathname === `/sub/${env.SUB_TOKEN}` || url.pathname === `/sub/${env.SUB_TOKEN}/pc`) {
      templateUrl = env.TEMPLATE_URL;
      filename = "JUZI-Mihomo-PC.yaml";
    } else if (url.pathname === `/sub/${env.SUB_TOKEN}/mobile`) {
      templateUrl = mobileTemplateUrl(env);
      filename = "JUZI-Mihomo-Mobile.yaml";
    } else {
      return new Response("Not found.", { status: 404 });
    }

    if (!templateUrl) {
      return new Response("Template URL is not configured.", { status: 500 });
    }

    const [upstream, subscriptionMetadata] = await Promise.all([
      fetch(templateUrl, {
        headers: { "User-Agent": "JUZI-Mihomo-Worker/3.0" },
        cf: { cacheTtl: 0, cacheEverything: false }
      }),
      fetchSubscriptionMetadata(env.IKUUU_URL)
    ]);

    if (!upstream.ok) {
      return new Response(`Template fetch failed: ${upstream.status}`, { status: 502 });
    }

    let config = await upstream.text();

    if (!config.includes(PLACEHOLDER)) {
      return new Response("Template placeholder not found.", { status: 500 });
    }

    config = config.replaceAll(PLACEHOLDER, env.IKUUU_URL);

    const headers = new Headers({
      "Content-Type": "text/yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache"
    });

    // 把机场原订阅的流量/到期等元数据转发给 Clash/Mihomo 客户端，
    // 这样远程配置卡片也可以显示已用/总流量和到期时间。
    for (const [name, value] of Object.entries(subscriptionMetadata)) {
      headers.set(name, value);
    }

    return new Response(config, {
      status: 200,
      headers
    });
  }
};
