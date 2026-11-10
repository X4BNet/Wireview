import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.WIREVIEW_PACKAGE_DIR || path.join(tmpdir(), 'wireview-package'));
if (output === root || root.startsWith(output + path.sep)) throw new Error('Unsafe package output directory');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await mkdir(output, { recursive: true });
await build({
  root, configFile: false, publicDir: false, plugins: [vue()],
  define: { __WIREVIEW_VERSION__: JSON.stringify(pkg.version), 'process.env.NODE_ENV': '"production"' },
  build: { outDir: path.join(output, 'dist'), emptyOutDir: true,
    lib: { entry: path.join(root, 'src/library.js'), formats: ['es'], fileName: () => 'wireview.js', cssFileName: 'style' },
  },
});
await mkdir(path.join(output, 'dist/assets'), { recursive: true });
for (const name of ['wiregasm.js', 'wiregasm.wasm', 'wiregasm.bmp']) await cp(path.join(root, 'public', name), path.join(output, 'dist/assets', name));
await cp(path.join(root, 'src/worker.js'), path.join(output, 'dist/assets/worker.js'));
for (const name of ['README.md', 'LICENSE']) await cp(path.join(root, name), path.join(output, name));
const { scripts, devDependencies, dependencies, ...published } = pkg;
await writeFile(path.join(output, 'package.json'), JSON.stringify(published, null, 2) + '\n');
console.log(`Package ready: ${output}`);
