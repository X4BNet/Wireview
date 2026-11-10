import test from 'node:test';
import assert from 'node:assert/strict';
import Bridge from '../src/classes/Bridge.js';

class FakeWorker extends EventTarget {
  static workers = [];
  messages = [];
  terminated = false;
  constructor(url) { super(); this.url = url; FakeWorker.workers.push(this); }
  postMessage(message) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  reply(data) { this.dispatchEvent(new MessageEvent('message', { data })); }
}
globalThis.Worker = FakeWorker;
const create = () => new Bridge({ assetsBaseUrl: 'https://example.test/assets/wireview/0.1.0/' });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('initializes independent workers using the supplied asset base', async () => {
  const first = create(), second = create();
  const ready = first.initialize(), otherReady = second.initialize();
  const [a, b] = FakeWorker.workers.slice(-2);
  assert.notEqual(a, b);
  assert.equal(a.url.href, 'https://example.test/assets/wireview/0.1.0/worker.js');
  assert.equal(a.messages[0].assetsBaseUrl, 'https://example.test/assets/wireview/0.1.0/');
  a.reply({ type: 'init', success: true, columns: ['No.', 'Info'] });
  b.reply({ type: 'init', success: true, columns: ['No.'] });
  await Promise.all([ready, otherReady]);
  assert.deepEqual(first.columns, ['No.', 'Info']);
  first.deinitialize();
  assert.equal(a.terminated, true);
  assert.equal(b.terminated, false);
  second.deinitialize();
});

test('engine initialization failures reject readiness and future operations', async () => {
  const bridge = create();
  const ready = bridge.initialize();
  FakeWorker.workers.at(-1).reply({ type: 'init', success: false, error: 'WASM unavailable' });
  await assert.rejects(ready, /WASM unavailable/);
  await assert.rejects(bridge.getFrame(1), /WASM unavailable/);
  assert.equal(FakeWorker.workers.at(-1).terminated, true);
});

test('teardown rejects initialization and in-flight requests without affecting another instance', async () => {
  const waiting = create();
  const waitingReady = waiting.initialize();
  waiting.deinitialize();
  await assert.rejects(waitingReady, /closed/);
  const bridge = create();
  const ready = bridge.initialize();
  const worker = FakeWorker.workers.at(-1);
  worker.reply({ type: 'init', success: true });
  await ready;
  const frame = bridge.getFrame(4);
  await tick();
  assert.equal(bridge.activeRequest.type, 'frame');
  bridge.deinitialize();
  await assert.rejects(frame, /closed/);
  assert.equal(bridge.activeRequest, null);
});

test('a parse error rejects its request and allows retry', async () => {
  const bridge = create();
  const ready = bridge.initialize();
  const worker = FakeWorker.workers.at(-1);
  worker.reply({ type: 'init', success: true });
  await ready;
  const failed = bridge.createSession(new File(['invalid'], 'broken.pcap'));
  await tick();
  worker.reply({ id: worker.messages.at(-1).id, error: 'Invalid capture' });
  await assert.rejects(failed, /Invalid capture/);
  const next = bridge.createSession(new File(['valid'], 'valid.pcap'));
  await tick();
  worker.reply({ id: worker.messages.at(-1).id, result: { code: 0, summary: { packet_count: 2 } } });
  assert.equal((await next).summary.packet_count, 2);
  bridge.deinitialize();
});

test('worker errors reject all pending operations', async () => {
  const bridge = create();
  const ready = bridge.initialize();
  const worker = FakeWorker.workers.at(-1);
  worker.reply({ type: 'init', success: true });
  await ready;
  const pending = [bridge.getFrames('', 0, 10), bridge.getFrame(1)];
  await tick();
  worker.dispatchEvent(new Event('messageerror'));
  await Promise.all(pending.map(promise => assert.rejects(promise, /response/)));
  assert.equal(worker.terminated, true);
});
