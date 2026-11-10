<script setup>
import DetailTree from "./PacketDetails/DetailTree.js";
import { useManager } from "../../globals";
const manager = useManager();
import { reactive } from "vue";

const state = reactive({
  collapseTree: [],
});
</script>
<template>
  <div class="details-container">
    <DetailTree
      v-if="manager.activeFrameDetails?.tree"
      :details="manager.activeFrameDetails"
    />
  </div>
</template>
<style scoped>
/* this comes from the layout */
.needs-border-bottom .details-container {
  border-bottom: var(--ws-pane-border);
}
.details-container {
  flex-grow: 1;
  overflow: auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  background-color: var(--ws-almost-white);
  font-family: var(--ws-font-family-monospace);
  font-size: var(--ws-font-size-monospace);
  line-height: var(--ws-row-height);
}

:deep(.children) {
  --ws-detail-indent: 0;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.collapsed + .children) {
  display: none;
}
</style>
