# src/shadcn-ui/custom-ui

以 shadcn/ui 組件為基礎自訂的複合組件。組件僅含 UI 邏輯，不包含業務邏輯或 Firestore 呼叫。

## Files

| File | Exports | Purpose |
|------|---------|---------|
| `language-switcher.tsx` | `LanguageSwitcher` | 多語系切換下拉選單 |
| `page-header.tsx` | `PageHeader` | 頁面標題列（title / description / actions） |

## Usage

```ts
import { LanguageSwitcher } from "@/shadcn-ui/custom-ui/language-switcher"
import { PageHeader } from "@/shadcn-ui/custom-ui/page-header"
```
