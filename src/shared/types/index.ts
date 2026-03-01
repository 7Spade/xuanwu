// Legacy compatibility barrel for shared/common DTOs.
// Do not add new cross-BC domain contracts here.
// Priority: shared.kernel.* > feature slice public API > shared/types fallback.
export * from "./account.types";
export * from "./workspace.types";
export * from "./schedule.types";
export * from "./task.types";
export * from "./daily.types";
export * from "./audit.types";
export * from "./skill.types";
