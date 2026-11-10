<script setup>
import { reactive } from "vue";
import { useManager } from "../globals";
const manager = useManager();

const state = reactive({
  searchInProgress: false,
  case_sensitive: false,
});

const findParams = reactive({
  target: "list",
  input_type: "string",
  search_term: "",
  charset: "all",
  backwards: false,
  multiple_occurrences: true,
});

const handleSubmit = () => {
  if (state.searchInProgress) return;
  state.searchInProgress = true;

  const params = {
    ...findParams,
    case_insensitive: !state.case_sensitive,
    frame_number: manager.activeFrameNumber,
    filter: manager.displayFilter,
  };

  if (manager.activeFieldInfo) {
    const { ptr, range } = manager.activeFieldInfo;
    if (ptr) params.field_info_ptr = ptr;
    if (range?.[0] === manager.activeFrameNumber) {
      params.search_pos = range[1];
      params.search_len = range[2] - range[1];
    }
  }

  manager
    .findFrame(params)
    .then((result) => {
      if (!result) return;

      manager.setActiveFrameNumber(result.frame_number);

      if (result.field_info_ptr || result.search_len) {
        const range = result.search_len
          ? [
              result.frame_number,
              result.search_pos,
              result.search_pos + result.search_len,
            ]
          : null;

        manager.setActiveFieldInfo(result.field_info_ptr || null, range);
      }
    })
    .catch(() => {})
    .finally(() => (state.searchInProgress = false));
};

const handleCancelKeyPress = (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    manager.setFindFrameBarHidden(true);
  }
};
</script>
<template>
  <form class="bar" action="/" @submit.prevent="handleSubmit">
    <div class="wv-row">
      <select aria-label="Search in"
        v-model="findParams.target"
        :disabled="
          ['display_filter', 'hex_value'].includes(findParams.input_type)
        "
      >
        <option value="list">Packet list</option>
        <option value="details">Packet details</option>
        <option value="bytes">Packet bytes</option>
      </select>
      <select aria-label="Search type" v-model="findParams.input_type">
        <option value="display_filter">Display filter</option>
        <option value="hex_value">Hex value</option>
        <option value="string">String</option>
        <option value="regex">Regular Expression</option>
      </select>
      <input type="text" aria-label="Find packet text" v-model="findParams.search_term" />
      <button
        type="submit"
        :disabled="state.searchInProgress || findParams.search_term === ''"
        
      >
        Find
      </button>
      <button
        type="button"
        @click="() => manager.setFindFrameBarHidden(true)"
        @keypress="handleCancelKeyPress"
      >
        Cancel
      </button>
    </div>
    <div class="wv-row">
      <label>
        <strong class="text">Options:</strong>&nbsp;
        <select
          v-model="findParams.charset"
          :disabled="findParams.input_type !== 'string'"
        >
          <option value="all">Narrow & Wide</option>
          <option value="utf-8">Narrow (UTF-8 / ASCII)</option>
          <option value="utf-16">Wide (UTF-16)</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          v-model="findParams.case_sensitive"
          :disabled="
            ['display_filter', 'hex_value'].includes(findParams.input_type)
          "
        />
        Case sensitive
      </label>
      <label>
        <input type="checkbox" v-model="findParams.backwards" />
        Backwards
      </label>
      <label>
        <input type="checkbox" v-model="findParams.multiple_occurrences" />
        Multiple occurrences
      </label>
    </div>
  </form>
</template>
<style scoped>
.bar {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-bottom: var(--ws-pane-border);
}
.bar .wv-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 5px;
}
.bar .wv-row > * {
  min-height: 32px;
}
.bar select {
  border-radius: 3px;
  border: var(--ws-pane-border);
  background: linear-gradient(to bottom, var(--ws-almost-white), var(--ws-light-gray));
}
.bar input[type="text"] {
  border-radius: 3px;
  border: var(--ws-pane-border);
  flex-grow: 1;
}
.bar button {
  width: 80px;
  border: var(--ws-pane-border);
  background: linear-gradient(to bottom, var(--ws-almost-white), var(--ws-light-gray));
  border-radius: 3px;
}
.bar label {
  display: flex;
  align-items: center;
}
.bar label select {
  align-self: stretch;
}
.bar select:hover:not(:disabled),
.bar button:hover:not(:disabled) {
  filter: brightness(1.05);
}
</style>
