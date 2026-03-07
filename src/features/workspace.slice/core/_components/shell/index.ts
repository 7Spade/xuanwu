/**
 * Module: index.ts
 * Purpose: Provide a single public barrel for workspace shell components
 * Responsibilities: re-export shell UI components from one stable entrypoint
 * Constraints: deterministic logic, respect module boundaries
 */

export { ThemeAdapter } from './theme-adapter'
export { Header } from './header'
export { NotificationCenter } from './notification-center'
export { AccountSwitcher } from './account-switcher'
export { AccountCreateDialog } from './account-create-dialog'
export { DashboardSidebar } from './dashboard-sidebar'