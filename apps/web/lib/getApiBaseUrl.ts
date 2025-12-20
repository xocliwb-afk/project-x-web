const DEFAULT_API_BASE_URL = "http://localhost:3001";

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

let loggedDefault = false;
let loggedChoice = false;

export function getApiBaseUrl(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const legacy = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (explicit) {
    if (isDev && !loggedChoice) {
      console.log(`[api-client] Using NEXT_PUBLIC_API_BASE_URL=${stripTrailingSlash(explicit)}`);
      loggedChoice = true;
    }
    return stripTrailingSlash(explicit);
  }

  if (legacy) {
    if (isDev) {
      console.warn(
        "[api-client] NEXT_PUBLIC_API_URL is deprecated. Set NEXT_PUBLIC_API_BASE_URL instead."
      );
      if (!loggedChoice) {
        console.log(`[api-client] Using NEXT_PUBLIC_API_URL=${stripTrailingSlash(legacy)}`);
        loggedChoice = true;
      }
    }
    return stripTrailingSlash(legacy);
  }

  if (isDev && !loggedDefault) {
    console.log(
      `[api-client] Using default API base URL ${DEFAULT_API_BASE_URL}`
    );
    loggedDefault = true;
  }
  return DEFAULT_API_BASE_URL;
}
