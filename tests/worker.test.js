import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
function worker(load) {
  const messages = [], scripts = [];
  let listener;
  const context = vm.createContext({ URL, Uint8Array, console,
    importScripts: url => scripts.push(url), loadWiregasm: load,
    postMessage: message => messages.push(message),
    self: { addEventListener: (_, callback) => { listener = callback; } },
  });
  vm.runInContext(source, context);
  return { messages, scripts, send: data => listener({ data }) };
}
test('worker resolves runtime paths beneath the supplied base and reports initialization errors', async () => {
  const instance = worker(async ({ locateFile }) => {
    assert.equal(locateFile('wiregasm.data'), 'https://example.test/nested/assets/wiregasm.bmp');
    assert.equal(locateFile('wiregasm.wasm'), 'https://example.test/nested/assets/wiregasm.wasm');
    throw new Error('Missing runtime');
  });
  await instance.send({ type: 'init', assetsBaseUrl: 'https://example.test/nested/assets/' });
  assert.equal(instance.scripts[0], 'https://example.test/nested/assets/wiregasm.js');
  assert.equal(instance.messages[0].success, false);
  assert.match(instance.messages[0].error, /Missing runtime/);
});
test('worker removes failed and superseded captures and supports retry after parsing errors', async () => {
  let deleted = 0, removed = 0, fail = true;
  const instance = worker(async () => ({
    init() {}, getColumns: () => ({ size: () => 1, get: () => 'Info' }),
    FS: { writeFile() {}, unlink() { removed++; } },
    DissectSession: class {
      load() { if (fail) throw new Error('Malformed capture'); return { code: 0, summary: { packet_count: 1 } }; }
      delete() { deleted++; }
    },
  }));
  await instance.send({ type: 'init', assetsBaseUrl: 'https://example.test/assets/' });
  await instance.send({ type: 'open', id: 'broken', file: new File(['broken'], '../bad.pcap') });
  assert.match(instance.messages.at(-1).error, /Malformed/);
  assert.equal(deleted, 1); assert.equal(removed, 1);
  fail = false;
  await instance.send({ type: 'open', id: 'valid', file: new File(['valid'], 'valid.pcap') });
  assert.equal(instance.messages.at(-1).result.summary.packet_count, 1);
  await instance.send({ type: 'close', id: 'close' });
  assert.equal(deleted, 2); assert.equal(removed, 2);
});
