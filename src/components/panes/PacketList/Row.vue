<script setup>
import { onMounted, reactive, useTemplateRef, watch } from "vue";
import { useManager } from "../../../globals";
const manager = useManager();
import { toHexColor } from "../../../util.js";

const { frame, index } = defineProps({
  frame: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const state = reactive({
  // refs
  rowRef: useTemplateRef("row"),
});

const checkAndFocus = () => {
  if (manager.activeFrameNumber !== frame.number) return;

  const root = state.rowRef?.closest('.wireview');
  if (document.activeElement !== document.body && document.activeElement !== document.documentElement
      && !root?.contains(document.activeElement)) return;

  // if another row is currently focused
  const focusedIndex = parseInt(document.activeElement.dataset?.frameIndex);
  const isAnotherRowFocused = !isNaN(focusedIndex) && focusedIndex !== index;

  if (
    document.activeElement === document.body ||
    document.activeElement === document.documentElement ||
    isAnotherRowFocused
  )
    state.rowRef.focus();
};

// if a selected frame row scrolls into the viewport, focus it if nothing else is focused
onMounted(checkAndFocus);

watch(() => manager.activeFrameNumber, checkAndFocus, { flush: "post" });
</script>
<template>
  <div
    class="wv-row"
    @click="manager.setActiveFrameIndex(index)"
    ref="row"
    :style="{
      '--ws-row-bg': toHexColor(frame.bg),
      '--ws-row-fg': toHexColor(frame.fg),
    }"
    :data-frame-index="index"
    :tabindex="frame.number === manager.activeFrameNumber ? 0 : -1"
  >
    <div v-for="(_, index) in frame.columns">
      <div class="text">{{ frame.columns[index] }}</div>
    </div>
  </div>
</template>
<style scoped>
.wv-row {
  height: var(--ws-row-height);
  display: flex;
  min-width: 0;
  background-color: color-mix(in srgb, var(--ws-row-bg) var(--ws-protocol-mix), var(--ws-almost-white));
  color: var(--ws-protocol-fg, var(--ws-row-fg));
  position: relative;
}
.wv-row[tabindex="0"] {
  background-color: var(--ws-selected-unfocused-bg);
  color: var(--ws-selected-unfocused-fg);
}
.wv-row[tabindex="0"]::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-top: 1px solid var(--ws-selected-bg);
  border-bottom: 1px solid var(--ws-selected-bg);
}
.wv-row:focus {
  background-color: var(--ws-selected-bg);
  color: var(--ws-selected-fg);
}
.wv-row .text {
  padding: 0 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.wv-row > div { flex-shrink: 0; }

/* Assumes that the first column is the No. column */
.wv-row > div:first-child {
  text-align: right;
}

/* TODO: Generate this ?? */
.wv-row > div:nth-child(1) {
  width: var(--ws-col0-width);
}
.wv-row > div:nth-child(2) {
  width: var(--ws-col1-width);
}
.wv-row > div:nth-child(3) {
  width: var(--ws-col2-width);
}
.wv-row > div:nth-child(4) {
  width: var(--ws-col3-width);
}
.wv-row > div:nth-child(5) {
  width: var(--ws-col4-width);
}
.wv-row > div:nth-child(6) {
  width: var(--ws-col5-width);
}
.wv-row > div:nth-child(7) {
  width: var(--ws-col6-width);
}
</style>
