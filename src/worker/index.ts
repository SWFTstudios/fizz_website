import { handleShopApi } from "./routes/shop";

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  ENVIRONMENT: string;
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_STOREFRONT_TOKEN?: string;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

async function handleApi(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/api/health") {
    return json({ ok: true, environment: env.ENVIRONMENT }, { status: 200 });
  }

  if (pathname.startsWith("/api/shop/") || pathname === "/api/shop") {
    return handleShopApi(req, url, env);
  }

  return json(
    {
      error: {
        code: "NOT_FOUND",
        message: `Unknown API endpoint: ${pathname}`,
      },
    },
    { status: 404 },
  );
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return handleApi(req, env);
    if (url.pathname === "/api/shop" || url.pathname.startsWith("/api/shop/")) return handleApi(req, env);
    return env.ASSETS.fetch(req);
  },
};

