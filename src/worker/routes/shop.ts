import type { Env } from "../index";

type ShopError = {
  error: {
    code: string;
    message: string;
  };
};

export async function handleShopApi(
  req: Request,
  url: URL,
  _env: Env,
): Promise<Response> {
  const pathname = url.pathname;

  // Future implementation will proxy calls to Shopify Storefront API.
  // For now, return a stable JSON error contract.
  const payload: ShopError = {
    error: {
      code: "SHOPIFY_NOT_IMPLEMENTED",
      message: `Shopify endpoint not implemented: ${pathname}`,
    },
  };

  return new Response(JSON.stringify(payload), {
    status: 501,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

