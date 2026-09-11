const PLACEHOLDER = "__IKUUU_SUBSCRIPTION_URL__";

function mobileTemplateUrl(env) {
  if (env.MOBILE_TEMPLATE_URL) return env.MOBILE_TEMPLATE_URL;
  if (!env.TEMPLATE_URL) return null;
  return env.TEMPLATE_URL.replace(/JUZI-PC\.yaml$/, "JUZI-Mobile.yaml");
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

    const upstream = await fetch(templateUrl, {
      headers: { "User-Agent": "JUZI-Mihomo-Worker/2.0" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!upstream.ok) {
      return new Response(`Template fetch failed: ${upstream.status}`, { status: 502 });
    }

    let config = await upstream.text();

    if (!config.includes(PLACEHOLDER)) {
      return new Response("Template placeholder not found.", { status: 500 });
    }

    config = config.replaceAll(PLACEHOLDER, env.IKUUU_URL);

    return new Response(config, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  }
};
