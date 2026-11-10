<script setup>
import OpenFileIcon from './icons/OpenFileIcon.vue';
import FindIcon from './icons/FindIcon.vue';
import PreviousPacketIcon from './icons/PreviousPacketIcon.vue';
import NextPacketIcon from './icons/NextPacketIcon.vue';
import GoFirstIcon from './icons/GoFirstIcon.vue';
import GoLastIcon from './icons/GoLastIcon.vue';
import { useManager, useViewOptions } from '../globals';
import PcapFileInput from '../PcapFileInput.vue';
const manager = useManager();
const options = useViewOptions();
</script>
<template>
  <div class="ribbon" role="toolbar" aria-label="Packet navigation">
    <label v-if="!options.embedded" class="icon" title="Open capture file"><OpenFileIcon /><PcapFileInput /></label>
    <button v-if="!options.embedded" type="button" class="icon" :disabled="!manager.sessionInfo" @click="manager.closeFile()">Close</button>
    <button type="button" class="icon" title="Find a packet" aria-label="Find a packet" :disabled="!manager.sessionInfo" @click="manager.setFindFrameBarHidden()"><FindIcon /></button>
    <span class="separator"></span>
    <button type="button" class="icon" title="First packet" aria-label="First packet" :disabled="!manager.canGoToPreviousPacket" @click="manager.setActiveFrameIndex(0)"><GoFirstIcon /></button>
    <button type="button" class="icon" title="Previous packet" aria-label="Previous packet" :disabled="!manager.canGoToPreviousPacket" @click="manager.goToNearbyPacket(-1)"><PreviousPacketIcon /></button>
    <button type="button" class="icon" title="Next packet" aria-label="Next packet" :disabled="!manager.canGoToNextPacket" @click="manager.goToNearbyPacket(1)"><NextPacketIcon /></button>
    <button type="button" class="icon" title="Last packet" aria-label="Last packet" :disabled="!manager.canGoToNextPacket" @click="manager.setActiveFrameIndex(-1)"><GoLastIcon /></button>
  </div>
</template>
<style scoped>
.ribbon { background: var(--ws-light-gray); padding: 4px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; flex-shrink: 0; }
.icon { padding: 5px; display: flex; justify-content: center; align-items: center; border: 1px solid transparent; border-radius: 4px; min-width: 32px; min-height: 32px; background: transparent; }
.icon svg { width: 20px; height: 20px; }
.icon:hover:not(:disabled) { background: var(--ws-gray); border-color: var(--ws-darker-gray); }
.icon:has(input[disabled]) { pointer-events: none; opacity: .45; }
.icon input[type="file"] { display: none; }
.separator { margin: 0 4px; width: 1px; height: 22px; background: var(--ws-gray); }
@media (max-width: 767px) { .icon { min-width: 44px; } }
</style>
