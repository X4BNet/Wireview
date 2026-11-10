import { h } from "vue";
import BytesFormatter from "../../../classes/BytesFormatter";
import { useManager } from "../../../globals";

const spacers = {
  hexadecimal: { every1: " ", every8: "  " },
  decimal: { every1: " ", every8: "  " },
  octal: { every1: " ", every8: "  " },
  bits: { every1: " ", every8: "  " },
  ascii: { every1: null, every8: " " },
  ebcdic: { every1: null, every8: " " },
};

// TODO: highlighting only works if groups are hierarchical.
//       this might become an issue later when searching through packet bytes
//       and we can't really highlight an arbitrary range of bytes
//       See "skipped" variable below that tracks this.

export default {
  props: {
    displayFormat: {
      type: String,
      required: true,
    },
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
      const spacer = spacers[props.displayFormat];
      const bytes = manager.activeFrameDetails.getSourceData(props.sourceIndex);
      const displayBytes = BytesFormatter.format(bytes, props.displayFormat);
      const groups = manager.activeFrameDetails.getGroupsForSource(
        props.sourceIndex
      );

      const nodeStack = [{ end: Infinity, children: [] }];
      const addText = (text) => {
        const { children } = nodeStack.at(-1);
        if (typeof children.at(-1) === "string")
          children[children.length - 1] += text;
        else children.push(text);
      };
      const skipped = [];

      let groupIdx = 0;
      for (const [idx, displayByte] of displayBytes.entries()) {
        // spacers
        if (idx) {
          if (idx % props.bytesPerLine === 0) addText("\n");
          else if (idx % 8 === 0) addText(spacer.every8);
          else if (spacer.every1 !== null) addText(spacer.every1);
        }

        // start groups
        while (groupIdx < groups.length && groups[groupIdx].start <= idx) {
          const { start, length, id } = groups[groupIdx++];
          console.assert(start === idx, "start is not the same as index");

          const end = start + length;
          if (end > nodeStack.at(-1).end) {
            skipped.push({ end, start, length, id });
            continue;
          }
          nodeStack.push({ end, children: [], id });
        }

        // actual bytes
        addText(displayByte);

        // end groups
        while (nodeStack.at(-1).end === idx + 1) {
          const { id, children } = nodeStack.pop();

          const style = {
            color: `var(--ws-detail-fg-${id}, inherit)`,
            backgroundColor: `var(--ws-detail-bg-${id}, inherit)`,
          };
          const vnode = h("span", { "data-detail-id": id, style }, children);

          nodeStack.at(-1).children.push(vnode);
        }
      }
      if (skipped.length) console.info("Skipped highlight groups: ", skipped);
      return h("div", nodeStack[0].children);
    };
  },
};
