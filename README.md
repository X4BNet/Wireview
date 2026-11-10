# Wireview

Browser packet viewer powered by Wireshark. Supports standalone use and embedding in existing applications. Capture contents are parsed locally in a dedicated worker.

## Development and builds

```sh
npm ci --no-fund --no-audit
npm run dev
npm test
npm run build -- --outDir /tmp/wireview-standalone
WIREVIEW_PACKAGE_DIR=/tmp/wireview-package npm run build:lib
WIREVIEW_PACKAGE_DIR=/tmp/wireview-package npm run check:package
```

The library build creates a complete publishable package in `WIREVIEW_PACKAGE_DIR` (default `/tmp/wireview-package`), with a bundled Vue runtime, CSS and the classic worker plus Wiregasm assets. No Vue toolchain is needed in the consuming application. Exclude the standalone demonstration capture from production integrations.

## Embed

Install `@x4bnet/wireview` from `https://npm.pkg.github.com`, configuring `@x4bnet:registry=https://npm.pkg.github.com` and a per-user `read:packages` token. GitHub's npm registry requires authentication even for public packages. Never commit credentials.

Bundle the library import, load the exported `@x4bnet/wireview/style.css`, and copy `dist/assets/` to a versioned, same-origin static directory. The host element must have a defined height.

```js
import { createWireview, version } from '@x4bnet/wireview';
const viewer = createWireview(document.getElementById('capture'), {
  embedded: true,
  theme: 'dark', // light, dark, or auto (OS preference)
  assetsBaseUrl: `/js/wireview/${version}/assets/`,
});
await viewer.ready;
await viewer.openFile(new File([captureBytes], 'capture.pcap'));
viewer.setTheme('light');
// When removing the page, including interrupted loading:
viewer.destroy();
```

Each viewer owns its own engine, state, observers, timers and event listeners. `ready` and `openFile` reject on initialization/parse failures or destruction. `destroy()` is idempotent. Embedded mode removes file-opening and welcome UI, retaining filtering, packet search, navigation and inspection. Mobile screens below 768px use Packets, Details and Bytes tabs without discarding pane state. Packet cards wrap within the mobile viewport and large captures use pages of 50 packets. Desktop retains resizable panes. CSS is scoped beneath `.wireview` and theme colors are shared by packet rows and the minimap.

Serve `.wasm` with `application/wasm`, permit same-origin workers, and deploy all runtime files together. The host fetches the capture using its own authentication; the library accepts a `File` and never fetches or uploads capture data itself.

## Releases

1. Update `package.json` and its lockfile, test and review the changes.
2. Push the matching `vX.Y.Z` tag. The package workflow verifies the tag, builds both targets, checks the package, and publishes using its `packages:write` GitHub token.
3. For the first publication, an organization/package administrator must open **X4BNet → Packages → wireview → Package settings → Change visibility → Public**. Verify public visibility; `publishConfig.access` alone does not guarantee GitHub package visibility. Public visibility cannot be reversed.
4. Grant `X4BNet/x4b-site` Actions read access to the package. Consuming workflows use `packages:read` and their `GITHUB_TOKEN`; local developers use their own `read:packages` token.
5. Install and pin the exact published version in the consumer and commit its lockfile.

## Credits and license

GPLv2 (`GPL-2.0-only`); see [LICENSE](LICENSE). Wireview was created by [radiantly](https://github.com/radiantly/Wireview) and uses assets from [Wireshark](https://gitlab.com/wireshark/wireshark) and the Wireshark WebAssembly binary compiled by [Wiregasm](https://github.com/good-tools/wiregasm).
