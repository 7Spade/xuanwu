# notification-hub.slice · Side-Effect Outlet

## Domain Responsibility

`notification-hub.slice` is the **only side-effect outlet for notifications** [#A13].
It handles push, email, and in-app notification dispatch. Business slices (VS5, VS6) must
NOT call `sendEmail`, `sendPush`, or `sendSMS` directly — they route requests through this hub.

## Incoming Dependencies

| Source | What is consumed |
|--------|-----------------|
| IER | Side-effect trigger events from any domain slice |
| VS6 Scheduling | Assignment notifications |
| VS5 Workspace | Workflow state-change notifications |

## Outgoing Dependencies

| Target | What is produced |
|--------|-----------------|
| VS7 Notification | `NotificationDispatched` → creates notification records |
| Firebase Messaging (via `IMessaging` port) | Actual push delivery |
| Email provider (via port) | Actual email delivery |

## Key Invariants

- **[#A13]** Only `notification-hub.slice` may call push/email/SMS dispatch.
- **[D26]** Business slices must not contain notification dispatch logic.
- **[D3]** Notification-hub uses the service layer for all Firestore access; components must not import Firestore SDK directly.
- **[D24]** No direct `firebase/*` imports; uses `IMessaging` and `IFirestoreRepo` ports.
