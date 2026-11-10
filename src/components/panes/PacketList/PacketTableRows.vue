<script setup>
import { useManager } from "../../../globals";
const manager = useManager();
import Row from "./Row.vue";

const { table } = defineProps({
  table: {
    type: [Object, null],
    required: true,
  },
});

const handleRowFocus = (event) => {
  const frameIndex = parseInt(event.target?.dataset?.frameIndex);
  if (!isNaN(frameIndex)) manager.setActiveFrameIndex(frameIndex);
};

// TODO: Page Up/Down work, but the issue is that the focused row jumps around
//       with the current implementation. Ideally during a page up/down
//       operation the position of the focused row would not change
const handleRowKeydown = (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    manager.goToNearbyPacket(-1);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    manager.goToNearbyPacket(1);
    return;
  }

  const rowCount = table.frames.length - 1;

  if (event.key === "PageUp") {
    event.preventDefault();
    manager.goToNearbyPacket(-rowCount);
    return;
  }

  if (event.key === "PageDown") {
    event.preventDefault();
    manager.goToNearbyPacket(rowCount);
    return;
  }
};
</script>

<template>
  <div
    class="rows"
    v-if="table"
    @keydown="handleRowKeydown"
    @focusin.passive="handleRowFocus"
  >
    <Row
      v-for="(frame, index) in table.frames"
      :frame="frame"
      :key="frame.number"
      :index="table.startIndex + index"
    />
  </div>
</template>

<style scoped>
.rows {
  font-family: var(--ws-font-family-monospace);
  font-size: var(--ws-font-size-monospace);
  cursor: default;
}
</style>
