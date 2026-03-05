# VS7 · Notification Slice

## Domain Responsibility

The Notification slice owns **user notification records and delivery queries**.
It is the read-side of the notification system.
**Notification dispatch** (push/email/SMS) is the responsibility of `notification-hub.slice` [#A13],
not VS7 itself. VS7 stores the resulting notification records and provides query APIs.

## Main Entities

| Entity | Description |
|--------|-------------|
| `user-notification` | A delivered or pending notification record for a specific user. |
| `notification-channel` | Channel record: push / email / in-app. |
| `notification-preference` | User-level opt-in/opt-out per channel and category. |

## Service Layer Invariant [D3]

Components in VS7 **must not** import the Firestore SDK directly.
All Firestore subscriptions are encapsulated in `_services/notification-listener.ts`.
The hook `useUserNotifications` delegates to `createNotificationListener`.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| notification-hub | `NotificationDispatched` events → create notification records |
| Shared Kernel [VS0] | `SK_PORTS` for Firestore access via `IFirestoreRepo` |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| Projection Bus [L5] | `user-notification-view` read model |
| Client (`useUserNotifications` hook) | Real-time notification stream |

## Events Emitted

| Event | DLQ Level | Description |
|-------|-----------|-------------|
| `NotificationRead` | SAFE_AUTO | User marked a notification as read. |
| `NotificationDismissed` | SAFE_AUTO | User dismissed a notification. |

## Key Invariants

- **[D3]** All Firestore access via the service layer, never from components.
- **[#A13]** VS7 stores and queries notifications; it does not dispatch them.
- **[D24]** No direct `firebase/*` imports.
