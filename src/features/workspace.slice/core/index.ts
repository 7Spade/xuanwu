// Components
export { DashboardView } from './_components/dashboard-view'
export { WorkspacesView } from './_components/workspaces-view'
export { WorkspaceCard } from './_components/workspace-card'
export { WorkspaceGridView } from './_components/workspace-grid-view'
export { WorkspaceNavTabs } from './_components/workspace-nav-tabs'
export { WorkspaceSettingsDialog } from './_components/workspace-settings'
export { WorkspaceStatusBar } from './_components/workspace-status-bar'
export { WorkspaceTableView } from './_components/workspace-table-view'
export { CreateWorkspaceDialog } from './_components/create-workspace-dialog'
export { WorkspaceListHeader } from './_components/workspace-list-header'
// Providers
export { WorkspaceProvider, useWorkspace } from './_components/workspace-provider'
// Types
export type {
  Workspace,
  WorkspaceLifecycleState,
  WorkspacePersonnel,
  CapabilitySpec,
  Capability,
  Address,
  WorkspaceLocation,
} from './_types'
export { StatCards } from './_components/stat-cards'
// Hooks
export { useAccount } from './_hooks/use-account'
// Shell
export {
  ThemeAdapter,
  Header,
  NotificationCenter,
  AccountSwitcher,
  AccountCreateDialog,
  DashboardSidebar,
} from './_components/shell'
// Hooks
export { useVisibleWorkspaces } from './_hooks/use-visible-workspaces'
export { useWorkspaceCommands } from './_hooks/use-workspace-commands'
export { useWorkspaceEventHandler } from './_hooks/use-workspace-event-handler'
export { useApp } from './_hooks/use-app'
export { WorkspaceCapabilities } from './_components/workspace-capabilities'
export { handleCreateWorkspace, handleUpdateWorkspaceSettings, handleDeleteWorkspace, createWorkspaceWithCapabilities } from './_use-cases'
// WorkspaceLocation CRUD — FR-L1/FR-L2/FR-L3
export { createWorkspaceLocation, updateWorkspaceLocation, deleteWorkspaceLocation } from './_actions'
export { WorkspaceLocationsPanel } from './_components/workspace-locations-panel'
