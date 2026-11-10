import { h, reactive, watch } from "vue";
import DetailRow from "./DetailRow.vue";
import FrameDetailsTree from "../../../classes/FrameDetailsTree";
import { useManager } from "../../../globals";

export default {
  props: {
    details: {
      type: FrameDetailsTree,
      required: true,
    },
  },
  setup(props) {
    const manager = useManager();
    const state = reactive({
      collapsed: new Map(),
    });

    const getDetailId = (el) => {
      let element = el.closest("[data-detail-id]");
      const detailId = parseInt(element?.dataset?.detailId);
      return isNaN(detailId) ? null : detailId;
    };

    const expandTrees = (tree, id) => {
      for (const detail of tree) {
        if (detail.field_info_ptr === id) return true;

        if (expandTrees(detail.tree, id)) {
          state.collapsed.set(detail.field_info_ptr, false);
          return true;
        }
      }
      return false;
    };

    // if a frame detail is selected externally, we need to focus it,
    // and additionally expand any parents so that it is actually visible
    watch(
      () => manager.activeFieldInfo,
      (fieldInfo) => {
        if (!fieldInfo?.ptr) return;

        expandTrees(props.details.tree, fieldInfo.ptr);
      },
      { immediate: true }
    );

    const onPointerdown = (event) => {
      const detailId = getDetailId(event.target);

      if (detailId === null) return;

      manager.setActiveFieldInfo(detailId);
      if (event.target.dataset?.toggleCollapse) {
        state.collapsed.set(detailId, !(state.collapsed.get(detailId) ?? true));
        return;
      }
    };

    const onFocusin = (event) => {
      const detailId = getDetailId(event.target);
      if (detailId === null) return;

      manager.setActiveFieldInfo(detailId);
    };

    const onDblclick = (event) => {
      const detailId = getDetailId(event.target);
      if (detailId === null) return;

      // don't take into account elements that toggle collapse on mousedown
      if (!event.target.dataset?.toggleCollapse) {
        event.preventDefault();
        state.collapsed.set(detailId, !(state.collapsed.get(detailId) ?? true));
        return;
      }
    };

    const onKeydown = (event) => {
      const detailId = getDetailId(event.target);
      if (detailId === null) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        state.collapsed.set(detailId, true);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        // TODO: If already collapsed, jump to parent instead
        state.collapsed.set(detailId, false);
        return;
      }
    };

    const toVnode = (detail, indent = 0) => {
      const id = props.details.getId(detail);
      const { label, tree } = detail;
      const hasChildren = (tree?.length ?? 0) > 0;
      const row = h(DetailRow, {
        id,
        label,
        indent,
        active: id === manager.activeFieldInfo?.ptr,
        collapsed: hasChildren ? state.collapsed.get(id) ?? true : null,
      });
      if (!hasChildren) return row;
      const children = tree.flatMap((detail) => toVnode(detail, indent + 1));
      const childrenContainer = h(
        "div",
        { class: "children", "data-detail-id": id, key: detail },
        children
      );
      return [row, childrenContainer];
    };

    return () => {
      if (manager.activeFieldInfo?.ptr)
        expandTrees(props.details.tree, manager.activeFieldInfo.ptr);
      const children = props.details.tree.flatMap((detail) => toVnode(detail));
      return h(
        "div",
        { class: "children", onPointerdown, onDblclick, onFocusin, onKeydown },
        children
      );
    };
  },
};
