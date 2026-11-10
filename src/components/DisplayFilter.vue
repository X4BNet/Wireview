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
            : 'Apply a display filter ... <Ctrl-/>'
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
.filter-container {
  display: flex;
  padding: 4px;
  border-top: var(--ws-pane-border);
  border-bottom: var(--ws-pane-border);
}
.filter-container .filter-bar {
  flex-grow: 1;

  display: flex;
  background-color: var(--ws-almost-white);
  border: var(--ws-pane-border);
  border-radius: 3px;
  overflow: hidden;
}
.filter-container.disabled .filter-bar {
  filter: saturate(0);
  border: var(--ws-pane-border);
  opacity: 0.75;
  pointer-events: none;
}
.filter-container .filter-bar input[type="text"] {
  flex-grow: 1;
  width: 0;
  color: var(--ws-fg);
  outline: none;
  border: none;
  background-color: var(--ws-display-filter-bg);
  padding: 1px 4px;
}
.apply-filter {
  border: none;
  background: none;
  padding: 0;
  outline: none;

  min-width: 32px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  margin: 0 5px;
  filter: none;
  opacity: 0.9;
}
.apply-filter:disabled {
  pointer-events: none;
  filter: grayscale(100%);
  opacity: 0.4;
}
.apply-filter:hover {
  filter: brightness(1.25);
}
.apply-filter:active {
  filter: brightness(1);
}
.apply-filter svg {
  height: 100%;
}
</style>
