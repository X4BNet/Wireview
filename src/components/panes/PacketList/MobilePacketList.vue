<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch, useTemplateRef } from 'vue';
import { useManager } from '../../../globals';
import Row from './Row.vue';

const manager = useManager();
const pageSize = 50;
const start = ref(0);
const frames = ref([]);
const loading = ref(false);
const error = ref('');
const container = useTemplateRef('mobile-list');
const end = computed(() => Math.min(start.value + pageSize, manager.frameCount));
let requestId = 0;
let disposed = false;

/** Load a bounded page so packet cards can wrap to their natural height. */
const load = async () => {
  const current = ++requestId;
  const offset = start.value;
  loading.value = true;
  error.value = '';
  try {
    const result = await manager.getFrames(manager.displayFilter, offset, pageSize);
    if (disposed || current !== requestId) return;
    frames.value = result.frames.slice(result.offset, result.offset + pageSize);
    await nextTick();
    if (!disposed && container.value) container.value.scrollTop = 0;
  } catch (failure) {
    if (!disposed && current === requestId) error.value = failure.message;
  } finally {
    if (!disposed && current === requestId) loading.value = false;
  }
};

watch([() => manager.displayFilter, () => manager.frameCount], () => {
  const target = Math.floor((manager.activeFrameIndex ?? 0) / pageSize) * pageSize;
  const next = Math.min(target, Math.max(0, Math.floor((manager.frameCount - 1) / pageSize) * pageSize));
  if (start.value !== next) start.value = next;
  else load();
}, { immediate: true });
watch(start, load);
watch(() => manager.activeFrameIndex, async index => {
  if (index === null) return;
  if (index < start.value || index >= start.value + pageSize) {
    start.value = Math.floor(index / pageSize) * pageSize;
  } else {
    await nextTick();
    container.value?.querySelector(`[data-frame-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }
});
onBeforeUnmount(() => { disposed = true; ++requestId; });
</script>
<template>
  <div class="wv-mobile-packets">
    <div class="wv-mobile-list" ref="mobile-list" aria-label="Packets" :aria-busy="loading">
      <p v-if="error" class="wv-mobile-list-message" role="alert">{{ error }}</p>
      <p v-else-if="!loading && manager.packetCount > 0 && manager.frameCount === 0" class="wv-mobile-list-message" role="status">No packets match this filter.</p>
      <Row v-for="(frame, index) in frames" :key="frame.number" :frame="frame" :index="start + index" />
    </div>
    <nav v-if="manager.frameCount > pageSize" class="wv-packet-pagination" aria-label="Packet pages">
      <button type="button" aria-label="Previous packets" :disabled="loading || start === 0" @click="start = Math.max(0, start - pageSize)">Previous</button>
      <span aria-live="polite">{{ start + 1 }}–{{ end }} of {{ manager.frameCount }}</span>
      <button type="button" aria-label="Next packets" :disabled="loading || end >= manager.frameCount" @click="start += pageSize">Next</button>
    </nav>
  </div>
</template>
<style scoped>
.wv-mobile-packets { display: flex; flex-direction: column; min-width: 0; min-height: 0; width: 100%; }
.wv-mobile-list { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }
.wv-mobile-list-message { padding: 12px; margin: 0; color: var(--ws-muted); }
.wv-packet-pagination { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 8px; background: var(--ws-light-gray); border-top: var(--ws-pane-border); font-size: 12px; }
.wv-packet-pagination button { border: var(--ws-pane-border); border-radius: 4px; padding: 0 10px; }
</style>
