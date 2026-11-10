<script setup>
import { reactive, ref, useId } from 'vue';
import { clamp, watchMouseDragMove } from '../../util';
const state = reactive({ firstPaneHeight: 50, secondPaneWidth: 50 });
const activePane = ref(0);
const id = useId();
const panes = ['Packets', 'Details', 'Bytes'];
const handleVResize = (event) => {
  const height = state.firstPaneHeight;
  const container = event.currentTarget.parentNode;
  watchMouseDragMove(event, ({ deltaY }) => { state.firstPaneHeight = clamp(15, height + deltaY * 100 / container.clientHeight, 85); });
};
const handleHResize = (event) => {
  const width = state.secondPaneWidth;
  const container = event.currentTarget.parentNode;
  watchMouseDragMove(event, ({ deltaX }) => { state.secondPaneWidth = clamp(15, width + deltaX * 100 / container.clientWidth, 85); });
};
const tabKeydown = (event, index) => {
  let next;
  if (event.key === 'ArrowRight') next = (index + 1) % 3;
  if (event.key === 'ArrowLeft') next = (index + 2) % 3;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = 2;
  if (next === undefined) return;
  event.preventDefault(); activePane.value = next;
  event.currentTarget.parentNode.children[next].focus();
};
</script>
<template>
  <div class="wv-layout" :data-active-pane="activePane">
    <div class="wv-pane-tabs" role="tablist" aria-label="Packet inspection">
      <button v-for="(pane, index) in panes" :key="pane" type="button" role="tab"
        :id="`${id}-tab-${index}`" :aria-controls="`${id}-panel-${index}`"
        :aria-selected="activePane === index" :tabindex="activePane === index ? 0 : -1"
        @click="activePane = index" @keydown="tabKeydown($event, index)">{{ pane }}</button>
    </div>
    <div class="wv-top wv-panel" :id="`${id}-panel-0`" :aria-label="panes[0]" :style="{ height: state.firstPaneHeight + '%' }"><slot name="slot1" /></div>
    <div class="wv-v-resize" @pointerdown.prevent="handleVResize"></div>
    <div class="wv-bottom">
      <div class="wv-first wv-panel needs-border-bottom" :id="`${id}-panel-1`" :aria-label="panes[1]" :style="{ width: state.secondPaneWidth + '%' }"><slot name="slot2" /></div>
      <div class="wv-h-resize" @pointerdown.prevent="handleHResize"></div>
      <div class="wv-second wv-panel needs-border-bottom" :id="`${id}-panel-2`" :aria-label="panes[2]"><slot name="slot3" /></div>
    </div>
  </div>
</template>
<style scoped>
.wv-layout, .wv-panel, .wv-bottom { display: flex; min-width: 0; min-height: 0; overflow: hidden; align-items: stretch; }
.wv-layout { flex: 1; flex-direction: column; }
.wv-top { flex-shrink: 0; }
.wv-v-resize { flex-shrink: 0; height: 6px; border-top: var(--ws-pane-border); cursor: ns-resize; touch-action: none; }
.wv-bottom { flex: 1; }
.wv-panel { background: var(--ws-almost-white); }
.wv-first { flex-shrink: 0; border-right: var(--ws-pane-border); }
.wv-h-resize { flex-shrink: 0; width: 6px; cursor: ew-resize; touch-action: none; }
.wv-second { flex: 1; }
.wv-pane-tabs { display: none; }
@media (max-width: 767px) {
  .wv-pane-tabs { display: flex; flex-shrink: 0; border-bottom: var(--ws-pane-border); }
  .wv-pane-tabs button { flex: 1; border: 0; border-bottom: 3px solid transparent; background: var(--ws-light-gray); }
  .wv-pane-tabs button[aria-selected="true"] { border-bottom-color: var(--ws-selected-bg); color: var(--ws-selected-unfocused-fg); background: var(--ws-selected-unfocused-bg); font-weight: 600; }
  .wv-v-resize, .wv-h-resize { display: none; }
  .wv-top { height: auto !important; flex: 1; }
  .wv-first, .wv-second { width: 100% !important; flex: 1; }
  .wv-bottom { display: contents; }
  .wv-layout[data-active-pane="0"] .wv-first, .wv-layout[data-active-pane="0"] .wv-second,
  .wv-layout[data-active-pane="1"] .wv-top, .wv-layout[data-active-pane="1"] .wv-second,
  .wv-layout[data-active-pane="2"] .wv-top, .wv-layout[data-active-pane="2"] .wv-first { display: none; }
}
</style>
