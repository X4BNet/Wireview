import { createApp, reactive, effectScope } from "vue";
import App from "./App.vue";
import Manager from "./classes/Manager";
import { managerKey, optionsKey } from "./globals";
import "./style.css";

export const version = __WIREVIEW_VERSION__;

/** Mount an independent viewer. Load style.css and provide the published assets directory. */
export function createWireview(element, { embedded = false, theme = "auto", assetsBaseUrl } = {}) {
  if (!(element instanceof HTMLElement)) throw new TypeError("Wireview requires a mount element");
  if (!assetsBaseUrl) throw new TypeError("Wireview requires assetsBaseUrl");
  if (!["auto", "light", "dark"].includes(theme)) throw new TypeError("Invalid Wireview theme");
  const scope = effectScope();
  const manager = scope.run(() => new Manager({ assetsBaseUrl }));
  const options = reactive({ embedded, theme, error: "" });
  let destroyed = false;
  const app = createApp(App);
  app.provide(managerKey, manager);
  app.provide(optionsKey, options);
  app.config.errorHandler = (error) => { if (!destroyed) options.error = error.message; };
  app.mount(element);
  const ready = manager.initialize();
  ready.catch((error) => { if (!destroyed) options.error = error.message; });
  return {
    ready,
    async openFile(file) {
      if (destroyed) throw new Error("Wireview was closed");
      if (!(file instanceof File)) throw new TypeError("Wireview requires a File");
      await ready;
      if (destroyed) throw new Error("Wireview was closed");
      options.error = "";
      try { await manager.openFile(file); }
      catch (error) { if (!destroyed) options.error = error.message; throw error; }
    },
    setTheme(next) {
      if (!["auto", "light", "dark"].includes(next)) throw new TypeError("Invalid Wireview theme");
      options.theme = next;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      app.unmount();
      scope.stop();
      manager.deinitialize();
    },
  };
}
