import { computed, reactive, shallowReactive } from "vue";

/** Own one worker and reject every outstanding operation when it fails or closes. */
class Bridge {
  #worker = null;
  #callbacks = new Map();
  #state = reactive({ activeRequests: new Map() });
  #result = shallowReactive({ value: null });
  #assetsBaseUrl;
  #ready;
  #resolveReady;
  #rejectReady;
  #failure = null;

  constructor({ assetsBaseUrl } = {}) {
    this.#assetsBaseUrl = assetsBaseUrl;
    this.#state.activeRequest = computed(() => this.#state.activeRequests.values().next().value ?? null);
  }

  get initialized() { return this.#result.value?.success ?? false; }
  get initializationError() { return this.#result.value?.error ?? ""; }
  get columns() { return this.#result.value?.columns ?? []; }
  get activeRequest() { return this.#state.activeRequest; }

  /** Start the classic worker once and wait for its engine initialization. */
  initialize() {
    if (this.#ready) return this.#ready;
    this.#ready = new Promise((resolve, reject) => {
      this.#resolveReady = resolve;
      this.#rejectReady = reject;
    });
    try {
      const base = new URL(this.#assetsBaseUrl, globalThis.location?.href);
      this.#worker = new Worker(new URL("worker.js", base));
      this.#worker.addEventListener("message", ({ data }) => this.#processMessage(data));
      this.#worker.addEventListener("error", (event) => {
        event.preventDefault();
        this.#fail(new Error(event.message || "Unable to load the packet engine"));
      });
      this.#worker.addEventListener("messageerror", () => this.#fail(new Error("Unable to read the packet engine response")));
      this.#worker.postMessage({ type: "init", assetsBaseUrl: base.href });
    } catch (error) { this.#fail(error); }
    return this.#ready;
  }

  /** Terminate the worker, including requests interrupted by navigation. */
  deinitialize() { this.#fail(new Error("Wireview was closed")); }

  #fail(error) {
    this.#failure = error;
    this.#result.value = { success: false, error: error.message };
    this.#rejectReady?.(error);
    for (const callback of this.#callbacks.values()) callback.reject(error);
    this.#callbacks.clear();
    this.#state.activeRequests.clear();
    this.#worker?.terminate();
    this.#worker = null;
  }

  #processMessage(data) {
    if (data.type === "init") {
      if (!data.success) return this.#fail(new Error(data.error || "Unable to initialize the packet engine"));
      this.#result.value = data;
      this.#resolveReady();
      return;
    }
    const callback = this.#callbacks.get(data.id);
    this.#callbacks.delete(data.id);
    this.#state.activeRequests.delete(data.id);
    if (data.error) callback?.reject(new Error(data.error));
    else callback?.resolve(data);
  }

  async #postMessage(data) {
    if (this.#failure) throw this.#failure;
    await this.initialize();
    if (this.#failure) throw this.#failure;
    data.id = crypto.randomUUID();
    this.#state.activeRequests.set(data.id, { timestamp: Date.now(), type: data.type });
    return new Promise((resolve, reject) => {
      this.#callbacks.set(data.id, { resolve, reject });
      try { this.#worker.postMessage(data); }
      catch (error) { this.#fail(error); }
    });
  }

  async getFrame(number) { return (await this.#postMessage({ type: "frame", number })).frame; }
  async getFrames(filter, skip, limit) { return (await this.#postMessage({ type: "frames", filter, skip, limit })).frames; }
  async findFrame(params) { return (await this.#postMessage({ type: "find", params })).result; }
  async checkFilter(filter) { return (await this.#postMessage({ type: "check-filter", filter })).result; }
  async createSession(file) { return (await this.#postMessage({ type: "open", file })).result; }
  async closeSession() { await this.#postMessage({ type: "close" }); }
}
export default Bridge;
