const CORS_PROXY_URL =
  typeof Deno !== "undefined" && Deno.env.has("CORS_PROXY_URL")
    ? Deno.env.get("CORS_PROXY_URL")
    : "https://c-proxy.dorime.org/";

// @ts-ignore `document` exist on the browser, but not in Deno runtime.
const IS_BROWSER = typeof document !== "undefined";

const wrapCORSProxy = (url: string): string => CORS_PROXY_URL + url;

// We like good CORS :)
const isGoodCORS = async (url: string): Promise<boolean> => {
  // Would ideally use HEAD but not all APIs implement this method.
  try {
    const res = await fetch(url, { method: "GET" });
    return res.headers.get("Access-Control-Allow-Origin") === "*";
  } catch (e) {
    if (e instanceof TypeError) {
      // Ran in browser and CORS denied us..
      return false;
    } else {
      throw e;
    }
  }
};

// I love the browser, best invention was CORS!
// We run adapters on the browser so wrap in a CORS proxy for the browser.
const maybeWrapCORSProxy = async (url: string): Promise<string> => {
  if (!IS_BROWSER) return url;

  return (await isGoodCORS(url)) ? url : wrapCORSProxy(url);
};

export { CORS_PROXY_URL, isGoodCORS, maybeWrapCORSProxy, wrapCORSProxy };
