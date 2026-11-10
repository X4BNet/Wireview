<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useManager } from "../globals";
const manager = useManager();
import FilterApplyIcon from "./icons/FilterApplyIcon.vue";

const isFilterValid = ref(null);
const displayFilterInput = ref("");
const inputRef = useTemplateRef("dfilter");

watch(
  () => displayFilterInput.value,
  async (filter) => {
    if (filter === "") {
      isFilterValid.value = null;
      return;
    }

    try {
      const result = await manager.checkFilter(filter);
      if (displayFilterInput.value === filter) isFilterValid.value = result.ok;
    } catch { isFilterValid.value = false; }
  }
);

const handleSubmit = () => {
  manager.setDisplayFilter(displayFilterInput.value).catch(() => { isFilterValid.value = false; });
};

// Ctrl-/ or Command-/
const handleGlobalKeydown = (event) => {
  if (event.key === "/" && !event.shiftKey && (event.ctrlKey !== event.metaKey)) {
    event.preventDefault();
    inputRef.value.focus();
  }
};
onMounted(() => inputRef.value.closest(".wireview").addEventListener("keydown", handleGlobalKeydown));
onBeforeUnmount(() =>
  inputRef.value?.closest(".wireview")?.removeEventListener("keydown", handleGlobalKeydown)
);
</script>
<template>
  <div class="filter-container" :class="{ disabled: !manager.sessionInfo }">
    <form class="filter-bar" @submit.prevent="handleSubmit">
      <input
        type="text"
        name="dfilter"
        aria-label="Display filter"
        ref="dfilter"
        v-model="displayFilterInput"
        :placeholder="
          manager.displayFilter
            ? `Current filter: ${manager.displayFilter}`
            : 'Display filter (e.g. tcp)'
        "
        :disabled="!manager.sessionInfo"
        :style="{
          '--ws-display-filter-bg':
            isFilterValid === null
              ? 'transparent'
              : isFilterValid
              ? 'var(--ws-ugly-green)'
              : 'var(--ws-ugly-red)',
        }"
      />
      <button
        type="submit"
        class="apply-filter"
        title="Apply display filter"
        :disabled="
          isFilterValid === false ||
          manager.displayFilter === displayFilterInput
        "
      >
        <FilterApplyIcon />
      </button>
    </form>
    <!-- There's a button to add a display filter button. This feature is Not Planned -->
  </div>
</template>
<style scoped>
.filter-container { display: flex; flex-shrink: 0; min-width: 0; padding: 6px 8px; border-top: var(--ws-pane-border); border-bottom: var(--ws-pane-border); }
.filter-bar { display: flex; align-items: stretch; flex: 1; min-width: 0; width: 100%; height: 38px; background: var(--ws-almost-white); border: var(--ws-pane-border); border-radius: 4px; overflow: hidden; }
.filter-container.disabled .filter-bar { opacity: .6; pointer-events: none; }
.filter-container .filter-bar input[type="text"] { flex: 1 1 0%; min-width: 0; min-height: 0; width: 100%; height: 100%; margin: 0; padding: 6px 10px; border: 0; border-radius: 0; outline: none; background: var(--ws-display-filter-bg); color: var(--ws-fg); font: 14px/22px var(--ws-font-family-monospace); }
.filter-bar:focus-within { border-color: var(--ws-selected-bg); }
.apply-filter { flex: 0 0 36px; width: 36px; min-width: 36px; min-height: 0; height: 100%; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; border: 0; border-left: var(--ws-pane-border); border-radius: 0; background: var(--ws-light-gray); color: var(--ws-fg); }
.apply-filter svg { display: block; flex: none; width: 20px; height: 14px; }
.apply-filter:disabled { opacity: .45; }
.apply-filter:hover:not(:disabled) { background: var(--ws-gray); }
@media (max-width: 767px) {
  .filter-bar { height: 46px; }
  .filter-container .filter-bar input[type="text"] { font-size: 16px; padding: 10px; }
  .apply-filter { flex-basis: 44px; width: 44px; min-width: 44px; }
}
</style>
