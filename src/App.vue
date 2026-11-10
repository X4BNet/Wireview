<script setup>
import IconRibbon from "./components/IconRibbon.vue";
import DisplayFilter from "./components/DisplayFilter.vue";
import DefaultLayout from "./components/layouts/DefaultLayout.vue";
import PacketList from "./components/panes/PacketList.vue";
import PacketBytes from "./components/panes/PacketBytes.vue";
import PacketDetails from "./components/panes/PacketDetails.vue";
import StatusBar from "./components/StatusBar.vue";
import { useManager, useViewOptions } from "./globals";
import Welcome from "./components/Welcome.vue";
import FindFrameBar from "./components/FindFrameBar.vue";
const manager = useManager();
const options = useViewOptions();
</script>
<template>
  <div class="wireview" :data-theme="options.theme" :style="{
    '--ws-row-height': manager.rowHeight + 'px',
    '--ws-font-size-monospace': manager.fontSize + 'px',
  }">
    <IconRibbon />
    <DisplayFilter />
    <div v-if="options.error" class="wv-message wv-error" role="alert">{{ options.error }}</div>
    <template v-if="manager.sessionInfo !== null">
      <FindFrameBar v-show="!manager.findFrameBarHidden" />
      <div v-if="manager.packetCount === 0" class="wv-message" role="status">This capture contains no packets.</div>
      <DefaultLayout>
        <template #slot1><PacketList /></template>
        <template #slot2><PacketDetails /></template>
        <template #slot3><PacketBytes /></template>
      </DefaultLayout>
    </template>
    <div v-else-if="options.embedded" class="wv-message wv-loading" role="status">
      {{ options.error ? 'The capture could not be opened.' : 'Loading packet capture…' }}
    </div>
    <Welcome v-else />
    <StatusBar />
  </div>
</template>
