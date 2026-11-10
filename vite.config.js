import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const worker = () => readFileSync(new URL('./src/worker.js', import.meta.url));
export default defineConfig({
  plugins: [vue(), {
    name: 'wireview-worker',
    configureServer(server) { server.middlewares.use('/worker.js', (_req, res) => { res.setHeader('Content-Type', 'text/javascript'); res.end(worker()); }); },
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'worker.js', source: worker() }); },
  }],
  define: { __WIREVIEW_VERSION__: JSON.stringify(pkg.version) },
  build: { sourcemap: true },
});
