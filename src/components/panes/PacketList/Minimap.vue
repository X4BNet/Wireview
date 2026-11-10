<script setup>
import { watch, useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
import { useManager } from '../../../globals';
import { toHexColor } from '../../../util';
const manager = useManager();
const props = defineProps({ frameInfo: Object, width: Number, height: Number });
const canvas = useTemplateRef('minimap-canvas');
let observer;
const paint = () => {
  const el = canvas.value;
  if (!el || !props.frameInfo) return;
  const style = getComputedStyle(el);
  const surface = style.getPropertyValue('--ws-almost-white').trim();
  const selection = style.getPropertyValue('--ws-selected-bg').trim();
  const mix = style.getPropertyValue('--ws-protocol-mix').trim();
  const context = el.getContext('2d');
  context.fillStyle = surface;
  context.fillRect(0, 0, el.width, el.height);
  const { frames, offset = 0 } = props.frameInfo;
  for (let y = 0; y < el.height && y + offset < frames.length; y++) {
    const frame = frames[y + offset];
    context.fillStyle = manager.activeFrameNumber === frame.number ? selection : `color-mix(in srgb, ${toHexColor(frame.bg)} ${mix}, ${surface})`;
    context.fillRect(0, y, el.width, 1);
  }
};
watch([() => props.frameInfo, () => manager.activeFrameNumber, () => props.height], paint, { flush: 'post' });
const media = matchMedia('(prefers-color-scheme: dark)');
onMounted(() => {
  observer = new MutationObserver(paint);
  observer.observe(canvas.value.closest('.wireview'), { attributes: true, attributeFilter: ['data-theme'] });
  media.addEventListener('change', paint); paint();
});
onBeforeUnmount(() => { observer?.disconnect(); media.removeEventListener('change', paint); });
</script>
<template><div class="minimap" aria-hidden="true"><canvas ref="minimap-canvas" :width="Math.max(0, width - 2)" :height="Math.max(0, height - 2)"></canvas></div></template>
<style scoped>
.minimap { flex-shrink: 0; position: sticky; right: 0; background: var(--ws-almost-white); border-left: var(--ws-pane-border); }
.minimap canvas { display: block; }
@media (max-width: 767px) { .minimap { display: none; } }
</style>
