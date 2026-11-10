<script setup>
import { reactive, useTemplateRef, watch } from "vue";
import Triangle from "../../icons/TriangleIcon.vue";
const { id, label, indent, active, collapsed } = defineProps({
  id: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  indent: {
    type: Number,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
  },
  collapsed: {
    type: [Boolean, null],
    required: true,
  },
});

const state = reactive({
  rowRef: useTemplateRef("dt-row"),
});

// if this row is now active, but another row is focused, focus this row.
watch(
  () => active,
  () => {
    if (!active) return;

    const focusedDetailId = parseInt(document.activeElement.dataset?.detailId);

    if (!isNaN(focusedDetailId) && focusedDetailId !== id) state.rowRef.focus();
  },
  {
    flush: "post",
  }
);
</script>

<template>
  <div
    class="wv-row"
    ref="dt-row"
    :class="{ collapsed }"
    :tabindex="active ? 0 : -1"
    :data-detail-id="id"
  >
    <div class="indent" :style="{ width: indent * 20 + 'px' }"></div>
    <div class="triangle" data-toggle-collapse="true">
      <Triangle v-show="collapsed !== null" />
    </div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<style scoped>
.wv-row {
  display: flex;
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
.wv-row > * {
  flex-shrink: 0;
}
.wv-row > .indent {
  pointer-events: none;
}
.wv-row .triangle {
  width: 20px;

  display: flex;
  justify-content: center;
  align-items: center;
}
.wv-row .triangle svg {
  width: 7px;
  height: 7px;
  object-fit: contain;
  fill: var(--ws-darkest-gray);
  pointer-events: none;
}
.wv-row.collapsed .triangle svg {
  transform: rotateZ(-90deg);
}
.wv-row .label {
  white-space: nowrap;
}
</style>
