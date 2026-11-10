<script setup>
import { useManager, useViewOptions } from "./globals";
const manager = useManager();
const options = useViewOptions();

const onFileSelect = (e) => {


  if (e.target.files?.[0]) manager.openFile(e.target.files[0]).catch((error) => { options.error = error.message; });
};
</script>

<template>
  <input
    type="file"
    aria-label="Open capture file"
    accept=".cap,.pcap,.pcapng,application/vnd.tcpdump.pcap"
    @change="onFileSelect"
    :disabled="!manager.canOpenFile"
  />
</template>
