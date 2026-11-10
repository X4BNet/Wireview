<script setup>
import { computed, reactive, watch } from "vue";
import { useManager } from "../../globals";
const manager = useManager();
import SourceDisplay from "./PacketBytes/SourceDisplay.vue";
import DataSourceTabBar from "./PacketBytes/DataSourceTabBar.vue";

const state = reactive({
  activeSourceIndex: null,

  // computed
  tabHeaders: [],
});
state.tabHeaders = computed(
  () => manager.activeFrameDetails?.getSourceNames() ?? []
);
watch(
  () => manager.activeFrameDetails,
  (activeFrameDetails) => {
    state.activeSourceIndex = activeFrameDetails?.sourceCount ? 0 : null;
  }
);
</script>

<template>
  <div class="packet-bytes-wrapper" v-if="state.activeSourceIndex !== null">
    <SourceDisplay :sourceIndex="state.activeSourceIndex" />
    <DataSourceTabBar
      :tabHeaders="state.tabHeaders"
      v-model:index="state.activeSourceIndex"
    />
  </div>
</template>

<style scoped>
.packet-bytes-wrapper {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
}
</style>
