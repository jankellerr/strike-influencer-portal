const BASE_URL = "https://api.dooki.com.br/v2";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function yampiFetch<T>(path: string): Promise<T> {
  const alias = requireEnv("YAMPI_ALIAS");
  const userToken = requireEnv("YAMPI_USER_TOKEN");
  const secretKey = requireEnv("YAMPI_SECRET_KEY");

  const res = await fetch(`${BASE_URL}/${alias}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "User-Token": userToken,
      "User-Secret-Key": secretKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Yampi API error ${res.status} for ${path}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export interface YampiPromocode {
  id: number;
  code: string;
  discount_type: string;
  value: string;
  active: boolean;
}

interface YampiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      current_page: number;
      total_pages: number;
    };
  };
}

export async function getPromocodeById(id: string): Promise<YampiPromocode> {
  const response = await yampiFetch<{ data: YampiPromocode }>(`/pricing/promocodes/${id}`);
  return response.data;
}

export async function listAllPromocodes(): Promise<YampiPromocode[]> {
  const results: YampiPromocode[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await yampiFetch<YampiListResponse<YampiPromocode>>(
      `/pricing/promocodes?page=${page}`,
    );
    results.push(...response.data);
    totalPages = response.meta.pagination.total_pages;
    page += 1;
  } while (page <= totalPages);

  return results;
}

export interface YampiOrder {
  id: number;
  status: { data?: { alias?: string } } | string;
  value_total: number;
  value_discount: number;
  promocode_id: number | null;
}

/**
 * The orders response includes a `scroll_id` field, but it's always null on
 * this account (confirmed against the real API) -- a dead end, not a working
 * cursor. Standard `page`-based pagination works correctly and exposes the
 * real total via meta.pagination.total_pages, same as promocodes. There's no
 * reliable server-side filter (promocode_id/date query params are silently
 * ignored), so callers filter client-side.
 */
export async function listAllOrders(): Promise<YampiOrder[]> {
  const results: YampiOrder[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await yampiFetch<YampiListResponse<YampiOrder>>(
      `/orders?limit=100&page=${page}`,
    );
    results.push(...response.data);
    totalPages = response.meta.pagination.total_pages;
    page += 1;
  } while (page <= totalPages);

  return results;
}
