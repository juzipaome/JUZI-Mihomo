const PLACEHOLDER = "__IKUUU_SUBSCRIPTION_URL__";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!env.SUB_TOKEN || !env.IKUUU_URL || !env.TEMPLATE_URL) {
      return new Response("Worker is not configured.", { status: 500 });
    }

    if (url.pathname !== `/sub/${env.SUB_TOKEN}`) {
      return new Response("Not found.", { status: 404 });
    }

    const upstream = await fetch(env.TEMPLATE_URL, {
      headers: { "User-Agent": "JUZI-Mihomo-Worker/1.0" },
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
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  }
};
