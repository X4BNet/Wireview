/* Classic worker: all runtime paths are relative to the host-provided asset base. */
let sharky = null;
let session = null;
let filePath = null;

const vecToArray = (vec) => Array.from({ length: vec.size() }, (_, i) => vec.get(i));
const devectorize = (obj) => {
  if (obj === null) return null;
  if (obj?.constructor?.name?.startsWith("Vector")) obj = devectorize(vecToArray(obj));
  else if (Array.isArray(obj)) obj = obj.map(devectorize);
  else if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) obj[key] = devectorize(value);
  }
  return obj;
};
const close = () => {
  session?.delete();
  session = null;
  if (filePath) {
    try { sharky.FS.unlink(filePath); } catch { /* Already removed by the engine. */ }
    filePath = null;
  }
};

self.addEventListener("message", async ({ data }) => {
  try {
    if (data.type === "init") {
      const base = new URL(data.assetsBaseUrl);
      importScripts(new URL("wiregasm.js", base).href);
      sharky = await loadWiregasm({
        locateFile: (path) => new URL(path.endsWith(".data") ? "wiregasm.bmp" : path, base).href,
      });
      sharky.init();
      postMessage({ type: "init", columns: vecToArray(sharky.getColumns()), success: true });
      return;
    }
    if (!sharky) throw new Error("The packet engine is not ready");
    let response;
    if (data.type === "open") {
      close();
      filePath = "/uploads/capture.pcap";
      sharky.FS.writeFile(filePath, new Uint8Array(await data.file.arrayBuffer()));
      session = new sharky.DissectSession(filePath);
      const result = session.load();
      if (result.code) close();
      response = { result };
    } else if (data.type === "close") { close(); response = { success: true }; }
    else if (data.type === "check-filter") response = { result: sharky.checkFilter(data.filter) };
    else {
      if (!session) throw new Error("No capture is open");
      if (data.type === "frame") response = { frame: devectorize(session.getFrame(data.number)) };
      else if (data.type === "frames") response = { frames: devectorize(session.getFrames(data.filter ?? "", data.skip ?? 0, data.limit ?? 0).frames) };
      else if (data.type === "find") response = { result: devectorize(session.findFrame(data.params)) };
      else throw new Error("Unsupported packet operation");
    }
    postMessage({ id: data.id, ...response });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (data.type === "init") postMessage({ type: "init", success: false, error: message });
    else {
      if (data.type === "open") close();
      postMessage({ id: data.id, error: message });
    }
  }
});
