<script setup>
import { computed, reactive } from "vue";
import { useManager } from "../globals";
const manager = useManager();
import { useInterval } from "../composables.js";

const state = reactive({
  bridgeLoader: null,

  // computed
  packetCountInfo: null,
});

state.packetCountInfo = computed(() => {
  if (manager.packetCount === 0) return "No Packets";

  const packetCountInfo = `Packets: ${manager.packetCount}`;
  if (manager.displayFilter === "") return packetCountInfo;

  const displayedPercent = (
    (manager.frameCount * 100) /
    manager.packetCount
  ).toFixed(1);

  return `${packetCountInfo} · Displayed: ${manager.frameCount} (${displayedPercent}%)`;
});

const generateDescription = (request) => {
  if (request.type === "frames") {
    if (manager.displayFilter)
      return `Loading frames for display filter '${manager.displayFilter}'`;
    return "Loading frames";
  }

  if (request.type === "open") return "Parsing frames from file";
  return "Loading";
};

const updateLoader = () => {
  const request = manager.activeBridgeRequest;
  if (request === null) {
    state.bridgeLoader = null;
    return;
  }

  const timeTaken = Date.now() - request.timestamp;
  if (timeTaken < 1000) {
    state.bridgeLoader = null;
    return;
  }

  const description = generateDescription(request);
  state.bridgeLoader = `${description}... ${Math.round(timeTaken / 1000)}s`;
};

useInterval(updateLoader, 1000);
</script>
<template>
  <div class="status-bar">
    <div>{{ state.bridgeLoader || "Wireview · Wireshark" }}</div>
    <div>{{ state.packetCountInfo }}</div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  gap: 4px 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ws-muted);
  border-top: var(--ws-pane-border);
}
</style>
