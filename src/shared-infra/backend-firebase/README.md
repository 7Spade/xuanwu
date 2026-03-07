# Backend Firebase（後端）

本目錄代表「後端 Firebase 能力邊界」，不得由前端直接取代或繞過。

## 規範

- 後端 Firebase 一律透過 **Cloud Functions** 提供能力。
- 前端不得直接存取後端管理能力（例如 Admin 權限操作）。
- 所有需要提升權限、聚合寫入、或跨集合業務邏輯，必須在 Functions 內實作。

## 版本來源

後端 Firebase 版本由 Functions 套件鎖定（`src/shared-infra/backend-firebase/functions/package.json`）：

- `firebase-admin`: `^13.6.0`
- `firebase-functions`: `^7.0.0`

## 呼叫路徑（必要）

`Frontend` → `Callable/HTTP Function` → `Backend Firebase (Admin SDK)`

不允許：`Frontend` 直接使用 Admin SDK 或等效後端權限能力。
