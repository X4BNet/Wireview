import { inject } from "vue";

export const managerKey = Symbol("wireview-manager");
export const optionsKey = Symbol("wireview-options");

/** Resolve the manager owned by this viewer, never a process-wide singleton. */
export const useManager = () => {
  const manager = inject(managerKey);
  if (!manager) throw new Error("Wireview manager is unavailable");
  return manager;
};

export const useViewOptions = () => inject(optionsKey);
