// No external test dependencies and no network permission required.
const target = "https://api.example.invalid/points?address={address}";
const originalFetch = globalThis.fetch;
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  "document",
);
const originalProxy = Deno.env.get("CORS_PROXY_URL");
const originalFastLoad = Deno.env.get("FAST_LOAD");
let moduleId = 0;

for (const browser of [false, true]) {
  for (const fastLoad of [undefined, "false", "true", ""]) {
    for (
      const configuredProxy of [
        undefined,
        "",
        "  ",
        " https://proxy.example.invalid/ ",
      ]
    ) {
      Deno.test(`${browser ? "browser" : "server"}, FAST_LOAD=${String(fastLoad)}, proxy=${JSON.stringify(configuredProxy)}: no probes`, async () => {
        let fetches = 0;
        globalThis.fetch = () => {
          fetches++;
          throw new Error("URL selection must never fetch");
        };
        if (browser) {
          Object.defineProperty(globalThis, "document", {
            value: {},
            configurable: true,
          });
        } else {
          Reflect.deleteProperty(globalThis, "document");
        }
        const proxy = configuredProxy?.trim() || "https://c-proxy.dorime.org/";
        if (configuredProxy === undefined) Deno.env.delete("CORS_PROXY_URL");
        else Deno.env.set("CORS_PROXY_URL", configuredProxy);
        if (fastLoad === undefined) Deno.env.delete("FAST_LOAD");
        else Deno.env.set("FAST_LOAD", fastLoad);
        try {
          const helper = await import(`../cors.ts?test=${++moduleId}`);
          const selected = helper.maybeWrapCORSProxy(target);
          if (!(selected instanceof Promise)) {
            throw new Error("Promise API changed");
          }
          if (await selected !== (browser ? proxy + target : target)) {
            throw new Error("Incorrect browser/server transport selection");
          }
          if (helper.wrapCORSProxy(target) !== proxy + target) {
            throw new Error("Explicit proxy wrapping changed");
          }
          if (fetches !== 0) {
            throw new Error(`Unexpected network calls: ${fetches}`);
          }
        } finally {
          globalThis.fetch = originalFetch;
          if (originalDocument) {
            Object.defineProperty(globalThis, "document", originalDocument);
          } else Reflect.deleteProperty(globalThis, "document");
          if (originalProxy === undefined) Deno.env.delete("CORS_PROXY_URL");
          else Deno.env.set("CORS_PROXY_URL", originalProxy);
          if (originalFastLoad === undefined) Deno.env.delete("FAST_LOAD");
          else Deno.env.set("FAST_LOAD", originalFastLoad);
        }
      });
    }
  }
}
