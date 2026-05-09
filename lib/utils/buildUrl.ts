export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryParamValue>;

export function buildUrl(baseUrl: string, params?: QueryParams): string {
  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const nextQuery = searchParams.toString();

  if (!nextQuery) {
    return baseUrl;
  }

  const hashIndex = baseUrl.indexOf("#");
  const hash = hashIndex >= 0 ? baseUrl.slice(hashIndex) : "";
  const urlWithoutHash = hashIndex >= 0 ? baseUrl.slice(0, hashIndex) : baseUrl;
  const queryIndex = urlWithoutHash.indexOf("?");
  const path = queryIndex >= 0 ? urlWithoutHash.slice(0, queryIndex) : urlWithoutHash;
  const currentQuery = queryIndex >= 0 ? urlWithoutHash.slice(queryIndex + 1) : "";
  const mergedSearchParams = new URLSearchParams(currentQuery);

  for (const [key, value] of searchParams.entries()) {
    mergedSearchParams.set(key, value);
  }

  const mergedQuery = mergedSearchParams.toString();

  return `${path}${mergedQuery ? `?${mergedQuery}` : ""}${hash}`;
}
