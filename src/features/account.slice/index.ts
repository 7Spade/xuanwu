/**
 * account.slice — Public API
 *
 * Consolidated VS2 Account vertical slice.
 * Covers: User Profile, User Wallet, User Notifications,
 *         Account Governance Role, Account Governance Policy,
 *         Notification Router.
 *
 * Organization sub-domains (Org Members, Org Partners, Org Policy,
 * Org Teams, Org Core, Org Event Bus) have been migrated to
 * @/features/organization.slice (VS4).
 *
 * External consumers import exclusively from this file.
 */

// =================================================================
// User Profile (account-user.profile)
// =================================================================
export { UserSettingsView, UserSettings, ProfileCard, PreferencesCard, SecurityCard } from './user.profile';
export { useUser } from './user.profile';
export { createUserAccount, updateUserProfile } from './user.profile';
export { getUserProfile } from './user.profile';

// =================================================================
// User Notification (account-user.notification)
// =================================================================
export { deliverNotification, type NotificationDeliveryInput, type DeliveryResult } from './user.notification';
export { subscribeToNotifications, markNotificationRead } from './user.notification';
export { useUserNotifications } from './user.notification';
export { NotificationBadge, NotificationList } from './user.notification';

// =================================================================
// User Wallet (account-user.wallet)
// Strong-consistency financial ledger [SK_READ_CONSISTENCY: STRONG_READ]
// =================================================================
export { creditWallet, debitWallet } from './user.wallet';
export type { WalletTransaction, TopUpInput, DebitInput } from './user.wallet';
export { getWalletBalance, subscribeToWalletBalance, subscribeToWalletTransactions } from './user.wallet';
export type { WalletTransactionRecord } from './user.wallet';
export { useWallet } from './user.wallet';

// =================================================================
// Governance: Notification Router (account-governance.notification-router)
// FCM Layer 2 — routes org events to target accounts [E3]
// =================================================================
export { registerNotificationRouter, type RouterRegistration } from './gov.notification-router';

// =================================================================
// Governance: Account Role (account-governance.role)
// Role changes trigger CUSTOM_CLAIMS refresh [S6]
// =================================================================
export { assignAccountRole, revokeAccountRole } from './gov.role';
export type { AccountRoleRecord, AssignRoleInput, TokenRefreshSignal, TokenRefreshReason } from './gov.role';
export { getAccountRole, subscribeToAccountRoles } from './gov.role';
export { useAccountRole } from './gov.role';
export { PermissionMatrixView, PermissionTree } from './gov.role';

// =================================================================
// Governance: Account Policy (account-governance.policy)
// Policy changes trigger CUSTOM_CLAIMS refresh [S6]
// =================================================================
export { createAccountPolicy, updateAccountPolicy, deleteAccountPolicy } from './gov.policy';
export type { AccountPolicy, PolicyRule, CreatePolicyInput, UpdatePolicyInput } from './gov.policy';
export { getAccountPolicy, subscribeToAccountPolicies, getActiveAccountPolicies } from './gov.policy';
export { useAccountPolicy } from './gov.policy';
