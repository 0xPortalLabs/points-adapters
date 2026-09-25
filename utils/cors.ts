const viteEnv =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env;

const maybeReadEnv = (name: string, fallback: string) =>
  typeof Deno !== "undefined" && Deno.env.has(name)
    ? Deno.env.get(name)
    : typeof viteEnv !== "undefined" &&
        Object.hasOwn(viteEnv, "VITE_" + name)
    ? viteEnv["VITE_" + name]
    : typeof process !== "undefined" && process.env && process.env[name]
    ? process.env[name]
    : fallback;

const DEFAULT_CORS_PROXY_URL = "https://c-proxy.dorime.org/";
const CORS_PROXY_URL = maybeReadEnv(
  "CORS_PROXY_URL",
  DEFAULT_CORS_PROXY_URL,
)?.trim() || DEFAULT_CORS_PROXY_URL;

// @ts-ignore `document` exist on the browser, but not in Deno runtime.
const IS_BROWSER = typeof document !== "undefined";

const wrapCORSProxy = (url: string): string => CORS_PROXY_URL + url;

// An adapter opts into browser proxying by using this helper. Selecting a URL
// must not probe endpoints: adapters are statically imported before points fetches.
// Keep the Promise return type compatible with existing top-level await callers.
const maybeWrapCORSProxy = (url: string): Promise<string> =>
  Promise.resolve(IS_BROWSER ? wrapCORSProxy(url) : url);

export { CORS_PROXY_URL, maybeWrapCORSProxy, wrapCORSProxy };
