import { h } from "vue";
import { useManager } from "../../../globals";

const spacers = {
  hexadecimal: { every1: " ", every8: "  " },
  decimal: { every1: " ", every8: "  " },
  octal: { every1: " ", every8: "  " },
  bits: { every1: " ", every8: "  " },
  ascii: { every1: null, every8: " " },
  ebcdic: { every1: null, every8: " " },
};

// TODO: possible reactivity issues here

export default {
  props: {
    bytesPerLine: {
      type: Number,
      required: true,
    },
    sourceIndex: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const manager = useManager();
    return () => {
      const bytes = manager.activeFrameDetails.getSourceData(props.sourceIndex);
      const lineCount = bytes.length / props.bytesPerLine;
      const groups = manager.activeFrameDetails.getGroupsForSource(
        props.sourceIndex
      );

      const nodes = [];

      const activeGroups = new Map();

      let groupIdx = 0;
      let changed = true;
      for (let line = 0; line < lineCount; line++) {
        // start groups
        const till = (line + 1) * props.bytesPerLine;
        while (groupIdx < groups.length && groups[groupIdx].start < till) {
          const { start, length, id } = groups[groupIdx++];

          const end = Math.floor((start + length - 1) / props.bytesPerLine);

          if (!activeGroups.has(end)) activeGroups.set(end, []);
          activeGroups.get(end).push(id);
          changed = true;
        }

        // line number (in hex)
        const lineNumber =
          (line * props.bytesPerLine).toString(16).padStart(4, "0") + "\n";

        if (changed) {
          const ids = [...activeGroups.values()].flat();
          const color = ids.reduce(
            (colorVar, id) => `var(--ws-linenumber-fg-${id}, ${colorVar})`,
            "inherit"
          );
          nodes.push({ color, html: lineNumber });
        } else nodes.at(-1).html += lineNumber;

        changed = false;

        // end groups
        if (activeGroups.has(line)) {
          activeGroups.delete(line);
          changed = true;
        }
      }

      const vnodes = nodes.map(({ html, color }) =>
        h("span", { style: { color } }, html)
      );
      return h("div", vnodes);
    };
  },
};
