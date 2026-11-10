<script setup>
import { computed, reactive, watch } from "vue";
import { useManager } from "../../../globals";
const manager = useManager();
import { watchMouseDragMove } from "../../../util";

// TODO: Allow for column reordering

// constants
const minColWidth = 34;

const getDefaultColWidth = (colName) => {
  if (["Source", "Destination", "Info"].includes(colName)) return 200;
  return 80;
};

const { visibleWidth } = defineProps({
  visibleWidth: {
    type: [Number, null],
    required: true,
  },
});

const state = reactive({
  columnWidths: [],

  // computed properties
  extraSpaceLeft: 0,
  columnWidthStyles: {},
});
state.extraSpaceLeft = computed(() => {
  const spaceTaken = state.columnWidths.reduce((sum, width) => sum + width);
  return Math.max(0, visibleWidth - spaceTaken);
});
state.columnWidthStyles = computed(() => {
  const styleObj = {};
  for (let [index, width] of state.columnWidths.entries()) {
    if (index === state.columnWidths.length - 1) width += state.extraSpaceLeft;
    styleObj[`--ws-col${index}-width`] = width + "px";
  }
  return styleObj;
});

watch(
  [() => manager.columns, () => visibleWidth],
  () => {
    while (state.columnWidths.length < manager.columns.length)
      state.columnWidths.push(
        getDefaultColWidth(manager.columns[state.columnWidths.length])
      );
  },
  { immediate: true }
);

// Resizing
const handleColumnResize = (event, columnIndex) => {
  let columnWidth = state.columnWidths[columnIndex];

  // if the user is trying to resize the last column,
  // add any additional space to the column
  if (columnIndex === state.columnWidths.length - 1)
    columnWidth += state.extraSpaceLeft;

  const handleMouseDragMove = ({ deltaX }) => {
    const newColumnWidth = Math.max(minColWidth, columnWidth + deltaX);
    state.columnWidths[columnIndex] = newColumnWidth;
  };
  watchMouseDragMove(event, handleMouseDragMove);
};
</script>

<template>
  <div class="wv-table" :style="state.columnWidthStyles">
    <div class="header">
      <div
        v-for="(col, index) in manager.columns"
        :style="{ width: `var(--ws-col${index}-width)` }"
      >
        <div class="text">{{ col }}</div>
        <div
          class="h-resize"
          :title="'Width: ' + state.columnWidths[index]"
          @pointerdown.prevent="(e) => handleColumnResize(e, index)"
        ></div>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.wv-table {
  flex-grow: 1;
  align-items: stretch;
  background-color: var(--ws-almost-white);
}
.wv-table.invisible {
  opacity: 0;
}
.wv-table > .header {
  display: flex;
  font: var(--ws-font-sans-serif);
  background: linear-gradient(
    to bottom,
    var(--ws-lighter-gray),
    var(--ws-gray)
  );
  border-bottom: var(--ws-pane-border);
  user-select: none;
}
.wv-table > .header > div {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  min-width: 0;
}
.wv-table > .header .text {
  flex-grow: 1;
  padding: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.wv-table > .header .h-resize {
  width: 1px;
  background-color: var(--ws-darker-gray);
  cursor: e-resize;
  position: relative;
}
.wv-table > .header .h-resize::after {
  content: "";
  position: absolute;
  top: 0;
  left: -3px;
  height: 100%;
  width: 12px;
  touch-action: none;
}
</style>
