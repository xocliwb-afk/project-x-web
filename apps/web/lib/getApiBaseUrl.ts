const DEFAULT_API_BASE_URL = "";
const DEFAULT_API_PROXY_TARGET = "http://localhost:3002";

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

let loggedDefault = false;
let loggedChoice = false;
let warnedRemoteMismatch = false;

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.")
  );
}

export function getApiBaseUrl(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const isServer = typeof window === "undefined";
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const legacy = process.env.NEXT_PUBLIC_API_URL?.trim();
  const proxyTarget = process.env.API_PROXY_TARGET?.trim();

  if (explicit) {
    if (isDev && !loggedChoice) {
      console.log(`[api-client] Using NEXT_PUBLIC_API_BASE_URL=${stripTrailingSlash(explicit)}`);
      loggedChoice = true;
    }
    if (isDev && !isServer && !warnedRemoteMismatch) {
      try {
        const url = new URL(stripTrailingSlash(explicit), window.location.origin);
        const browserHost = window.location.hostname;
        if (isLocalhost(browserHost) && !isLocalhost(url.hostname)) {
          console.warn(
            `[api-client] NEXT_PUBLIC_API_BASE_URL points to ${url.hostname} while the app is served from localhost. Ensure that host is reachable on your network or unset the env to use the proxy.`
          );
          warnedRemoteMismatch = true;
        }
      } catch {
        // ignore invalid URLs and do not block rendering
      }
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

  if (isServer) {
    const target = stripTrailingSlash(
      proxyTarget || DEFAULT_API_PROXY_TARGET
    );
    if (isDev && !loggedDefault) {
      console.log(
        `[api-client] Using server API base URL ${target} (proxy target)`
      );
      loggedDefault = true;
    }
    return target;
  }

  if (isDev && !loggedDefault) {
    console.log(
      "[api-client] Using default API base URL (relative /api via Next proxy)"
    );
    loggedDefault = true;
  }
  return DEFAULT_API_BASE_URL;
}
