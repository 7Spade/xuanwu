# Files

## File: package.json
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "description": "x",
  "author": "7s.i@pm.me",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/7Spade/Ac-Xuanwu.git"
  },
  "bugs": {
    "url": "https://github.com/7Spade/Ac-Xuanwu/issues"
  },
  "homepage": "https://Ac-Xuanwu.com",
  "license": "MIT",
  "private": true,
  "engines": {
    "node": "22"
  },
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --cache --cache-location .eslintcache --config eslint.config.mts .",
    "lint:fix": "npm run lint -- --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm install && npm run lint && npm run typecheck",
    "deploy:functions": "firebase deploy --only functions --config ./src/shared-infra/firebase/firebase.json",
    "deploy:indexes": "firebase deploy --only firestore:indexes --config ./src/shared-infra/firebase/firebase.json",
    "deploy:firestore-rules": "firebase deploy --only firestore:rules --config ./src/shared-infra/firebase/firebase.json",
    "deploy:storage-rules": "firebase deploy --only storage --config ./src/shared-infra/firebase/firebase.json"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@genkit-ai/google-genai": "^1.20.0",
    "@genkit-ai/next": "^1.20.0",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-table": "^8.21.3",
    "@xstate/react": "^6.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "eslint-plugin-tailwindcss": "^3.18.2",
    "eslint-plugin-xstate": "^3.2.1",
    "firebase": "^11.9.1",
    "genkit": "^1.20.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.475.0",
    "next": "^15.5.12",
    "next-themes": "^0.4.6",
    "patch-package": "^8.0.0",
    "react": "^19.2.1",
    "react-day-picker": "^9.13.2",
    "react-dom": "^19.2.1",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.2",
    "recharts": "^2.15.4",
    "repomix": "^1.12.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "xstate": "^5.28.0",
    "zod": "^3.25.76",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/eslint-plugin-jsx-a11y": "^6.10.1",
    "@types/eslint-plugin-tailwindcss": "^3.17.0",
    "@types/node": "^20.17.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.17.0",
    "eslint-config-google": "^0.14.0",
    "eslint-config-next": "^15.5.12",
    "eslint-plugin-check-file": "^3.3.1",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "genkit-cli": "^1.20.0",
    "globals": "^15.14.0",
    "jiti": "^2.6.1",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.56.1",
    "vitest": "^4.0.18"
  },
  "overrides": {
    "eslint": "^9.17.0",
    "@typescript-eslint/eslint-plugin": "^8.56.1",
    "@typescript-eslint/parser": "^8.56.1"
  }
}
```

## File: src/app-runtime/ai/dev.ts
```typescript
import { config } from 'dotenv';
```

## File: src/app-runtime/ai/flows/adapt-ui-color-to-account-context.ts
```typescript
import {z} from 'genkit';
import {ai} from '@/app-runtime/ai/genkit';
⋮----
export type AdaptUIColorToAccountContextInput = z.infer<
  typeof AdaptUIColorToAccountContextInputSchema
>;
⋮----
export type AdaptUIColorToAccountContextOutput = z.infer<
  typeof AdaptUIColorToAccountContextOutputSchema
>;
export async function adaptUIColorToAccountContext(
  input: AdaptUIColorToAccountContextInput
): Promise<AdaptUIColorToAccountContextOutput>
```

## File: src/app-runtime/ai/flows/extract-invoice-items.ts
```typescript
import { type z } from 'genkit';
import { ai } from '@/app-runtime/ai/genkit';
import {
  ExtractInvoiceItemsInputSchema,
  ExtractInvoiceItemsOutputSchema,
} from '@/app-runtime/ai/schemas/docu-parse';
export async function extractInvoiceItems(
  input: z.infer<typeof ExtractInvoiceItemsInputSchema>
): Promise<z.infer<typeof ExtractInvoiceItemsOutputSchema>>
```

## File: src/app-runtime/ai/genkit.ts
```typescript
import {googleAI} from '@genkit-ai/google-genai';
import {genkit} from 'genkit';
```

## File: src/app-runtime/ai/index.ts
```typescript

```

## File: src/app-runtime/ai/schemas/docu-parse.ts
```typescript
import { z } from 'genkit';
⋮----
export type WorkItem = z.infer<typeof WorkItemSchema>;
```

## File: src/app-runtime/contexts/README.MD
```markdown
# contexts

Context defines shared state shape only.
It contains types and React contexts without runtime logic.
Context must not initialize services or contain side effects.
```

## File: src/app-runtime/providers/README.MD
```markdown
# providers

Providers implement runtime behavior.
They initialize services and inject values into React Context.
Providers may depend on config, shared, and shared-infra — never features.
```

## File: src/app-runtime/README.MD
```markdown
放置運行時組合與平台啟動代碼（Providers、服務組件）。
只允許向下依賴；向上 import 為架構違規。

app-runtime is the runtime wiring layer.
It initializes providers and connects config, shared, and infrastructure.
No business logic or feature code is allowed here.
```

## File: src/app/(public)/@modal/(.)reset-password/page.tsx
```typescript
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { ResetPasswordForm } from "@/features/identity.slice"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/shadcn-ui/dialog"
function ResetPasswordModalContent()
⋮----
<Dialog open onOpenChange=
⋮----
onSuccess=
⋮----
onCancel=
⋮----
export default function ResetPasswordModalPage()
```

## File: src/app/(public)/@modal/default.tsx
```typescript
export default function AuthModalDefault()
```

## File: src/app/(public)/layout.tsx
```typescript
import type { ReactNode } from "react"
export default function AuthLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
})
```

## File: src/app/(public)/login/page.tsx
```typescript
import { LoginView } from "@/features/identity.slice"
export default function LoginPage()
```

## File: src/app/(public)/reset-password/page.tsx
```typescript
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { ResetPasswordForm } from "@/features/identity.slice"
⋮----
onCancel=
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@header/default.tsx
```typescript
import { Header } from "@/features/workspace.slice";
export default function HeaderSlot()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@modal/(.)account/new/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useI18n } from "@/config/i18n/i18n-provider"
import { AccountNewForm } from "@/features/organization.slice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/shadcn-ui/dialog"
⋮----
<Dialog open onOpenChange=
⋮----
onCancel=
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/@modal/default.tsx
```typescript
export default function DashboardModalDefault()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/audit/page.tsx
```typescript
import { AccountAuditView } from '@/features/workspace.slice';
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/daily/page.tsx
```typescript
import { AccountDailyView } from '@/features/workspace.slice';
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/matrix/page.tsx
```typescript
import { PermissionMatrixView } from "@/features/account.slice"
export default function PermissionMatrixPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/members/page.tsx
```typescript
import { MembersView } from "@/features/organization.slice"
export default function AccountMembersPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/new/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useI18n } from "@/config/i18n/i18n-provider"
import { AccountNewForm } from "@/features/organization.slice"
⋮----
onSuccess=
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/partners/[id]/page.tsx
```typescript
import { PartnerDetailView } from "@/features/organization.slice"
export default function PartnerTeamDetailPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/partners/page.tsx
```typescript
import { PartnersView } from "@/features/organization.slice"
export default function PartnersPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/schedule/page.tsx
```typescript
import { AccountScheduleSection } from "@/features/scheduling.slice";
export default function AccountSchedulePage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/skills/page.tsx
```typescript
import { PersonalSkillPanel } from '@/features/skill-xp.slice';
export default function AccountSkillsPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/teams/[id]/page.tsx
```typescript
import { TeamDetailView } from "@/features/organization.slice"
export default function AccountTeamDetailPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/teams/page.tsx
```typescript
import { TeamsView } from "@/features/organization.slice"
export default function AccountTeamsPage()
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/layout.tsx
```typescript
import type { ReactNode } from "react";
import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shared/shadcn-ui/sidebar";
type DashboardLayoutProps = {
  children: ReactNode;
  header: ReactNode;
  modal: ReactNode;
};
export default function DashboardLayout(
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/page.tsx
```typescript
import { DashboardView } from "@/features/workspace.slice"
export default function DashboardPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/acceptance/page.tsx
```typescript
import { WorkspaceAcceptance } from "@/features/workspace.slice"
export default function AcceptanceCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/audit/loading.tsx
```typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
export default function Loading()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/audit/page.tsx
```typescript
import { WorkspaceAudit } from "@/features/workspace.slice"
export default function AuditCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/capabilities/page.tsx
```typescript
import { WorkspaceCapabilities } from "@/features/workspace.slice"
export default function CapabilitiesPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/daily/loading.tsx
```typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
export default function Loading()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/daily/page.tsx
```typescript
import { WorkspaceDaily } from "@/features/workspace.slice"
export default function DailyCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/default.tsx
```typescript
export default function DefaultBusinessTab()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/document-parser/page.tsx
```typescript
import { WorkspaceDocumentParser } from "@/features/workspace.slice"
export default function DocumentParserCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/error.tsx
```typescript
import { AlertCircle } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/shared/shadcn-ui/button"
export default function BusinessTabError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
})
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/files/page.tsx
```typescript
import { WorkspaceFiles } from "@/features/workspace.slice"
export default function FilesCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/finance/page.tsx
```typescript
import { WorkspaceFinance } from "@/features/workspace.slice"
export default function FinanceCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/issues/page.tsx
```typescript
import { WorkspaceIssues } from "@/features/workspace.slice"
export default function IssuesCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/loading.tsx
```typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
export default function Loading()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/members/page.tsx
```typescript
import { WorkspaceMembers } from "@/features/workspace.slice"
export default function MembersCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/quality-assurance/page.tsx
```typescript
import { WorkspaceQualityAssurance } from "@/features/workspace.slice"
export default function QualityAssuranceCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/schedule/loading.tsx
```typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
export default function Loading()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/schedule/page.tsx
```typescript
import { WorkspaceSchedule } from "@/features/scheduling.slice"
export default function ScheduleCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/tasks/loading.tsx
```typescript
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
export default function Loading()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@businesstab/tasks/page.tsx
```typescript
import { WorkspaceTasks } from "@/features/workspace.slice"
export default function TasksCapabilityPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)daily-log/[logId]/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { use } from "react"
import { DailyLogDialog } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
interface PageProps {
  params: Promise<{ id: string; logId: string }>
}
export default function DailyLogModalPage(
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)schedule-proposal/page.tsx
```typescript
import { ScheduleProposalContent } from "@/features/scheduling.slice"
export default function ScheduleProposalModalPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/default.tsx
```typescript
export default function DefaultModal()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@panel/(.)governance/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { GovernanceSidebar , useScheduleActions } from "@/features/scheduling.slice"
import { useWorkspace } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/shadcn-ui/sheet"
import type { ScheduleItem } from "@/shared/types"
export default function GovernancePanelPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@panel/default.tsx
```typescript
export default function DefaultPanel()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/daily-log/[logId]/page.tsx
```typescript
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { DailyLogDialog } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
import { Button } from "@/shared/shadcn-ui/button"
interface PageProps {
  params: Promise<{ id: string; logId: string }>
}
export default function DailyLogPage(
⋮----
onClick={() => router.push(`/workspaces/${workspaceId}/daily`)}
      >
        <ArrowLeft className="size-3.5" /> Back to Daily
      </Button>
      <DailyLogDialog
        log={log}
        currentUser={currentUser}
        isOpen={true}
onOpenChange=
⋮----
onOpenChange=
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/governance/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { GovernanceSidebar , useScheduleActions } from "@/features/scheduling.slice"
import { useWorkspace } from "@/features/workspace.slice"
import { useAccount } from "@/features/workspace.slice"
import type { ScheduleItem } from "@/shared/types"
export default function GovernancePage()
⋮----
onClick=
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/layout.tsx
```typescript
import { ArrowLeft, Settings, Trash2, ChevronRight, MapPin } from "lucide-react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useMemo, useRef, useState, use } from "react";
import { WorkspaceProvider, useWorkspace , useWorkspaceEventHandler , WorkspaceStatusBar , WorkspaceNavTabs , useWorkspaceCommands, useApp } from "@/features/workspace.slice"
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { PageHeader } from "@/shared/ui/page-header";
⋮----
const onDeleteWorkspace = async () =>
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/locations/page.tsx
```typescript
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/features/workspace.slice';
import { WorkspaceLocationsPanel } from '@/features/workspace.slice';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/shadcn-ui/button';
export default function WorkspaceLocationsPage()
⋮----
onClick=
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/page.tsx
```typescript
import { redirect } from "next/navigation"
export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
})
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/schedule-proposal/page.tsx
```typescript
import { ScheduleProposalContent } from "@/features/scheduling.slice"
export default function ScheduleProposalPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@header/default.tsx
```typescript
import { Header } from "@/features/workspace.slice";
export default function HeaderSlot()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@modal/(.)new/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { CreateWorkspaceDialog } from "@/features/workspace.slice"
export default function NewWorkspaceModalPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/@modal/default.tsx
```typescript
export default function DefaultModal()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/layout.tsx
```typescript
import type { ReactNode } from "react";
import { ThemeAdapter } from "@/features/workspace.slice";
import { SidebarInset } from "@/shared/shadcn-ui/sidebar";
type WorkspacesLayoutProps = {
  children: ReactNode;
  header: ReactNode;
  modal: ReactNode;
};
export default function WorkspacesLayout(
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/new/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { CreateWorkspaceDialog } from "@/features/workspace.slice"
export default function NewWorkspacePage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/page.tsx
```typescript
import { WorkspacesView } from "@/features/workspace.slice";
export default function WorkspacesPage()
```

## File: src/app/(shell)/(account)/layout.tsx
```typescript
import type { ReactNode } from "react";
export default function AccountLayout(
```

## File: src/app/(shell)/@modal/default.tsx
```typescript
export default function ShellModalDefault()
```

## File: src/app/(shell)/@sidebar/default.tsx
```typescript
import { DashboardSidebar } from "@/features/workspace.slice";
export default function SidebarSlot()
```

## File: src/app/(shell)/layout.tsx
```typescript
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, type ReactNode } from "react";
import { useTokenRefreshListener } from "@/features/identity.slice";
import { AccountProvider } from "@/features/workspace.slice";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { SidebarProvider } from "@/shared/shadcn-ui/sidebar";
type ShellLayoutProps = {
  children: ReactNode;
  sidebar: ReactNode;
  modal: ReactNode;
};
export default function ShellLayout(
```

## File: src/app/(shell)/page.tsx
```typescript
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Button } from "@/shared/shadcn-ui/button";
```

## File: src/app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
⋮----
:root {
.dark {
⋮----
* {
⋮----
@apply border-border;
⋮----
body {
⋮----
.content-visibility-auto {
.gpu-accelerated {
.glass-card {
.dimension-glow {
```

## File: src/app/README.MD
```markdown
放置框架入口：路由、layouts 與全域配置。
只允許向下依賴；向上 import 為架構違規。
```

## File: src/config/i18n/i18n-provider.tsx
```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getPreferredLocale, setLocalePreference, loadMessages, i18nConfig } from '@/config/i18n/i18n';
import { type Locale, type TranslationMessages } from '@/config/i18n/i18n-types';
interface I18nContextValue {
  locale: Locale;
  messages: TranslationMessages | null;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}
⋮----
export function I18nProvider(
⋮----
async function load()
⋮----
const setLocale = (newLocale: Locale) =>
const t = (key: string, params?: Record<string, string | number>): string =>
⋮----
export function useI18n()
```

## File: src/config/i18n/i18n-types.ts
```typescript
import type { TranslationMessages } from './i18n.schema';
export type Locale = 'en' | 'zh-TW';
export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
}
```

## File: src/config/i18n/i18n.schema.ts
```typescript
export interface TranslationMessages {
  common: {
    appName: string;
    appTitle: string;
    appDescription: string;
    greeting: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    creating: string;
    unknownError: string;
    enterOrgVerse: string;
    visible: string;
    hidden: string;
    filter: string;
    confirmCreation: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    disconnect: string;
    email: string;
    password: string;
    displayName: string;
    nickname: string;
    forgotPassword: string;
    resetPassword: string;
    sendEmail: string;
    enterDimension: string;
    registerSovereignty: string;
    guestAccess: string;
    contactEndpoint: string;
    securityKey: string;
    setSecurityKey: string;
    digitalDesignation: string;
    identityResonanceSuccessful: string;
    authenticationFailed: string;
    resetProtocolSent: string;
    resetFailed: string;
    pleaseSetDisplayName: string;
    dimensionSecurityProtocol: string;
    byLoggingIn: string;
  };
  sidebar: {
    switchAccountContext: string;
    selectAccount: string;
    createNewDimension: string;
    dimensionCore: string;
    accountGovernance: string;
    quickAccess: string;
    userSettings: string;
    owner: string;
    guest: string;
  };
  navigation: {
    dashboard: string;
    settings: string;
    profile: string;
    account: string;
    workspaces: string;
    teams: string;
    internalTeams: string;
    partnerTeams: string;
    partners: string;
    members: string;
    permissions: string;
    matrix: string;
    schedule: string;
    orgSchedule: string;
    demandBoard: string;
    daily: string;
    audit: string;
  };
  dimension: {
    createTitle: string;
    createDescription: string;
    dimensionName: string;
    dimensionNamePlaceholder: string;
    createDimension: string;
    newDimensionCreated: string;
    failedToCreate: string;
  };
  workspaces: {
    title: string;
    description: string;
    createSpace: string;
    createLogicalSpace: string;
    createDescription: string;
    spaceName: string;
    spaceNamePlaceholder: string;
    searchPlaceholder: string;
    accessProtocol: string;
    defaultProtocol: string;
    lifecycleState: string;
    spaceVoid: string;
    noSpacesFound: string;
    createInitialSpace: string;
    creationFailed: string;
    accountNotFound: string;
    logicalSpaceCreated: string;
    spaceSynchronized: string;
    failedToCreateSpace: string;
    standard: string;
  };
  workspace: {
    capabilities: string;
    tasks: string;
    acceptance: string;
    finance: string;
    issues: string;
    files: string;
    'quality-assurance': string;
    documentParser: string;
  };
  account: {
    governanceNotAvailable: string;
    governanceNotAvailableDescription: string;
    membersTitle: string;
    membersDescription: string;
    recruitNewMember: string;
    identityResonanceActivated: string;
    identityResonanceDescription: string;
    failedToRecruitMember: string;
    identityDeregistered: string;
    memberRemoved: string;
    failedToDismissMember: string;
    contact: string;
    teamsTitle: string;
    teamsDescription: string;
    createInternalTeam: string;
    internalTeamCreated: string;
    failedToCreateTeam: string;
    manageMembers: string;
    createNewTeam: string;
    teamName: string;
    teamNamePlaceholder: string;
    members: string;
    partnersTitle: string;
    partnersDescription: string;
    createPartnerTeam: string;
    partnerTeamCreated: string;
    resonatingPartners: string;
    manageAndRecruit: string;
    createCollaborationBoundary: string;
    createPartnerTeamTitle: string;
    createPartnerTeamDescription: string;
    partnerTeamNamePlaceholder: string;
    matrixTitle: string;
    matrixDescription: string;
    scheduleTitle: string;
    scheduleDescription: string;
    dailyTitle: string;
    dailyDescription: string;
    auditTitle: string;
    auditDescription: string;
  };
  tasks: {
    title: string;
    description: string;
    addRootTask: string;
    addSubtask: string;
    progressReport: string;
    submitProgress: string;
    currentProgress: string;
    submittingQuantity: string;
    reportProgressTitle: string;
    invalidQuantity: string;
    quantityExceedsTotal: string;
    progressUpdated: string;
    failedToUpdateProgress: string;
    taskName: string;
    taskNamePlaceholder: string;
    quantity: string;
    budget: string;
    assignee: string;
    status: string;
    priority: string;
    toDo: string;
    inProgress: string;
    completed: string;
    low: string;
    medium: string;
    high: string;
    delete: string;
    taskCreated: string;
    failedToCreateTask: string;
    taskUpdated: string;
    failedToUpdateTask: string;
    taskDeleted: string;
    failedToDeleteTask: string;
    uploadImages: string;
    newImage: string;
    fileTooLarge: string;
    taskDetails: string;
    attachments: string;
    importTasks: string;
  };
  toast: {
    qaApproved: string;
    taskAccepted: string;
    qaRejectedIssueLogged: string;
    acceptanceFailedIssueLogged: string;
    importingItems: string;
    pleaseWait: string;
    importSuccessful: string;
    itemsAdded: string;
    importFailed: string;
    foundItems: string;
    issueSubmitted: string;
    failedToAddIssue: string;
    commentPosted: string;
    failedToPostComment: string;
    taskAcceptedDescription: string;
    acceptanceFailed: string;
    acceptanceFailedDescription: string;
    failedToUpdateTask: string;
    qaPassed: string;
    qaPassedDescription: string;
    failedToApproveQA: string;
    taskRejected: string;
    taskRejectedDescription: string;
    failedToRejectQA: string;
    invalidQuantity: string;
    quantityExceedsTotal: string;
    budgetOverflow: string;
    budgetOverflowDescription: string;
    budgetConflict: string;
  };
}
```

## File: src/config/i18n/i18n.ts
```typescript
import { type Locale, type I18nConfig } from "@/config/i18n/i18n-types"
⋮----
export function getPreferredLocale(): Locale
export function setLocalePreference(locale: Locale): void
export async function loadMessages(locale: Locale)
```

## File: src/config/README.MD
```markdown
放置專案配置與說明：環境變數範例與設定檔參考。
只允許向下依賴；向上 import 為架構違規。
```

## File: src/features/account.slice/gov.policy/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { getDocument, Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
async function emitPolicyChangedRefreshSignal(accountId: string, traceId?: string): Promise<void>
export interface AccountPolicy {
  id: string;
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  traceId?: string;
}
export interface PolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
}
export interface CreatePolicyInput {
  accountId: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  traceId?: string;
}
export interface UpdatePolicyInput {
  accountId?: string;
  name?: string;
  description?: string;
  rules?: PolicyRule[];
  isActive?: boolean;
  traceId?: string;
}
export async function createAccountPolicy(input: CreatePolicyInput): Promise<CommandResult>
export async function updateAccountPolicy(
  policyId: string,
  input: UpdatePolicyInput
): Promise<CommandResult>
export async function deleteAccountPolicy(policyId: string, traceId?: string): Promise<CommandResult>
```

## File: src/features/account.slice/gov.policy/_hooks/use-account-policy.ts
```typescript
import { useState, useEffect } from 'react';
import type { AccountPolicy } from '../_actions';
import { subscribeToAccountPolicies } from '../_queries';
export function useAccountPolicy(accountId: string | null)
```

## File: src/features/account.slice/gov.policy/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountPolicy } from './_actions';
export async function getAccountPolicy(policyId: string): Promise<AccountPolicy | null>
export function subscribeToAccountPolicies(
  accountId: string,
  onUpdate: (policies: AccountPolicy[]) => void
): Unsubscribe
export async function getActiveAccountPolicies(accountId: string): Promise<AccountPolicy[]>
```

## File: src/features/account.slice/gov.policy/index.ts
```typescript

```

## File: src/features/account.slice/gov.role/_actions.ts
```typescript
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { OrganizationRole } from '@/shared/types';
export interface AccountRoleRecord {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  isActive: boolean;
  traceId?: string;
}
export interface AssignRoleInput {
  accountId: string;
  orgId: string;
  role: OrganizationRole;
  grantedBy: string;
  traceId?: string;
}
export async function assignAccountRole(input: AssignRoleInput): Promise<CommandResult>
export async function revokeAccountRole(
  accountId: string,
  orgId: string,
  revokedBy: string,
  traceId?: string
): Promise<CommandResult>
export type TokenRefreshReason = 'role:assigned' | 'role:revoked' | 'claims:refreshed';
export interface TokenRefreshSignal {
  accountId: string;
  reason: TokenRefreshReason;
  issuedAt: string;
  traceId?: string;
}
async function emitTokenRefreshSignal(
  accountId: string,
  reason: TokenRefreshReason,
  traceId?: string
): Promise<void>
```

## File: src/features/account.slice/gov.role/_components/permission-matrix-view.tsx
```typescript
import { ShieldCheck, ShieldAlert, Users, AlertCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useAccount } from "@/features/workspace.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/shadcn-ui/table"
⋮----
const hasAccess = (teamId: string, workspaceId: string) =>
```

## File: src/features/account.slice/gov.role/_components/permission-tree.tsx
```typescript
import { Shield } from "lucide-react";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Card, CardContent } from "@/shared/shadcn-ui/card";
import { type OrganizationRole } from "@/shared/types";
interface PermissionTreeProps {
  currentRole: OrganizationRole;
  t: (key: string) => string;
}
function PermissionTier(
⋮----
name=
```

## File: src/features/account.slice/gov.role/_hooks/use-account-role.ts
```typescript
import { useState, useEffect } from 'react';
import type { AccountRoleRecord } from '../_actions';
import { subscribeToAccountRoles } from '../_queries';
export function useAccountRole(accountId: string | null)
```

## File: src/features/account.slice/gov.role/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountRoleRecord } from './_actions';
export async function getAccountRole(
  accountId: string,
  orgId: string
): Promise<AccountRoleRecord | null>
export function subscribeToAccountRoles(
  accountId: string,
  onUpdate: (roles: AccountRoleRecord[]) => void
): Unsubscribe
```

## File: src/features/account.slice/gov.role/index.ts
```typescript

```

## File: src/features/account.slice/user.profile/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createUserAccount as createUserAccountFacade,
  updateUserProfile as updateUserProfileFacade,
} from "@/shared/infra/firestore/firestore.facade";
import { uploadProfilePicture as uploadProfilePictureFacade } from "@/shared/infra/storage/storage.facade";
import type { Account } from "@/shared/types";
export async function createUserAccount(
  userId: string,
  name: string,
  email: string
): Promise<CommandResult>
export async function updateUserProfile(
  userId: string,
  data: Partial<Account>
): Promise<CommandResult>
export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<string>
```

## File: src/features/account.slice/user.profile/_components/preferences-card.tsx
```typescript
import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Label } from "@/shared/shadcn-ui/label";
import { Separator } from "@/shared/shadcn-ui/separator";
import { Switch } from "@/shared/shadcn-ui/switch";
export function PreferencesCard()
```

## File: src/features/account.slice/user.profile/_components/profile-card.tsx
```typescript
import { User, Loader2, Upload } from "lucide-react";
import type React from "react"
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Checkbox } from "@/shared/shadcn-ui/checkbox";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type SkillGrant, type Account } from "@/shared/types"
interface ProfileCardProps {
  account: Account | null
  name: string
  setName: (name: string) => void
  bio: string
  setBio: (bio: string) => void
  skillGrants: SkillGrant[]
  onSkillToggle: (slug: string) => void
  handleSaveProfile: () => void
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isSaving: boolean
  isUploading: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
}
⋮----
<Button onClick=
```

## File: src/features/account.slice/user.profile/_components/security-card.tsx
```typescript
import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
interface SecurityCardProps {
  onWithdraw: () => void;
  t: (key: string) => string;
}
```

## File: src/features/account.slice/user.profile/_components/user-settings-view.tsx
```typescript
import { useI18n } from "@/config/i18n/i18n-provider"
import { PageHeader } from "@/shared/ui/page-header"
import { UserSettings } from "./user-settings"
export function UserSettingsView()
⋮----
title=
```

## File: src/features/account.slice/user.profile/_hooks/use-user.ts
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/shared/app-providers/auth-provider'
import type { Account } from '@/shared/types'
import {
  updateUserProfile as updateUserProfileAction,
  uploadUserAvatar,
} from '../_actions'
import {
  getUserProfile as getUserProfileQuery,
  subscribeToUserProfile,
} from '../_queries'
export function useUser()
```

## File: src/features/account.slice/user.profile/_queries.ts
```typescript
import {
  getUserProfile as getUserProfileFacade,
} from "@/shared/infra/firestore/firestore.facade"
import { subscribeToDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account } from "@/shared/types"
export async function getUserProfile(userId: string): Promise<Account | null>
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: Account | null) => void,
): () => void
```

## File: src/features/account.slice/user.wallet/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, doc } from '@/shared/infra/firestore/firestore.read.adapter';
import { runTransaction, serverTimestamp, type Transaction } from '@/shared/infra/firestore/firestore.write.adapter';
export interface WalletTransaction {
  id?: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  referenceId?: string;
  occurredAt: ReturnType<typeof serverTimestamp>;
}
export interface TopUpInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  traceId?: string;
}
export interface DebitInput {
  accountId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  traceId?: string;
}
export async function creditWallet(input: TopUpInput): Promise<CommandResult>
export async function debitWallet(input: DebitInput): Promise<CommandResult>
```

## File: src/features/account.slice/user.wallet/_hooks/use-wallet.ts
```typescript
import { useState, useEffect } from 'react';
import type { Wallet } from '@/shared/types';
import { subscribeToWalletBalance, subscribeToWalletTransactions } from '../_queries';
import type { WalletTransactionRecord } from '../_queries';
export function useWallet(accountId: string | null)
⋮----
const checkReady = () =>
```

## File: src/features/account.slice/user.wallet/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, collection, query, orderBy, limit, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, Wallet } from '@/shared/types';
export async function getWalletBalance(accountId: string): Promise<number>
export function subscribeToWalletBalance(
  accountId: string,
  onUpdate: (wallet: Wallet) => void
): Unsubscribe
export interface WalletTransactionRecord {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  referenceId?: string | null;
  occurredAt: { toMillis: () => number } | null;
}
export function subscribeToWalletTransactions(
  accountId: string,
  maxCount: number,
  onUpdate: (txs: WalletTransactionRecord[]) => void
): Unsubscribe
```

## File: src/features/account.slice/user.wallet/index.ts
```typescript

```

## File: src/features/global-search.slice/_actions.ts
```typescript
import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import { executeSearch as executeSearchService } from './_services';
import type { ExecuteSearchInput, SearchResponse } from './_types';
export interface ExecuteGlobalSearchResult {
  readonly commandResult: CommandResult;
  readonly response: SearchResponse | null;
}
export async function executeGlobalSearch(
  input: ExecuteSearchInput
): Promise<ExecuteGlobalSearchResult>
export async function executeSearch(
  input: ExecuteSearchInput
): Promise<CommandResult>
```

## File: src/features/global-search.slice/_components/global-search-dialog.tsx
```typescript
import { Globe, Layers, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/shared/shadcn-ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import { type Account, type Workspace, type MemberReference } from "@/shared/types";
export interface GlobalSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizations: Account[];
  workspaces: Workspace[];
  members: MemberReference[];
  activeOrganizationId: string | null;
  onSwitchOrganization: (organization: Account) => void;
}
⋮----
const handleSelect = (callback: () => void) =>
```

## File: src/features/global-search.slice/_services.ts
```typescript
import { querySemanticIndex } from '@/features/semantic-graph.slice';
import type {
  ExecuteSearchInput,
  SearchResponse,
  GroupedSearchResult,
  SearchDomain,
} from './_types';
export function executeSearch(
  input: ExecuteSearchInput
): SearchResponse
```

## File: src/features/global-search.slice/_types.ts
```typescript
import type {
  SearchDomain,
  SemanticSearchQuery,
  SemanticSearchHit,
  SemanticSearchResult,
} from '@/features/shared-kernel';
export interface DateRangeFilter {
  readonly from?: string;
  readonly to?: string;
}
export interface SearchFilters {
  readonly domains?: readonly SearchDomain[];
  readonly tagSlugs?: readonly string[];
  readonly dateRange?: DateRangeFilter;
  readonly orgId?: string;
  readonly workspaceId?: string;
  readonly createdBy?: string;
}
export interface SearchState {
  readonly query: string;
  readonly filters: SearchFilters;
  readonly results: SemanticSearchResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly recentQueries: readonly string[];
}
⋮----
export interface ExecuteSearchInput {
  readonly query: string;
  readonly filters?: SearchFilters;
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
export interface GroupedSearchResult {
  readonly domain: SearchDomain;
  readonly hits: readonly SemanticSearchHit[];
  readonly count: number;
}
export interface SearchResponse {
  readonly query: string;
  readonly groups: readonly GroupedSearchResult[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly executedAt: string;
  readonly traceId?: string;
}
```

## File: src/features/global-search.slice/index.ts
```typescript

```

## File: src/features/identity.slice/_actions.ts
```typescript
import { createUserAccount } from '@/features/account.slice'
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel'
import { authAdapter } from "@/shared/infra/auth/auth.adapter"
export async function signIn(email: string, password: string): Promise<CommandResult>
async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<string>
export async function signInAnonymously(): Promise<CommandResult>
export async function sendPasswordResetEmail(email: string): Promise<CommandResult>
export async function signOut(): Promise<CommandResult>
export async function completeRegistration(
  email: string,
  password: string,
  name: string
): Promise<CommandResult>
```

## File: src/features/identity.slice/_claims-handler.ts
```typescript
import { logDomainError } from '@/features/observability';
import type { EventEnvelope } from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
async function emitRefreshSignal(accountId: string, traceId: string): Promise<void>
async function handleClaimsRefreshTrigger(envelope: EventEnvelope): Promise<void>
type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
export type ClaimsSubscriberRegistrar = (
  eventType: string,
  handler: (envelope: EventEnvelope) => Promise<void>,
  lane: IerLane
) => () => void;
export function registerClaimsHandler(registerFn: ClaimsSubscriberRegistrar): () => void
```

## File: src/features/identity.slice/_components/auth-background.tsx
```typescript
export function AuthBackground()
```

## File: src/features/identity.slice/_components/auth-tabs-root.tsx
```typescript
import { Ghost, Loader2 } from "lucide-react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/shadcn-ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
interface AuthTabsRootProps {
  isLoading: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  handleAuth: (type: 'login' | 'register') => void;
  handleAnonymous: () => void;
  openResetDialog: () => void;
}
⋮----
handleRegister=
```

## File: src/features/identity.slice/_components/login-form.tsx
```typescript
import { Mail, Lock, Loader2 } from "lucide-react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleLogin: () => void;
  isLoading: boolean;
  onForgotPassword: () => void;
}
⋮----
<form className="flex flex-1 flex-col space-y-4" onSubmit=
```

## File: src/features/identity.slice/_components/register-form.tsx
```typescript
import { Mail, User, Lock, Loader2 } from "lucide-react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleRegister: () => void;
  isLoading: boolean;
}
⋮----
<form className="flex flex-1 flex-col space-y-4" onSubmit=
⋮----
<InputGroupInput id="r-name" autoComplete="name" value=
```

## File: src/features/identity.slice/_components/reset-password-dialog.tsx
```typescript
import { Mail } from "lucide-react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/shadcn-ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  handleSendResetEmail: () => void;
}
```

## File: src/features/identity.slice/_token-refresh-listener.ts
```typescript
import { useEffect } from 'react';
import type { ImplementsTokenRefreshContract } from '@/features/shared-kernel';
import { auth } from '@/shared/infra/auth/auth.client';
import { db } from '@/shared/infra/firestore/firestore.client';
import { onSnapshot, doc } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
export function useTokenRefreshListener(accountId: string | null | undefined): void
```

## File: src/features/identity.slice/index.ts
```typescript

```

## File: src/features/infra.dlq-manager/_dlq.ts
```typescript
export type DlqLevel = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
export interface DlqEntry {
  readonly dlqId: string;
  readonly dlqLevel: DlqLevel;
  readonly sourceLane: string;
  readonly originalEnvelopeJson: string;
  readonly firstFailedAt: string;
  readonly attemptCount: number;
  readonly lastError: string;
}
⋮----
export function getDlqLevel(eventType: string): DlqLevel
```

## File: src/features/infra.dlq-manager/index.ts
```typescript

```

## File: src/features/infra.event-router/_router.ts
```typescript
import type { EventEnvelope } from '@/features/shared-kernel';
export type IerLane = 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
type EventHandler = (envelope: EventEnvelope) => Promise<void>;
interface Subscriber {
  readonly eventType: string | '*';
  readonly lane: IerLane | '*';
  readonly handler: EventHandler;
}
⋮----
export function registerSubscriber(
  eventType: string | '*',
  handler: EventHandler,
  lane: IerLane | '*' = '*'
): () => void
export async function routeEvent(envelope: EventEnvelope, lane: IerLane): Promise<void>
export async function publishToLane(
  lane: IerLane,
  envelope: unknown
): Promise<void>
```

## File: src/features/infra.event-router/index.ts
```typescript

```

## File: src/features/infra.external-triggers/_guard.ts
```typescript
import type {
  RateLimitConfig,
  CircuitBreakerConfig,
  BulkheadConfig,
  ResilienceContract,
} from '@/features/shared-kernel';
import {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
} from '@/features/shared-kernel';
export interface GuardCheckResult {
  readonly allowed: boolean;
  readonly retryAfterMs?: number;
  readonly reason?: 'RATE_LIMITED' | 'CIRCUIT_OPEN' | 'BULKHEAD_FULL';
  release?: (succeeded: boolean) => void;
}
export interface CallerContext {
  readonly uid: string;
  readonly orgId?: string;
}
interface WindowEntry {
  count: number;
  resetAt: number;
}
function checkWindow(
  store: Map<string, WindowEntry>,
  key: string,
  limit: number,
  windowMs: number
): boolean
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitStatus {
  state: CircuitState;
  failures: number;
  openedAt: number;
}
function evaluateCircuit(
  status: CircuitStatus,
  cfg: CircuitBreakerConfig
): boolean
export interface ResilienceGuard {
  check(caller: CallerContext): GuardCheckResult;
  withGuard<T>(caller: CallerContext, handler: () => Promise<T>): Promise<T | GuardCheckResult>;
  readonly contract: ResilienceContract;
}
⋮----
check(caller: CallerContext): GuardCheckResult;
withGuard<T>(caller: CallerContext, handler: ()
⋮----
export function createExternalTriggerGuard(
  sliceId: string,
  rateCfg: RateLimitConfig = DEFAULT_RATE_LIMIT,
  cbCfg: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
  bulkheadCfg?: Partial<BulkheadConfig>
): ResilienceGuard
⋮----
check(caller: CallerContext): GuardCheckResult
⋮----
const release = (succeeded: boolean): void =>
⋮----
async withGuard<T>(
      caller: CallerContext,
      handler: () => Promise<T>
): Promise<T | GuardCheckResult>
```

## File: src/features/infra.external-triggers/index.ts
```typescript

```

## File: src/features/infra.gateway-command/_gateway.ts
```typescript
import type { AuthoritySnapshot, CommandResult } from '@/features/shared-kernel';
import { commandFailureFrom } from '@/features/shared-kernel';
export interface GatewayCommand {
  readonly commandType: string;
  readonly aggregateId: string;
}
type CommandHandler<TCmd extends GatewayCommand = GatewayCommand> = (
  command: TCmd,
  traceId: string
) => Promise<CommandResult>;
⋮----
export function registerCommandHandler<TCmd extends GatewayCommand>(
  commandType: string,
  handler: CommandHandler<TCmd>
): void
export interface DispatchOptions {
  readonly traceId?: string;
  readonly authority?: AuthoritySnapshot | null;
}
function injectTraceId(opts?: DispatchOptions): string
function checkAuthority(
  command: GatewayCommand,
  authority: AuthoritySnapshot | null | undefined
): CommandResult | null
async function routeCommand(
  command: GatewayCommand,
  traceId: string
): Promise<CommandResult>
export async function dispatchCommand<TCmd extends GatewayCommand>(
  command: TCmd,
  opts?: DispatchOptions
): Promise<CommandResult>
```

## File: src/features/infra.gateway-command/index.ts
```typescript

```

## File: src/features/infra.gateway-query/_registry.ts
```typescript
type QueryHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;
interface RegistryEntry<TParams = unknown, TResult = unknown> {
  readonly handler: QueryHandler<TParams, TResult>;
  readonly description?: string;
}
⋮----
export function registerQuery<TParams, TResult>(
  name: string,
  handler: QueryHandler<TParams, TResult>,
  description?: string
): () => void
export async function executeQuery<TParams, TResult>(
  name: string,
  params: TParams
): Promise<TResult>
export function listRegisteredQueries(): ReadonlyArray<
⋮----
export type QueryRouteName = (typeof QUERY_ROUTES)[keyof typeof QUERY_ROUTES];
```

## File: src/features/infra.gateway-query/index.ts
```typescript

```

## File: src/features/infra.outbox-relay/_relay.ts
```typescript
import { getDlqLevel, type DlqEntry } from '@/features/infra.dlq-manager';
import { logDomainError } from '@/features/observability';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type DocumentChange,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { updateDoc, setDoc, type serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
export type OutboxStatus = 'pending' | 'delivered' | 'dlq';
export interface OutboxDocument {
  readonly outboxId: string;
  readonly eventType: string;
  readonly envelopeJson: string;
  readonly lane: 'CRITICAL_LANE' | 'STANDARD_LANE' | 'BACKGROUND_LANE';
  status: OutboxStatus;
  readonly createdAt: ReturnType<typeof serverTimestamp>;
  attemptCount: number;
  lastAttemptAt?: string;
  lastError?: string;
}
⋮----
export type IerDeliveryFn = (
  lane: OutboxDocument['lane'],
  envelope: unknown
) => Promise<void>;
export function startOutboxRelay(
  outboxCollectionPath: string,
  deliver: IerDeliveryFn
): Unsubscribe
async function relayEntry(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  deliver: IerDeliveryFn
): Promise<void>
async function routeToDlq(
  collectionPath: string,
  docId: string,
  data: OutboxDocument,
  attemptCount: number,
  lastError: string
): Promise<void>
```

## File: src/features/infra.outbox-relay/index.ts
```typescript

```

## File: src/features/notification-hub.slice/_actions.ts
```typescript
import type { CommandResult } from '@/features/shared-kernel';
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import {
  processNotificationEvent,
  registerRoutingRule as registerRoutingRuleService,
  unregisterRoutingRule as unregisterRoutingRuleService,
} from './_services';
import type {
  NotificationSourceEvent,
  TagRoutingRule,
  NotificationDispatchResult,
} from './_types';
export interface DispatchNotificationResult {
  readonly commandResult: CommandResult;
  readonly dispatch: NotificationDispatchResult | null;
}
export async function dispatchNotification(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult>
export async function registerRoutingRule(
  rule: TagRoutingRule
): Promise<CommandResult>
export async function unregisterRoutingRule(
  ruleId: string
): Promise<CommandResult>
export async function triggerDispatch(
  event: NotificationSourceEvent
): Promise<DispatchNotificationResult>
```

## File: src/features/notification-hub.slice/_services.ts
```typescript
import type { NotificationPriority } from '@/features/shared-kernel';
import type {
  TagRoutingRule,
  TagRoutingDecision,
  NotificationSourceEvent,
  NotificationDispatch,
  NotificationDispatchResult,
  NotificationHubStats,
  NotificationSubscription,
} from './_types';
⋮----
// =================================================================
// Routing Rule Management
// =================================================================
export function registerRoutingRule(rule: TagRoutingRule): void
export function unregisterRoutingRule(ruleId: string): void
export function getRoutingRules(): readonly TagRoutingRule[]
// =================================================================
// Event Subscription Management
// =================================================================
export function registerSubscription(sub: NotificationSubscription): void
export function unregisterSubscription(eventKey: string): void
export function getSubscriptions(): readonly NotificationSubscription[]
// =================================================================
// Tag-Aware Routing Engine (Stateless per #A10)
// =================================================================
⋮----
export function evaluateTagRouting(
  eventTags: readonly string[]
): TagRoutingDecision
export async function processNotificationEvent(
  event: NotificationSourceEvent
): Promise<NotificationDispatchResult>
⋮----
export type ProjectionBusListener = (event: NotificationSourceEvent) => void;
⋮----
export function subscribeToProjectionBus(
  eventKey: string,
  listener: ProjectionBusListener
): () => void
export function emitProjectionBusEvent(event: NotificationSourceEvent): void
export function initTagChangedSubscriber(): () => void
export function getHubStats(): NotificationHubStats
⋮----
function generateDispatchId(): string
```

## File: src/features/notification-hub.slice/_types.ts
```typescript
import type {
  NotificationChannel,
  NotificationPriority,
} from '@/features/shared-kernel/semantic-primitives';
export interface TagRoutingRule {
  readonly ruleId: string;
  readonly name: string;
  readonly tagSlugs: readonly string[];
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  readonly templateId?: string;
  readonly enabled: boolean;
}
export interface TagRoutingDecision {
  readonly matchedRules: readonly TagRoutingRule[];
  readonly channels: readonly NotificationChannel[];
  readonly highestPriority: NotificationPriority;
}
export interface NotificationSourceEvent {
  readonly eventKey: string;
  readonly payload: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly orgId: string;
  readonly workspaceId?: string;
  readonly targetAccountIds?: readonly string[];
  readonly traceId?: string;
  readonly occurredAt: string;
}
export interface NotificationDispatch {
  readonly sourceEventKey: string;
  readonly channel: NotificationChannel;
  readonly priority: NotificationPriority;
  readonly targetAccountIds: readonly string[];
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly traceId?: string;
  readonly dispatchedAt: string;
}
export interface NotificationDispatchResult {
  readonly dispatchId: string;
  readonly channel: NotificationChannel;
  readonly targetCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors: readonly NotificationDispatchError[];
}
export interface NotificationDispatchError {
  readonly accountId: string;
  readonly channel: NotificationChannel;
  readonly reason: string;
}
export interface NotificationSubscription {
  readonly eventKey: string;
  readonly description: string;
  readonly useTagRouting: boolean;
  readonly enabled: boolean;
}
export interface NotificationHubStats {
  readonly totalDispatched: number;
  readonly dispatchedByChannel: Record<NotificationChannel, number>;
  readonly totalErrors: number;
  readonly activeSubscriptions: number;
  readonly activeRoutingRules: number;
  readonly lastDispatchedAt: string;
}
```

## File: src/features/notification-hub.slice/gov.notification-router/_router.ts
```typescript
import { onOrgEvent } from '@/features/organization.slice';
import { deliverNotification } from '../user.notification';
export interface RouterRegistration {
  unsubscribe: () => void;
}
export function registerNotificationRouter(): RouterRegistration
```

## File: src/features/notification-hub.slice/gov.notification-router/index.ts
```typescript

```

## File: src/features/notification-hub.slice/index.ts
```typescript

```

## File: src/features/notification-hub.slice/user.notification/_components/notification-badge.tsx
```typescript
import { Bell } from 'lucide-react';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
interface NotificationBadgeProps {
  unreadCount: number;
  onClick?: () => void;
}
export function NotificationBadge(
```

## File: src/features/notification-hub.slice/user.notification/_delivery.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  doc,
  getDoc,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { addDoc, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
export interface NotificationDeliveryInput {
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  sourceEvent: string;
  sourceId: string;
  workspaceId: string;
  traceId?: string;
}
export interface DeliveryResult {
  notificationId: string;
  delivered: boolean;
  fcmSent: boolean;
}
export async function deliverNotification(
  targetAccountId: string,
  input: NotificationDeliveryInput
): Promise<DeliveryResult>
⋮----
// Example FCM Admin SDK call (server-side):
//   await fcmAdmin.send({
//     token: fcmToken,
//     notification: { title: sanitizedTitle, body: sanitizedMessage },
//     data: { traceId },   // ← [R8] required field
//   });
⋮----
// FCM failure is non-fatal — notification is already persisted
⋮----
/**
 * Sanitizes notification content for external account recipients.
 * Redacts internal workspace IDs, financial amounts, and internal-only details
 * to prevent leaking sensitive workspace-internal data to external participants.
 *
 * @example
 * sanitizeForExternal('Workspace abc12345-... has $1,234.56 balance')
 *
 *
 * @param message - Raw notification message text
 * @returns Sanitized message safe for external account delivery
 */
function sanitizeForExternal(message: string): string
```

## File: src/features/notification-hub.slice/user.notification/_hooks/use-user-notifications.ts
```typescript
import { useState, useEffect } from 'react';
import type { Notification } from '@/shared/types';
import { subscribeToNotifications, markNotificationRead } from '../_queries';
export function useUserNotifications(accountId: string | undefined, maxCount = 20)
⋮----
const markRead = async (notificationId: string) =>
```

## File: src/features/notification-hub.slice/user.notification/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  type Unsubscribe,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { updateDoc } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Notification } from '@/shared/types';
export function subscribeToNotifications(
  accountId: string,
  maxCount: number,
  onUpdate: (notifications: Notification[]) => void
): Unsubscribe
export async function markNotificationRead(
  accountId: string,
  notificationId: string
): Promise<void>
```

## File: src/features/notification-hub.slice/user.notification/index.ts
```typescript

```

## File: src/features/observability/_error-log.ts
```typescript
export interface DomainErrorEntry {
  readonly occurredAt: string;
  readonly traceId: string;
  readonly source: string;
  readonly message: string;
  readonly detail?: string;
}
export function logDomainError(entry: DomainErrorEntry): void
```

## File: src/features/observability/_metrics.ts
```typescript
export function recordEventPublished(eventType: string): void
export function getEventCounters(): Readonly<Record<string, number>>
export function resetEventCounters(): void
```

## File: src/features/observability/_trace.ts
```typescript
export function generateTraceId(): string
export interface TraceContext {
  readonly traceId: string;
  readonly initiatedAt: string;
  readonly source?: string;
}
export function createTraceContext(source?: string): TraceContext
```

## File: src/features/observability/index.ts
```typescript

```

## File: src/features/organization.slice/core.event-bus/_bus.ts
```typescript
import type { ImplementsEventEnvelopeContract } from '@/features/shared-kernel';
import type { OrganizationEventPayloadMap, OrganizationEventKey } from './_events';
type OrgEventHandler<K extends OrganizationEventKey> = (
  payload: OrganizationEventPayloadMap[K]
) => void | Promise<void>;
type OrgEventHandlerMap = {
  [K in OrganizationEventKey]?: Array<OrgEventHandler<K>>;
};
⋮----
export function onOrgEvent<K extends OrganizationEventKey>(
  eventKey: K,
  handler: OrgEventHandler<K>
): () => void
export async function publishOrgEvent<K extends OrganizationEventKey>(
  eventKey: K,
  payload: OrganizationEventPayloadMap[K]
): Promise<void>
```

## File: src/features/organization.slice/core.event-bus/_events.ts
```typescript
export interface ScheduleAssignedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  title: string;
  aggregateVersion: number;
  traceId?: string;
}
export interface OrgPolicyChangedPayload {
  orgId: string;
  policyId: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedBy: string;
  traceId?: string;
}
export interface OrgMemberJoinedPayload {
  orgId: string;
  accountId: string;
  role: string;
  joinedBy: string;
  traceId?: string;
}
export interface OrgMemberLeftPayload {
  orgId: string;
  accountId: string;
  removedBy: string;
}
export interface OrgTeamUpdatedPayload {
  orgId: string;
  teamId: string;
  teamName: string;
  memberIds: string[];
  updatedBy: string;
}
export interface SkillXpAddedPayload {
  accountId: string;
  orgId: string;
  skillId: string;
  xpDelta: number;
  newXp: number;
  reason?: string;
  aggregateVersion?: number;
  traceId?: string;
}
export interface SkillXpDeductedPayload {
  accountId: string;
  orgId: string;
  skillId: string;
  xpDelta: number;
  newXp: number;
  reason?: string;
  aggregateVersion?: number;
  traceId?: string;
}
export interface ScheduleAssignRejectedPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  targetAccountId: string;
  reason: string;
  rejectedAt: string;
  traceId?: string;
}
export interface SkillRecognitionGrantedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  minXpRequired: number;
  grantedBy: string;
}
export interface SkillRecognitionRevokedPayload {
  organizationId: string;
  accountId: string;
  skillId: string;
  revokedBy: string;
}
export interface ScheduleCompletedPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  completedBy: string;
  completedAt: string;
  aggregateVersion: number;
  traceId?: string;
}
export interface ScheduleAssignmentCancelledPayload {
  scheduleItemId: string;
  workspaceId: string;
  orgId: string;
  targetAccountId: string;
  cancelledBy: string;
  cancelledAt: string;
  reason?: string;
  aggregateVersion: number;
  traceId?: string;
}
export interface ScheduleProposalCancelledPayload {
  scheduleItemId: string;
  orgId: string;
  workspaceId: string;
  cancelledBy: string;
  cancelledAt: string;
  reason?: string;
  traceId?: string;
}
export interface OrganizationEventPayloadMap {
  'organization:schedule:assigned': ScheduleAssignedPayload;
  'organization:schedule:completed': ScheduleCompletedPayload;
  'organization:schedule:assignmentCancelled': ScheduleAssignmentCancelledPayload;
  'organization:schedule:assignRejected': ScheduleAssignRejectedPayload;
  'organization:schedule:proposalCancelled': ScheduleProposalCancelledPayload;
  'organization:policy:changed': OrgPolicyChangedPayload;
  'organization:member:joined': OrgMemberJoinedPayload;
  'organization:member:left': OrgMemberLeftPayload;
  'organization:team:updated': OrgTeamUpdatedPayload;
  'organization:skill:xpAdded': SkillXpAddedPayload;
  'organization:skill:xpDeducted': SkillXpDeductedPayload;
  'organization:skill:recognitionGranted': SkillRecognitionGrantedPayload;
  'organization:skill:recognitionRevoked': SkillRecognitionRevokedPayload;
}
export type OrganizationEventKey = keyof OrganizationEventPayloadMap;
```

## File: src/features/organization.slice/core.event-bus/index.ts
```typescript

```

## File: src/features/organization.slice/core/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createOrganization as createOrganizationFacade,
  updateOrganizationSettings as updateOrganizationSettingsFacade,
  deleteOrganization as deleteOrganizationFacade,
  createTeam as createTeamFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { Account, ThemeConfig } from "@/shared/types";
export async function createOrganization(
  organizationName: string,
  owner: Account
): Promise<CommandResult>
export async function updateOrganizationSettings(
  organizationId: string,
  settings: { name?: string; description?: string; theme?: ThemeConfig | null }
): Promise<CommandResult>
export async function deleteOrganization(organizationId: string): Promise<CommandResult>
export async function setupOrganizationWithTeam(
  organizationName: string,
  owner: Account,
  teamName: string,
  teamType: "internal" | "external" = "internal"
): Promise<CommandResult>
```

## File: src/features/organization.slice/core/_components/account-grid.tsx
```typescript
import { Globe, MoreVertical, Users, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApp } from "@/shared/app-providers/app-context"
import { Button } from "@/shared/shadcn-ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/shadcn-ui/card"
import { type Account } from "@/shared/types"
interface AccountGridProps {
    accounts: Account[]
}
function AccountCard(
⋮----
const handleClick = () =>
```

## File: src/features/organization.slice/core/_hooks/use-organization-management.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import { useAuth } from '@/shared/app-providers/auth-provider';
import type { ThemeConfig } from '@/shared/types';
import {
  createOrganization as createOrganizationAction,
  updateOrganizationSettings as updateOrganizationSettingsAction,
  deleteOrganization as deleteOrganizationAction,
} from '../_actions';
export function useOrganizationManagement()
```

## File: src/features/organization.slice/core/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client'
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter'
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account } from '@/shared/types'
export async function getOrganization(orgId: string): Promise<Account | null>
export function subscribeToOrganization(
  orgId: string,
  onUpdate: (org: Account | null) => void
): Unsubscribe
```

## File: src/features/organization.slice/gov.members/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  recruitOrganizationMember,
  dismissOrganizationMember,
} from "@/shared/infra/firestore/firestore.facade";
import type { MemberReference } from "@/shared/types";
export async function recruitMember(
  organizationId: string,
  newId: string,
  name: string,
  email: string
): Promise<CommandResult>
export async function dismissMember(
  organizationId: string,
  member: MemberReference
): Promise<CommandResult>
```

## File: src/features/organization.slice/gov.members/_hooks/use-member-management.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import type { MemberReference } from '@/shared/types';
import {
  recruitMember as recruitMemberAction,
  dismissMember as dismissMemberAction,
} from '../_actions';
export function useMemberManagement()
```

## File: src/features/organization.slice/gov.members/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client'
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter'
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter'
import type { Account, MemberReference } from '@/shared/types'
export async function getOrgMembers(orgId: string): Promise<MemberReference[]>
export function subscribeToOrgMembers(
  orgId: string,
  onUpdate: (members: MemberReference[]) => void
): Unsubscribe
```

## File: src/features/organization.slice/gov.members/index.ts
```typescript

```

## File: src/features/organization.slice/gov.partners/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createTeam as createTeamFacade,
  sendPartnerInvite as sendPartnerInviteFacade,
  dismissPartnerMember as dismissPartnerMemberFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { MemberReference } from "@/shared/types";
export async function createPartnerGroup(
  organizationId: string,
  groupName: string
): Promise<CommandResult>
export async function sendPartnerInvite(
  organizationId: string,
  teamId: string,
  email: string
): Promise<CommandResult>
export async function dismissPartnerMember(
  organizationId: string,
  teamId: string,
  member: MemberReference
): Promise<CommandResult>
```

## File: src/features/organization.slice/gov.partners/_hooks/use-partner-management.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import type { MemberReference } from '@/shared/types';
import {
  createPartnerGroup as createPartnerGroupAction,
  sendPartnerInvite as sendPartnerInviteAction,
  dismissPartnerMember as dismissPartnerMemberAction,
} from '../_actions';
export function usePartnerManagement()
```

## File: src/features/organization.slice/gov.partners/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, doc, onSnapshot, orderBy, query, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, PartnerInvite, Team } from '@/shared/types';
export async function getOrgPartners(orgId: string): Promise<Team[]>
export function subscribeToOrgPartners(
  orgId: string,
  onUpdate: (partners: Team[]) => void
): Unsubscribe
export function subscribeToOrgPartnerInvites(
  orgId: string,
  onUpdate: (invites: PartnerInvite[]) => void
): Unsubscribe
```

## File: src/features/organization.slice/gov.partners/index.ts
```typescript

```

## File: src/features/organization.slice/gov.policy/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import { addDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { publishOrgEvent } from '../core.event-bus';
export interface OrgPolicy {
  id: string;
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: 'workspace' | 'member' | 'global';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface OrgPolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: Record<string, string>;
}
export interface CreateOrgPolicyInput {
  orgId: string;
  name: string;
  description: string;
  rules: OrgPolicyRule[];
  scope: OrgPolicy['scope'];
}
export interface UpdateOrgPolicyInput {
  name?: string;
  description?: string;
  rules?: OrgPolicyRule[];
  scope?: OrgPolicy['scope'];
  isActive?: boolean;
}
export async function createOrgPolicy(input: CreateOrgPolicyInput): Promise<CommandResult>
export async function updateOrgPolicy(
  policyId: string,
  orgId: string,
  input: UpdateOrgPolicyInput
): Promise<CommandResult>
export async function deleteOrgPolicy(policyId: string, orgId: string): Promise<CommandResult>
```

## File: src/features/organization.slice/gov.policy/_hooks/use-org-policy.ts
```typescript
import { useState, useEffect } from 'react';
import type { OrgPolicy } from '../_actions';
import { subscribeToOrgPolicies } from '../_queries';
export function useOrgPolicy(orgId: string | null)
```

## File: src/features/organization.slice/gov.policy/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, where, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { OrgPolicy } from './_actions';
export async function getOrgPolicy(policyId: string): Promise<OrgPolicy | null>
export function subscribeToOrgPolicies(
  orgId: string,
  onUpdate: (policies: OrgPolicy[]) => void
): Unsubscribe
export async function getOrgPoliciesByScope(
  orgId: string,
  scope: OrgPolicy['scope']
): Promise<OrgPolicy[]>
```

## File: src/features/organization.slice/gov.policy/index.ts
```typescript

```

## File: src/features/organization.slice/gov.teams/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  createTeam as createTeamFacade,
  updateTeamMembers as updateTeamMembersFacade,
} from "@/shared/infra/firestore/firestore.facade";
export async function createTeam(
  organizationId: string,
  teamName: string,
  type: "internal" | "external"
): Promise<CommandResult>
export async function updateTeamMembers(
  organizationId: string,
  teamId: string,
  memberId: string,
  action: "add" | "remove"
): Promise<CommandResult>
```

## File: src/features/organization.slice/gov.teams/_hooks/use-team-management.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import {
  createTeam as createTeamAction,
  updateTeamMembers as updateTeamMembersAction,
} from '../_actions';
export function useTeamManagement()
```

## File: src/features/organization.slice/gov.teams/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Account, Team } from '@/shared/types';
export async function getOrgTeams(orgId: string): Promise<Team[]>
export function subscribeToOrgTeams(
  orgId: string,
  onUpdate: (teams: Team[]) => void
): Unsubscribe
```

## File: src/features/organization.slice/gov.teams/index.ts
```typescript

```

## File: src/features/projection.bus/_funnel.ts
```typescript
import { onOrgEvent } from '@/features/organization.slice';
import { handleScheduleProposed } from '@/features/scheduling.slice';
import { onTagEvent } from '@/features/shared-kernel';
import { applySkillXpAdded, applySkillXpDeducted } from '@/features/skill-xp.slice';
import {
  handleTagUpdatedForPool,
  handleTagDeprecatedForPool,
  handleTagDeletedForPool,
} from '@/features/skill-xp.slice';
import type { WorkspaceEventBus } from '@/features/workspace.slice';
import { updateDocument, arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';
import { upsertProjectionVersion } from './_registry';
import { appendAuditEntry } from './account-audit';
import { applyScheduleAssigned, applyScheduleCompleted } from './account-schedule';
import {
  applyDemandProposed,
  applyDemandAssigned,
  applyDemandCompleted,
  applyDemandAssignmentCancelled,
  applyDemandProposalCancelled,
  applyDemandAssignRejected,
} from './demand-board';
import {
  applyOrgMemberSkillXp,
  initOrgMemberEntry,
  removeOrgMemberEntry,
  updateOrgMemberEligibility,
} from './org-eligible-member-view';
import { applyMemberJoined, applyMemberLeft } from './organization-view';
import {
  applyTagCreated,
  applyTagUpdated,
  applyTagDeprecated,
  applyTagDeleted,
} from './tag-snapshot';
async function executeAggregateWriteOp(op: {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}): Promise<void>
export function registerWorkspaceFunnel(bus: WorkspaceEventBus): () => void
export function registerOrganizationFunnel(): () => void
export function registerTagFunnel(): () => void
export async function replayWorkspaceProjections(
  workspaceId: string
): Promise<
```

## File: src/features/projection.bus/_query-registration.ts
```typescript
import { registerQuery, QUERY_ROUTES } from '@/features/infra.gateway-query';
import { getAccountView } from './account-view';
import { getOrgEligibleMembersWithTier } from './org-eligible-member-view';
import { getDisplayWalletBalance } from './wallet-balance';
import { queryWorkspaceAccess } from './workspace-scope-guard';
export function registerAllQueryHandlers(): Array<() => void>
```

## File: src/features/projection.bus/_registry.ts
```typescript
import {
  getProjectionVersion as getProjectionVersionRepo,
  upsertProjectionVersion as upsertProjectionVersionRepo,
  type ProjectionVersionRecord,
} from '@/shared/infra/firestore/firestore.facade';
⋮----
export async function getProjectionVersion(
  projectionName: string
): Promise<ProjectionVersionRecord | null>
export async function upsertProjectionVersion(
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void>
```

## File: src/features/projection.bus/account-audit/_projector.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc, collection } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp, setDoc } from '@/shared/infra/firestore/firestore.write.adapter';
import { addDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface AuditProjectionEntry {
  id: string;
  accountId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
  summary: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: ReturnType<typeof serverTimestamp>;
}
export async function appendAuditEntry(
  accountId: string,
  entry: Omit<AuditProjectionEntry, 'id' | 'occurredAt'>,
  eventId?: string
): Promise<string>
```

## File: src/features/projection.bus/account-audit/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { createConverter } from '@/shared/infra/firestore/firestore.converter';
import { collection, query, orderBy, limit } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocuments } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AuditProjectionEntry } from './_projector';
export async function getAccountAuditEntries(
  accountId: string,
  maxEntries = 50
): Promise<AuditProjectionEntry[]>
```

## File: src/features/projection.bus/account-audit/index.ts
```typescript

```

## File: src/features/projection.bus/account-schedule/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface AccountScheduleProjection {
  accountId: string;
  activeAssignmentIds: string[];
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
export async function initAccountScheduleProjection(accountId: string): Promise<void>
export async function applyScheduleAssigned(
  accountId: string,
  assignment: AccountScheduleAssignment,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyScheduleCompleted(
  accountId: string,
  scheduleItemId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/account-schedule/_queries.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projector';
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
```

## File: src/features/projection.bus/account-schedule/index.ts
```typescript

```

## File: src/features/projection.bus/account-view/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Account } from '@/shared/types';
export interface AccountViewRecord {
  readonly implementsAuthoritySnapshot: true;
  accountId: string;
  name: string;
  accountType: 'user' | 'organization';
  email?: string;
  photoURL?: string;
  orgRoles: Record<string, string>;
  skillTagSlugs: string[];
  membershipTag?: 'internal' | 'external';
  authoritySnapshot?: AuthoritySnapshot;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectAccountSnapshot(
  account: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyOrgRoleChange(
  accountId: string,
  orgId: string,
  role: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyAuthoritySnapshot(
  accountId: string,
  snapshot: AuthoritySnapshot,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/account-view/_queries.ts
```typescript
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountViewRecord } from './_projector';
export async function getAccountView(accountId: string): Promise<AccountViewRecord | null>
export async function getAccountAuthoritySnapshot(
  accountId: string
): Promise<AuthoritySnapshot | null>
export async function getAccountMembershipTag(
  accountId: string
): Promise<'internal' | 'external' | null>
```

## File: src/features/projection.bus/account-view/index.ts
```typescript

```

## File: src/features/projection.bus/demand-board/_projector.ts
```typescript
import type {
  ScheduleAssignedPayload,
  ScheduleCompletedPayload,
  ScheduleAssignmentCancelledPayload,
  ScheduleProposalCancelledPayload,
  ScheduleAssignRejectedPayload,
} from '@/features/organization.slice';
import { versionGuardAllows } from '@/features/shared-kernel';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { arrayUnion, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
function scheduleItemPath(orgId: string, scheduleItemId: string): string
⋮----
export async function applyDemandProposed(
  payload: WorkspaceScheduleProposedPayload
): Promise<void>
export async function applyDemandAssigned(payload: ScheduleAssignedPayload): Promise<void>
export async function applyDemandCompleted(payload: ScheduleCompletedPayload): Promise<void>
export async function applyDemandAssignmentCancelled(
  payload: ScheduleAssignmentCancelledPayload
): Promise<void>
export async function applyDemandProposalCancelled(
  payload: ScheduleProposalCancelledPayload
): Promise<void>
export async function applyDemandAssignRejected(
  payload: ScheduleAssignRejectedPayload
): Promise<void>
async function _closeScheduleItem(
  orgId: string,
  scheduleItemId: string,
  status: 'COMPLETED' | 'REJECTED',
  aggregateVersion: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/demand-board/index.ts
```typescript

```

## File: src/features/projection.bus/global-audit-view/_projector.ts
```typescript
import type { EventEnvelope } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { doc } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDoc, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
export interface GlobalAuditRecord {
  readonly auditEventId: string;
  readonly traceId: string;
  readonly accountId: string;
  readonly workspaceId?: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
}
export interface GlobalAuditQuery {
  accountId?: string;
  workspaceId?: string;
  limit?: number;
}
export async function applyAuditEvent(
  envelope: EventEnvelope,
  payload: Record<string, unknown>,
  context: { accountId: string; workspaceId?: string }
): Promise<void>
```

## File: src/features/projection.bus/global-audit-view/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, where, limit, query as firestoreQuery } from '@/shared/infra/firestore/firestore.read.adapter';
import type { GlobalAuditRecord, GlobalAuditQuery } from './_projector';
export async function getGlobalAuditEvents(
  query: GlobalAuditQuery = {}
): Promise<GlobalAuditRecord[]>
export async function getGlobalAuditEventsByWorkspace(
  workspaceId: string,
  maxResults = 50
): Promise<GlobalAuditRecord[]>
```

## File: src/features/projection.bus/global-audit-view/index.ts
```typescript

```

## File: src/features/projection.bus/index.ts
```typescript

```

## File: src/features/projection.bus/org-eligible-member-view/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface OrgEligibleMemberEntry {
  orgId: string;
  accountId: string;
  skills: Record<string, { xp: number }>;
  eligible: boolean;
  lastProcessedVersion: number;
  lastProcessedSkillVersion: number;
  readModelVersion: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
function memberPath(orgId: string, accountId: string): string
export async function initOrgMemberEntry(
  orgId: string,
  accountId: string,
  traceId?: string
): Promise<void>
export async function removeOrgMemberEntry(
  orgId: string,
  accountId: string
): Promise<void>
export interface ApplyOrgMemberSkillXpInput {
  orgId: string;
  accountId: string;
  skillId: string;
  newXp: number;
  traceId?: string;
  aggregateVersion?: number;
}
export async function applyOrgMemberSkillXp(
  input: ApplyOrgMemberSkillXpInput
): Promise<void>
export async function updateOrgMemberEligibility(
  orgId: string,
  accountId: string,
  eligible: boolean,
  incomingAggregateVersion: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/org-eligible-member-view/_queries.ts
```typescript
import { resolveSkillTier } from '@/features/shared-kernel';
import type { SkillTier } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocs, collection, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { OrgEligibleMemberEntry } from './_projector';
export interface OrgMemberSkillWithTier {
  skillId: string;
  xp: number;
  tier: SkillTier;
}
export interface OrgEligibleMemberView {
  orgId: string;
  accountId: string;
  skills: OrgMemberSkillWithTier[];
  eligible: boolean;
}
function enrichWithTier(entry: OrgEligibleMemberEntry): OrgEligibleMemberView
export async function getOrgMemberEligibility(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberEntry | null>
export async function getOrgEligibleMembers(
  orgId: string
): Promise<OrgEligibleMemberEntry[]>
export async function getOrgMemberEligibilityWithTier(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
export async function getAllOrgMembersView(
  orgId: string
): Promise<OrgEligibleMemberView[]>
export async function getOrgEligibleMembersWithTier(
  orgId: string
): Promise<OrgEligibleMemberView[]>
```

## File: src/features/projection.bus/org-eligible-member-view/index.ts
```typescript

```

## File: src/features/projection.bus/organization-view/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Account } from '@/shared/types';
export interface OrganizationViewRecord {
  orgId: string;
  name: string;
  ownerId: string;
  memberCount: number;
  teamCount: number;
  partnerCount: number;
  memberIds: string[];
  teamIndex: Record<string, string>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectOrganizationSnapshot(
  org: Account,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyMemberJoined(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyMemberLeft(
  orgId: string,
  memberId: string,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/organization-view/_queries.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { OrganizationViewRecord } from './_projector';
export async function getOrganizationView(orgId: string): Promise<OrganizationViewRecord | null>
export async function getOrganizationMemberIds(orgId: string): Promise<string[]>
```

## File: src/features/projection.bus/organization-view/index.ts
```typescript

```

## File: src/features/projection.bus/tag-snapshot/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import type { TagCreatedPayload, TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument, deleteDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface TagSnapshotEntry {
  tagSlug: string;
  label: string;
  category: string;
  deprecatedAt?: string;
  replacedByTagSlug?: string;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
}
export async function applyTagCreated(payload: TagCreatedPayload, traceId?: string): Promise<void>
export async function applyTagUpdated(
  payload: TagUpdatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyTagDeprecated(
  payload: TagDeprecatedPayload,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyTagDeleted(payload: TagDeletedPayload): Promise<void>
```

## File: src/features/projection.bus/tag-snapshot/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { TagSnapshotEntry } from './_projector';
export async function getTagSnapshot(tagSlug: string): Promise<TagSnapshotEntry | null>
export async function getAllTagSnapshots(): Promise<TagSnapshotEntry[]>
export async function getActiveTagSnapshots(): Promise<TagSnapshotEntry[]>
```

## File: src/features/projection.bus/tag-snapshot/index.ts
```typescript

```

## File: src/features/projection.bus/wallet-balance/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface WalletBalanceView {
  readonly accountId: string;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
⋮----
export async function initWalletBalanceView(accountId: string): Promise<void>
export async function applyWalletCredited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyWalletDebited(
  accountId: string,
  amount: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function syncWalletBalanceFromAggregate(
  accountId: string,
  authoritative: { balance: number; aggregateVersion?: number; traceId?: string }
): Promise<void>
```

## File: src/features/projection.bus/wallet-balance/_queries.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { WalletBalanceView } from './_projector';
export async function getWalletBalanceView(
  accountId: string
): Promise<WalletBalanceView | null>
export async function getDisplayWalletBalance(accountId: string): Promise<number>
```

## File: src/features/projection.bus/wallet-balance/index.ts
```typescript

```

## File: src/features/projection.bus/workspace-scope-guard/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkspaceScopeGuardView } from './_read-model';
export async function initScopeGuardView(
  workspaceId: string,
  ownerId: string,
  traceId?: string
): Promise<void>
export async function applyGrantEvent(
  workspaceId: string,
  userId: string,
  role: string,
  status: 'active' | 'revoked',
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/workspace-scope-guard/_queries.ts
```typescript
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { WorkspaceScopeGuardView } from './_read-model';
import { buildAuthoritySnapshot } from './_read-model';
export async function getScopeGuardView(
  workspaceId: string
): Promise<WorkspaceScopeGuardView | null>
export async function queryWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<
```

## File: src/features/projection.bus/workspace-scope-guard/_read-model.ts
```typescript
import type { AuthoritySnapshot } from '@/features/shared-kernel';
import type { Timestamp } from '@/shared/ports';
export interface WorkspaceScopeGuardView {
  readonly implementsAuthoritySnapshot: true;
  workspaceId: string;
  ownerId: string;
  grantIndex: Record<string, WorkspaceScopeGrantEntry>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: Timestamp;
}
export interface WorkspaceScopeGrantEntry {
  role: string;
  status: 'active' | 'revoked';
  snapshotAt: string;
}
export function buildAuthoritySnapshot(
  view: WorkspaceScopeGuardView,
  userId: string
): AuthoritySnapshot
function derivePermissions(roles: string[]): string[]
```

## File: src/features/projection.bus/workspace-scope-guard/index.ts
```typescript

```

## File: src/features/projection.bus/workspace-view/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { Workspace } from '@/shared/types';
export interface WorkspaceViewRecord {
  workspaceId: string;
  name: string;
  dimensionId: string;
  lifecycleState: string;
  visibility: string;
  capabilities: string[];
  grantCount: number;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
export async function projectWorkspaceSnapshot(
  workspace: Workspace,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applyCapabilityUpdate(
  workspaceId: string,
  capabilities: string[],
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/projection.bus/workspace-view/_queries.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { WorkspaceViewRecord } from './_projector';
export async function getWorkspaceView(workspaceId: string): Promise<WorkspaceViewRecord | null>
export async function getWorkspaceCapabilities(workspaceId: string): Promise<string[]>
```

## File: src/features/projection.bus/workspace-view/index.ts
```typescript

```

## File: src/features/README.MD
```markdown
放置領域切片與系統能力：業務邏輯、use-cases、Server Actions 等。
只允許向下依賴；向上 import 為架構違規。
```

## File: src/features/scheduling.slice/_aggregate.ts
```typescript
import { z } from 'zod';
import { publishOrgEvent } from '@/features/organization.slice';
import { getOrgMemberEligibility } from '@/features/projection.bus';
import { resolveSkillTier, tierSatisfies } from '@/features/shared-kernel';
import type { WorkspaceScheduleProposedPayload, SkillRequirement } from '@/features/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/features/shared-kernel';
import { getDocument, Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
export type OrgScheduleStatus = (typeof ORG_SCHEDULE_STATUSES)[number];
⋮----
export type OrgScheduleProposal = z.infer<typeof orgScheduleProposalSchema>;
function scheduleItemPath(orgId: string, scheduleItemId: string): string
export interface WriteOp {
  path: string;
  data: Record<string, unknown>;
  arrayUnionFields?: Record<string, string[]>;
}
export function handleScheduleProposed(
  payload: WorkspaceScheduleProposedPayload
): WriteOp
export type ScheduleApprovalResult =
  | { outcome: 'confirmed'; scheduleItemId: string; writeOp: WriteOp }
  | { outcome: 'rejected'; scheduleItemId: string; reason: string; writeOp: WriteOp };
export async function approveOrgScheduleProposal(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<ScheduleApprovalResult>
async function _buildCancelWriteOp(
  scheduleItemId: string,
  targetAccountId: string,
  opts: { workspaceId: string; orgId: string; traceId?: string },
  reason: string
): Promise<WriteOp>
export async function cancelOrgScheduleProposal(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<WriteOp>
export async function completeOrgSchedule(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<WriteOp>
export async function cancelOrgScheduleAssignment(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<WriteOp>
```

## File: src/features/scheduling.slice/_components/decision-history-columns.tsx
```typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import type { ScheduleItem } from '@/features/shared-kernel'
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
export type DecisionHistoryItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'status' | 'updatedAt'>
```

## File: src/features/scheduling.slice/_components/governance-sidebar.tsx
```typescript
import { Check, X } from "lucide-react";
import type { SkillRequirement } from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import { SKILLS } from '@/shared/constants/skills';
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
interface GovernanceSidebarProps {
  proposals: ScheduleItem[];
  onApprove: (item: ScheduleItem) => void;
  onReject: (item: ScheduleItem) => void;
}
```

## File: src/features/scheduling.slice/_components/schedule-data-table.tsx
```typescript
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
⋮----
import { Button } from "@/shared/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import { Input } from "@/shared/shadcn-ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/shadcn-ui/table"
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
⋮----
column.toggleVisibility(!!value)
```

## File: src/features/scheduling.slice/_components/schedule.workspace-view.tsx
```typescript
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/features/workspace.slice";
import { Button } from "@/shared/shadcn-ui/button";
import { useWorkspaceSchedule } from "../_hooks/use-workspace-schedule";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
export function WorkspaceSchedule()
⋮----
onClick=
```

## File: src/features/scheduling.slice/_components/upcoming-events-columns.tsx
```typescript
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import type { ScheduleItem } from '@/features/shared-kernel'
import { SKILLS } from "@/shared/constants/skills"
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip"
import { type MemberReference } from "@/shared/types"
export type UpcomingEventItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'startDate' | 'endDate' | 'assigneeIds' | 'requiredSkills'> & { members: MemberReference[] }
```

## File: src/features/scheduling.slice/_eligibility.ts
```typescript
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import type { SkillRequirement } from '@/features/shared-kernel';
⋮----
export type SagaTier = (typeof SAGA_TIER_ORDER)[number];
export function sagaTierIndex(tier: string): number
export function findEligibleCandidate(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): OrgEligibleMemberView | undefined
export interface CandidateAssignment {
  candidate: OrgEligibleMemberView;
  requirement: SkillRequirement | null;
}
export function findEligibleCandidatesForRequirements(
  members: OrgEligibleMemberView[],
  requirements: SkillRequirement[]
): CandidateAssignment[] | undefined
```

## File: src/features/scheduling.slice/_hooks/use-org-schedule.ts
```typescript
import { useState, useEffect } from 'react';
import type { ScheduleItem, ScheduleStatus } from '@/features/shared-kernel';
import { subscribeToOrgScheduleProposals, subscribeToPendingProposals, subscribeToConfirmedProposals } from '../_queries';
export function useOrgSchedule(
  orgId: string | null,
  opts?: { status?: ScheduleStatus }
)
export function usePendingScheduleProposals(orgId: string | null)
export function useConfirmedScheduleProposals(orgId: string | null)
```

## File: src/features/scheduling.slice/_projectors/account-schedule-queries.ts
```typescript

```

## File: src/features/scheduling.slice/_projectors/account-schedule.ts
```typescript
import type { FieldValue } from '@/shared/infra/firestore/firestore.write.adapter';
export interface AccountScheduleProjection {
  accountId: string;
  activeAssignmentIds: string[];
  assignmentIndex: Record<string, AccountScheduleAssignment>;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: FieldValue;
}
export interface AccountScheduleAssignment {
  scheduleItemId: string;
  workspaceId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}
```

## File: src/features/scheduling.slice/_projectors/demand-board-queries.ts
```typescript
import type { ImplementsStalenessContract } from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
⋮----
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]>
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]>
```

## File: src/features/scheduling.slice/_projectors/demand-board.ts
```typescript

```

## File: src/features/scheduling.slice/_queries.ts
```typescript
import {
  getOrgMemberEligibilityWithTier,
  getOrgEligibleMembersWithTier,
  type OrgEligibleMemberView,
  type OrgMemberSkillWithTier,
} from '@/features/projection.bus';
import type { ImplementsStalenessContract } from '@/features/shared-kernel';
import type { ScheduleItem, ScheduleStatus } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import { getScheduleItems as getScheduleItemsFacade } from '@/shared/infra/firestore/firestore.facade';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { AccountScheduleProjection, AccountScheduleAssignment } from './_projectors/account-schedule';
⋮----
export async function getScheduleItems(
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]>
export async function getOrgScheduleItem(
  orgId: string,
  scheduleItemId: string
): Promise<ScheduleItem | null>
⋮----
export function subscribeToOrgScheduleProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  opts?: { status?: ScheduleStatus; maxItems?: number }
): Unsubscribe
export function subscribeToPendingProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
export function subscribeToConfirmedProposals(
  orgId: string,
  onUpdate: (items: ScheduleItem[]) => void
): Unsubscribe
export async function getActiveDemands(orgId: string): Promise<ScheduleItem[]>
export function subscribeToDemandBoard(
  orgId: string,
  onChange: (items: ScheduleItem[]) => void
): Unsubscribe
export async function getAllDemands(orgId: string): Promise<ScheduleItem[]>
export async function getAccountScheduleProjection(
  accountId: string
): Promise<AccountScheduleProjection | null>
export async function getAccountActiveAssignments(
  accountId: string
): Promise<AccountScheduleAssignment[]>
⋮----
export async function getEligibleMemberForSchedule(
  orgId: string,
  accountId: string
): Promise<OrgEligibleMemberView | null>
export async function getEligibleMembersForSchedule(
  orgId: string
): Promise<OrgEligibleMemberView[]>
export function subscribeToWorkspaceScheduleItems(
  dimensionId: string,
  workspaceId: string,
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe
```

## File: src/features/semantic-graph.slice/_actions.ts
```typescript
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import type { TaxonomyNode } from '@/features/shared-kernel';
import { detectTemporalConflicts, validateTaxonomyAssignment } from './_aggregate';
import { indexEntity, removeFromIndex } from './_services';
import type {
  TemporalTagAssignment,
  SemanticIndexEntry,
} from './_types';
export async function upsertTagWithConflictCheck(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult>
export async function removeTag(tagSlug: string): Promise<CommandResult>
export async function assignSemanticTag(
  node: TaxonomyNode,
  temporalAssignment: TemporalTagAssignment | null,
  existingNodes: readonly TaxonomyNode[],
  existingAssignments: readonly TemporalTagAssignment[]
): Promise<CommandResult>
```

## File: src/features/semantic-graph.slice/_aggregate.ts
```typescript
import { TAXONOMY_DIMENSIONS } from '@/features/shared-kernel';
import type { TaxonomyDimension, TaxonomyNode } from '@/features/shared-kernel';
import type {
  TemporalTagAssignment,
  TemporalConflict,
  TemporalConflictCheckInput,
  TemporalConflictCheckResult,
  TaxonomyTree,
  TaxonomyValidationResult,
  TaxonomyValidationError,
  TaxonomyErrorCode,
} from './_types';
⋮----
export function detectTemporalConflicts(
  input: TemporalConflictCheckInput
): TemporalConflictCheckResult
function isOverlapping(a: TemporalTagAssignment, b: TemporalTagAssignment): boolean
export function validateTaxonomyAssignment(
  node: TaxonomyNode,
  existingNodes: readonly TaxonomyNode[],
  validDimensions: readonly TaxonomyDimension[] = TAXONOMY_DIMENSIONS
): TaxonomyValidationResult
function hasCircularReference(
  nodeSlug: string,
  parentSlug: string,
  existingNodes: readonly TaxonomyNode[]
): boolean
export function checkTemporalConflict(
  newAssignment: TemporalTagAssignment,
  existingAssignments: readonly TemporalTagAssignment[]
): TemporalConflictCheckResult
export function validateTaxonomyPath(
  path: readonly string[],
  tree: TaxonomyTree
): TaxonomyValidationResult
function buildNodeMap(tree: TaxonomyTree): Map<string, TaxonomyNode>
function makeError(
  code: TaxonomyErrorCode,
  tagSlug: string,
  message: string,
  dimension?: TaxonomyDimension
): TaxonomyValidationError
```

## File: src/features/semantic-graph.slice/_services.ts
```typescript
import type { SearchDomain, SemanticSearchHit } from '@/features/shared-kernel';
import { SEARCH_DOMAINS } from '@/features/shared-kernel';
import type { SemanticIndexEntry, SemanticIndexStats } from './_types';
⋮----
export function indexEntity(entry: SemanticIndexEntry): void
export function removeFromIndex(domain: string, id: string): void
export function querySemanticIndex(
  query: string,
  options?: {
    domains?: readonly string[];
    tagFilters?: readonly string[];
    limit?: number;
  }
): SemanticSearchHit[]
export function getIndexStats(): SemanticIndexStats
function isValidSearchDomain(domain: string): domain is SearchDomain
function computeRelevanceScore(entry: SemanticIndexEntry, terms: string[]): number
```

## File: src/features/semantic-graph.slice/_types.ts
```typescript
import type {
  TaxonomyDimension,
  TaxonomyNode,
  SemanticSearchHit,
} from '@/features/shared-kernel';
export interface TemporalTagAssignment {
  readonly tagSlug: string;
  readonly entityId: string;
  readonly entityType: 'member' | 'workspace' | 'schedule';
  readonly startDate: string;
  readonly endDate: string;
  readonly locationId?: string;
}
export interface TemporalConflict {
  readonly tagSlug: string;
  readonly entityId: string;
  readonly existingAssignment: TemporalTagAssignment;
  readonly conflictingAssignment: TemporalTagAssignment;
  readonly overlapStartDate: string;
  readonly overlapEndDate: string;
}
export interface TemporalConflictCheckInput {
  readonly candidate: TemporalTagAssignment;
  readonly existingAssignments: readonly TemporalTagAssignment[];
}
export interface TemporalConflictCheckResult {
  readonly hasConflict: boolean;
  readonly conflicts: readonly TemporalConflict[];
}
export interface TaxonomyTree {
  readonly dimension: TaxonomyDimension;
  readonly roots: readonly TaxonomyNode[];
  readonly nodes?: readonly TaxonomyNode[];
  readonly nodeCount: number;
}
export interface TaxonomyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TaxonomyValidationError[];
}
export interface TaxonomyValidationError {
  readonly code: TaxonomyErrorCode;
  readonly message: string;
  readonly tagSlug: string;
  readonly dimension?: TaxonomyDimension;
}
export type TaxonomyErrorCode =
  | 'UNKNOWN_DIMENSION'
  | 'INVALID_PARENT'
  | 'CIRCULAR_REFERENCE'
  | 'DUPLICATE_SLUG'
  | 'DEPTH_EXCEEDED'
  | 'DEPRECATED_TAG';
export interface SemanticIndexEntry {
  readonly id: string;
  readonly domain: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly tags: readonly string[];
  readonly searchableText: string;
  readonly href?: string;
  readonly updatedAt: string;
}
export interface SemanticIndexStats {
  readonly totalEntries: number;
  readonly entriesByDomain: Record<string, number>;
  readonly lastUpdatedAt: string;
}
```

## File: src/features/semantic-graph.slice/centralized-tag/_actions.ts
```typescript
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import {
  publishTagEvent,
  type CentralizedTagEntry,
  type TagDeleteRule,
} from '@/features/shared-kernel/centralized-tag';
import {
  buildIdempotencyKey,
  type DlqTier,
} from '@/features/shared-kernel/outbox-contract';
import type { TagCategory } from '@/features/shared-kernel/tag-authority';
import { Timestamp, getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
async function writeTagOutbox(
  eventType: string,
  tagSlug: string,
  payload: unknown,
  traceId?: string
): Promise<void>
export async function createTag(
  tagSlug: string,
  label: string,
  category: TagCategory,
  createdBy: string,
  deleteRule: TagDeleteRule = 'block-if-referenced',
  traceId?: string
): Promise<CommandResult>
export async function updateTag(
  tagSlug: string,
  updates: { label?: string; category?: TagCategory },
  updatedBy: string,
  traceId?: string
): Promise<CommandResult>
export async function deprecateTag(
  tagSlug: string,
  deprecatedBy: string,
  replacedByTagSlug?: string,
  traceId?: string
): Promise<CommandResult>
export async function deleteTag(
  tagSlug: string,
  deletedBy: string,
  traceId?: string
): Promise<CommandResult>
export async function getTag(tagSlug: string): Promise<CentralizedTagEntry | null>
```

## File: src/features/semantic-graph.slice/index.ts
```typescript

```

## File: src/features/shared-kernel/authority-snapshot/index.ts
```typescript
export interface AuthoritySnapshot {
  readonly subjectId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly snapshotAt: string;
  readonly readModelVersion: number;
}
export interface ImplementsAuthoritySnapshotContract {
  readonly implementsAuthoritySnapshot: true;
}
```

## File: src/features/shared-kernel/centralized-tag/_aggregate.ts
```typescript
import type { TagCategory } from '../tag-authority';
export type TagDeleteRule = 'allow' | 'block-if-referenced';
export interface CentralizedTagEntry {
  tagSlug: string;
  label: string;
  category: TagCategory;
  deprecatedAt?: string;
  replacedByTagSlug?: string;
  deleteRule: TagDeleteRule;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## File: src/features/shared-kernel/centralized-tag/_bus.ts
```typescript
import type { ImplementsEventEnvelopeContract } from '../event-envelope';
import type { TagLifecycleEventPayloadMap, TagLifecycleEventKey } from './_events';
type TagEventHandler<K extends TagLifecycleEventKey> = (
  payload: TagLifecycleEventPayloadMap[K]
) => void | Promise<void>;
type TagEventHandlerMap = {
  [K in TagLifecycleEventKey]?: Array<TagEventHandler<K>>;
};
⋮----
export function onTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  handler: TagEventHandler<K>
): () => void
export function publishTagEvent<K extends TagLifecycleEventKey>(
  eventKey: K,
  payload: TagLifecycleEventPayloadMap[K]
): void
```

## File: src/features/shared-kernel/centralized-tag/_events.ts
```typescript

```

## File: src/features/shared-kernel/centralized-tag/index.ts
```typescript

```

## File: src/features/shared-kernel/command-result-contract/index.ts
```typescript
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}
export interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}
export interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
export type CommandResult = CommandSuccess | CommandFailure;
export function commandSuccess(aggregateId: string, version: number): CommandSuccess
export function commandFailure(error: DomainError): CommandFailure
export function commandFailureFrom(
  code: string,
  message: string,
  context?: Record<string, unknown>,
): CommandFailure
```

## File: src/features/shared-kernel/constants/index.ts
```typescript
export type WorkflowStatus = (typeof WorkflowStatusValues)[number];
⋮----
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

## File: src/features/shared-kernel/event-envelope/index.ts
```typescript
export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly sourceId: string;
  readonly payload: TPayload;
  readonly version?: number;
  readonly traceId?: string;
  readonly idempotencyKey?: string;
  readonly causationId?: string;
  readonly correlationId?: string;
}
export interface ImplementsEventEnvelopeContract {
  readonly implementsEventEnvelope: true;
}
```

## File: src/features/shared-kernel/infrastructure-ports/index.ts
```typescript

```

## File: src/features/shared-kernel/outbox-contract/index.ts
```typescript
export type DlqTier = 'SAFE_AUTO' | 'REVIEW_REQUIRED' | 'SECURITY_BLOCK';
export type OutboxStatus = 'pending' | 'relayed' | 'dlq';
export interface OutboxRecord {
  readonly outboxId: string;
  readonly idempotencyKey: string;
  readonly dlqTier: DlqTier;
  readonly payload: string;
  readonly createdAt: string;
  readonly status: OutboxStatus;
}
export function buildIdempotencyKey(
  eventId: string,
  aggId: string,
  version: number,
): string
export interface ImplementsOutboxContract {
  readonly implementsOutboxContract: true;
}
```

## File: src/features/shared-kernel/read-consistency/index.ts
```typescript
export type ReadConsistencyMode = 'STRONG_READ' | 'EVENTUAL_READ';
export interface ReadConsistencyContext {
  readonly isFinancial: boolean;
  readonly isSecurity: boolean;
  readonly isIrreversible: boolean;
}
export function resolveReadConsistency(ctx: ReadConsistencyContext): ReadConsistencyMode
export interface ImplementsReadConsistency {
  readonly readConsistencyMode: ReadConsistencyMode;
}
```

## File: src/features/shared-kernel/resilience-contract/index.ts
```typescript
export interface RateLimitConfig {
  readonly perUserLimit: number;
  readonly perOrgLimit: number;
  readonly windowMs: number;
}
export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly openDurationMs: number;
}
export interface BulkheadConfig {
  readonly sliceId: string;
  readonly maxConcurrency: number;
}
export interface ResilienceContract {
  readonly rateLimit: RateLimitConfig;
  readonly circuitBreaker: CircuitBreakerConfig;
  readonly bulkhead: BulkheadConfig;
}
⋮----
export interface ImplementsResilienceContract {
  readonly implementsResilienceContract: true;
}
```

## File: src/features/shared-kernel/schedule-contract/index.ts
```typescript
import type { SkillRequirement } from '@/features/shared-kernel/skill-tier';
import type { Timestamp } from '@/shared/ports';
export interface Location {
  building?: string;
  floor?: string;
  room?: string;
  description: string;
}
export type ScheduleStatus = 'PROPOSAL' | 'OFFICIAL' | 'REJECTED' | 'COMPLETED';
export interface ScheduleItem {
  id: string;
  accountId: string;
  workspaceId: string;
  workspaceName?: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  startDate: Timestamp;
  endDate: Timestamp;
  status: ScheduleStatus;
  originType: 'MANUAL' | 'TASK_AUTOMATION';
  originTaskId?: string;
  assigneeIds: string[];
  location?: Location;
  locationId?: string;
  requiredSkills?: SkillRequirement[];
  proposedBy?: string;
  version?: number;
  traceId?: string;
}
```

## File: src/features/shared-kernel/semantic-primitives/index.ts
```typescript
export type SearchDomain = (typeof SEARCH_DOMAINS)[number];
export interface SemanticSearchQuery {
  readonly query: string;
  readonly domains: readonly SearchDomain[];
  readonly tagFilters?: readonly string[];
  readonly limit?: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
export interface SemanticSearchHit {
  readonly id: string;
  readonly domain: SearchDomain;
  readonly title: string;
  readonly subtitle?: string;
  readonly score: number;
  readonly tags: readonly string[];
  readonly href?: string;
}
export interface SemanticSearchResult {
  readonly hits: readonly SemanticSearchHit[];
  readonly totalCount: number;
  readonly cursor?: string;
  readonly traceId?: string;
}
⋮----
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
⋮----
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
⋮----
export type TaxonomyDimension = (typeof TAXONOMY_DIMENSIONS)[number];
export interface TaxonomyNode {
  readonly slug: string;
  readonly label: string;
  readonly dimension: TaxonomyDimension;
  readonly parentSlug?: string;
  readonly depth: number;
  readonly metadata?: Record<string, unknown>;
}
```

## File: src/features/shared-kernel/staleness-contract/index.ts
```typescript
export type StalenessTier = 'TAG' | 'CRITICAL' | 'STANDARD' | 'DEMAND_BOARD';
export function getSlaMs(tier: StalenessTier): number
export function isStale(ageMs: number, tier: StalenessTier): boolean
export interface ImplementsStalenessContract {
  readonly stalenessTier: StalenessTier;
}
```

## File: src/features/shared-kernel/tag-authority/index.ts
```typescript
export type TagCategory = (typeof TAG_CATEGORIES)[number];
export type TagDeleteRule = 'block' | 'archive' | 'cascade';
export type TagSlugRef = string & { readonly _brand: 'TagSlugRef' };
export function tagSlugRef(raw: string): TagSlugRef
export interface TagCreatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly createdBy: string;
  readonly createdAt: string;
}
export interface TagUpdatedPayload {
  readonly tagSlug: string;
  readonly label: string;
  readonly category: TagCategory;
  readonly updatedBy: string;
  readonly updatedAt: string;
}
export interface TagDeprecatedPayload {
  readonly tagSlug: string;
  readonly replacedByTagSlug?: string;
  readonly deprecatedBy: string;
  readonly deprecatedAt: string;
}
export interface TagDeletedPayload {
  readonly tagSlug: string;
  readonly deletedBy: string;
  readonly deletedAt: string;
}
export interface TagLifecycleEventPayloadMap {
  'tag:created':    TagCreatedPayload;
  'tag:updated':    TagUpdatedPayload;
  'tag:deprecated': TagDeprecatedPayload;
  'tag:deleted':    TagDeletedPayload;
}
export type TagLifecycleEventKey = keyof TagLifecycleEventPayloadMap;
export interface ITagReadPort {
  getLabelBySlug(tagSlug: string): Promise<string | null>;
  getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;
  isActive(tagSlug: string): Promise<boolean>;
}
⋮----
getLabelBySlug(tagSlug: string): Promise<string | null>;
getLabelsBySlug(tagSlugs: string[]): Promise<Record<string, string>>;
isActive(tagSlug: string): Promise<boolean>;
⋮----
export interface ImplementsTagStaleGuard {
  readonly implementsTagStaleGuard: true;
  readonly maxStalenessMs: number;
}
```

## File: src/features/shared-kernel/token-refresh-contract/index.ts
```typescript
export type ClaimsRefreshTrigger = 'RoleChanged' | 'PolicyChanged';
⋮----
export type TokenRefreshSignal = typeof TOKEN_REFRESH_SIGNAL;
export type ClaimsRefreshOutcome = 'success' | 'failure';
export interface ClaimsRefreshHandshake {
  readonly trigger: ClaimsRefreshTrigger;
  readonly accountId: string;
  readonly outcome: ClaimsRefreshOutcome;
  readonly completedAt: string;
  readonly traceId: string;
}
export interface ClientTokenRefreshObligation {
  readonly signal: TokenRefreshSignal;
  readonly action: 'force_refresh_and_reattach';
}
⋮----
export interface ImplementsTokenRefreshContract {
  readonly implementsTokenRefreshContract: true;
}
```

## File: src/features/shared-kernel/version-guard/index.ts
```typescript
export interface VersionGuardInput {
  readonly eventVersion: number;
  readonly viewLastProcessedVersion: number;
}
export type VersionGuardResult = 'allow' | 'discard';
export function applyVersionGuard(input: VersionGuardInput): VersionGuardResult
export function versionGuardAllows(input: VersionGuardInput): boolean
export interface ImplementsVersionGuard {
  readonly implementsVersionGuard: true;
}
```

## File: src/features/skill-xp.slice/_actions.ts
```typescript
import { publishOrgEvent } from '@/features/organization.slice';
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import { addXp, deductXp } from './_aggregate';
import { addSkillTagToPool, removeSkillTagFromPool } from './_tag-pool';
export interface AddXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  sourceId?: string;
  traceId?: string;
}
export async function addSkillXp(input: AddXpInput): Promise<CommandResult>
export interface DeductXpInput {
  accountId: string;
  skillId: string;
  delta: number;
  orgId: string;
  reason?: string;
  sourceId?: string;
  traceId?: string;
}
export async function deductSkillXp(input: DeductXpInput): Promise<CommandResult>
export async function addOrgSkillTagAction(
  orgId: string,
  tagSlug: string,
  tagName: string,
  actorId: string
): Promise<CommandResult>
export async function removeOrgSkillTagAction(
  orgId: string,
  tagSlug: string
): Promise<CommandResult>
```

## File: src/features/skill-xp.slice/_aggregate.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { appendXpLedgerEntry } from './_ledger';
⋮----
export interface AccountSkillRecord {
  accountId: string;
  skillId: string;
  xp: number;
  version: number;
}
function clampXp(xp: number): number
function aggregatePath(accountId: string, skillId: string): string
export async function addXp(
  accountId: string,
  skillId: string,
  delta: number,
  opts: { orgId: string; reason?: string; sourceId?: string }
): Promise<
export async function deductXp(
  accountId: string,
  skillId: string,
  delta: number,
  opts: { orgId: string; reason?: string; sourceId?: string }
): Promise<
export async function getSkillXp(
  accountId: string,
  skillId: string
): Promise<number>
```

## File: src/features/skill-xp.slice/_components/personal-skill-panel.tsx
```typescript
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveSkillTier, TIER_DEFINITIONS } from '@/features/shared-kernel';
import { useApp } from '@/shared/app-providers/app-context';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { Progress } from '@/shared/shadcn-ui/progress';
import type { AccountSkillEntry } from '../_projector';
import { getAccountSkillView } from '../_queries';
interface SkillRow {
  skillId: string;
  xp: number;
  tier: string;
  tierLabel: string;
  tierColor: string;
  progressPct: number;
  xpInTier: number;
  xpNeeded: number;
}
function buildRows(entries: AccountSkillEntry[]): SkillRow[]
export function PersonalSkillPanel()
```

## File: src/features/skill-xp.slice/_ledger.ts
```typescript
import { addDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface XpLedgerEntry {
  accountId: string;
  skillId: string;
  delta: number;
  reason: string;
  sourceId?: string;
  timestamp: string;
}
export async function appendXpLedgerEntry(
  accountId: string,
  entry: Omit<XpLedgerEntry, 'accountId' | 'timestamp'>
): Promise<string>
```

## File: src/features/skill-xp.slice/_org-recognition.ts
```typescript
import { publishOrgEvent } from '@/features/organization.slice';
import { findSkill } from '@/shared/constants/skills';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
export type SkillRecognitionStatus = 'active' | 'revoked';
export interface OrgSkillRecognitionRecord {
  organizationId: string;
  accountId: string;
  skillId: string;
  minXpRequired: number;
  status: SkillRecognitionStatus;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
}
export async function grantSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string,
  grantedBy: string,
  minXpRequired = 0
): Promise<void>
export async function revokeSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string,
  revokedBy: string
): Promise<void>
```

## File: src/features/skill-xp.slice/_projector.ts
```typescript
import { versionGuardAllows } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
export interface AccountSkillEntry {
  accountId: string;
  skillId: string;
  xp: number;
  readModelVersion: number;
  lastProcessedVersion?: number;
  traceId?: string;
  updatedAt: ReturnType<typeof serverTimestamp>;
}
function skillPath(accountId: string, skillId: string): string
export async function applySkillXpAdded(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
export async function applySkillXpDeducted(
  accountId: string,
  skillId: string,
  newXp: number,
  aggregateVersion?: number,
  traceId?: string
): Promise<void>
```

## File: src/features/skill-xp.slice/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDocs, collection, type QueryDocumentSnapshot } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { OrgSkillRecognitionRecord } from './_org-recognition';
import type { AccountSkillEntry } from './_projector';
import type { OrgSkillTagEntry } from './_tag-pool';
export async function getAccountSkillEntry(
  accountId: string,
  skillId: string
): Promise<AccountSkillEntry | null>
export async function getAccountSkillView(
  accountId: string
): Promise<AccountSkillEntry[]>
export async function getOrgSkillTag(
  orgId: string,
  tagSlug: string
): Promise<OrgSkillTagEntry | null>
export async function getOrgSkillTags(orgId: string): Promise<OrgSkillTagEntry[]>
export async function getSkillRecognition(
  organizationId: string,
  accountId: string,
  skillId: string
): Promise<OrgSkillRecognitionRecord | null>
export async function getMemberSkillRecognitions(
  organizationId: string,
  accountId: string
): Promise<OrgSkillRecognitionRecord[]>
```

## File: src/features/skill-xp.slice/_tag-lifecycle.ts
```typescript
import type {
  TagUpdatedPayload,
  TagDeprecatedPayload,
  TagDeletedPayload,
} from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  type QueryDocumentSnapshot,
} from '@/shared/infra/firestore/firestore.read.adapter';
import {
  syncTagUpdateToPool,
  syncTagDeprecationToPool,
  syncTagDeletionToPool,
} from './_tag-pool';
import type { OrgSkillTagEntry } from './_tag-pool';
async function getOrgsWithTag(tagSlug: string): Promise<string[]>
export async function handleTagUpdatedForPool(
  payload: TagUpdatedPayload
): Promise<void>
export async function handleTagDeprecatedForPool(
  payload: TagDeprecatedPayload
): Promise<void>
export async function handleTagDeletedForPool(
  payload: TagDeletedPayload
): Promise<void>
```

## File: src/features/skill-xp.slice/_tag-pool.ts
```typescript
import type { TagUpdatedPayload, TagDeprecatedPayload, TagDeletedPayload } from '@/features/shared-kernel';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/shared/infra/firestore/firestore.write.adapter';
export interface OrgSkillTagEntry {
  orgId: string;
  tagSlug: string;
  tagName: string;
  refCount: number;
  deprecatedAt?: string;
  addedBy: string;
  addedAt: string;
}
export async function addSkillTagToPool(
  orgId: string,
  tagSlug: string,
  tagName: string,
  addedBy: string
): Promise<void>
export async function removeSkillTagFromPool(
  orgId: string,
  tagSlug: string
): Promise<void>
export async function incrementTagRefCount(
  orgId: string,
  tagSlug: string
): Promise<void>
export async function decrementTagRefCount(
  orgId: string,
  tagSlug: string
): Promise<void>
export async function syncTagUpdateToPool(
  orgId: string,
  payload: TagUpdatedPayload
): Promise<void>
export async function syncTagDeprecationToPool(
  orgId: string,
  payload: TagDeprecatedPayload
): Promise<void>
export async function syncTagDeletionToPool(
  orgId: string,
  payload: TagDeletedPayload
): Promise<void>
```

## File: src/features/skill-xp.slice/index.ts
```typescript

```

## File: src/features/workspace.slice/application/_command-handler.ts
```typescript
import { createTraceContext, logDomainError } from '@/features/observability';
import { evaluatePolicy, type WorkspaceRole } from './_policy-engine';
import { checkWorkspaceAccess } from './_scope-guard';
import { runTransaction, type TransactionContext } from './_transaction-runner';
export interface WorkspaceCommand {
  workspaceId: string;
  userId: string;
  action: string;
}
export interface WorkspaceExecutorResult<T = void> {
  success: boolean;
  value?: T;
  error?: string;
}
export async function executeCommand<T>(
  command: WorkspaceCommand,
  handler: (ctx: TransactionContext) => Promise<T>,
  publish?: (type: string, payload: unknown) => void
): Promise<WorkspaceExecutorResult<T>>
```

## File: src/features/workspace.slice/application/_org-policy-cache.ts
```typescript
import type { OrgPolicyChangedPayload } from '@/features/organization.slice';
import { onOrgEvent } from '@/features/organization.slice';
import { upsertProjectionVersion } from '@/features/projection.bus';
export interface OrgPolicyEntry {
  policyId: string;
  orgId: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedBy: string;
  cachedAt: string;
}
⋮----
export function getCachedOrgPolicy(policyId: string): OrgPolicyEntry | undefined
export function getAllCachedPolicies(): OrgPolicyEntry[]
export function registerOrgPolicyCache(): () => void
export function clearOrgPolicyCache(): void
```

## File: src/features/workspace.slice/application/_outbox.ts
```typescript
import { logDomainError } from '@/features/observability';
import { buildIdempotencyKey, type DlqTier } from '@/features/shared-kernel';
import { setDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type {
  WorkspaceEventName,
  WorkspaceEventPayloadMap,
} from '../core.event-bus';
export type OutboxEvent = {
  [K in WorkspaceEventName]: { type: K; payload: WorkspaceEventPayloadMap[K] };
}[WorkspaceEventName];
export interface Outbox {
  collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]): void;
  flush(publish: (type: string, payload: unknown) => void): void;
  drain(): OutboxEvent[];
}
⋮----
collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T]): void;
flush(publish: (type: string, payload: unknown)
drain(): OutboxEvent[];
⋮----
interface WsOutboxDocument {
  outboxId: string;
  eventType: WorkspaceEventName;
  envelopeJson: string;
  lane: typeof WS_OUTBOX_IER_LANE;
  dlqTier: DlqTier;
  idempotencyKey: string;
  status: 'pending';
  createdAt: string;
  attemptCount: 0;
}
function extractTraceIdFromPayload(payload: unknown): string | undefined
async function persistToWsOutbox(
  event: OutboxEvent,
  workspaceId: string,
): Promise<void>
export async function persistWorkspaceOutboxEvent<T extends WorkspaceEventName>(
  workspaceId: string,
  type: T,
  payload: WorkspaceEventPayloadMap[T],
): Promise<void>
export function createOutbox(workspaceId?: string): Outbox
⋮----
collect<T extends WorkspaceEventName>(type: T, payload: WorkspaceEventPayloadMap[T])
flush(publish: (type: string, payload: unknown) => void)
drain()
```

## File: src/features/workspace.slice/application/_policy-engine.ts
```typescript
export type WorkspaceRole = 'Manager' | 'Contributor' | 'Viewer';
export interface PolicyDecision {
  permitted: boolean;
  reason?: string;
}
⋮----
export function evaluatePolicy(role: WorkspaceRole, action: string): PolicyDecision
```

## File: src/features/workspace.slice/application/_scope-guard.ts
```typescript
import { queryWorkspaceAccess } from '@/features/projection.bus';
export interface ScopeGuardResult {
  allowed: boolean;
  role?: string;
  reason?: string;
}
export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<ScopeGuardResult>
```

## File: src/features/workspace.slice/application/_transaction-runner.ts
```typescript
import { generateTraceId, logDomainError } from '@/features/observability';
import { appendDomainEvent } from '../core.event-store';
import { createOutbox, type Outbox, type OutboxEvent } from './_outbox';
export interface TransactionContext {
  workspaceId: string;
  correlationId: string;
  outbox: Outbox;
}
export interface TransactionResult<T> {
  value: T;
  events: OutboxEvent[];
}
export async function runTransaction<T>(
  workspaceId: string,
  userId: string,
  handler: (ctx: TransactionContext) => Promise<T>,
  correlationId?: string
): Promise<TransactionResult<T>>
```

## File: src/features/workspace.slice/application/index.ts
```typescript

```

## File: src/features/workspace.slice/business.acceptance/index.ts
```typescript

```

## File: src/features/workspace.slice/business.daily/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared-kernel";
import {
  toggleDailyLogLike,
  addDailyLogComment as addDailyLogCommentFacade,
} from "@/shared/infra/firestore/firestore.facade";
export async function toggleLike(
  accountId: string,
  logId: string,
  userId: string
): Promise<CommandResult>
export async function addDailyLogComment(
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<CommandResult>
```

## File: src/features/workspace.slice/business.daily/_bookmark-actions.ts
```typescript
import {
  addBookmark,
  removeBookmark,
} from "@/shared/infra/firestore/firestore.facade"
export async function toggleBookmark(
  userId: string,
  logId: string,
  shouldBookmark: boolean
): Promise<void>
```

## File: src/features/workspace.slice/business.daily/_components/actions/comment-button.tsx
```typescript
import { MessageCircle } from "lucide-react";
import { Button } from "@/shared/shadcn-ui/button";
interface CommentButtonProps {
  count?: number;
  onClick: () => void;
}
```

## File: src/features/workspace.slice/business.daily/_components/composer.tsx
```typescript
import { ImagePlusIcon, Send, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/shared/shadcn-ui/button";
import { Card } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Textarea } from "@/shared/shadcn-ui/textarea";
interface DailyLogComposerProps {
  content: string;
  setContent: (content: string) => void;
  photos: File[];
  setPhotos: (photos: File[] | ((prev: File[]) => File[])) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}
⋮----
const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
const handleRemovePhoto = (index: number) =>
⋮----
<Image src=
⋮----
onClick=
```

## File: src/features/workspace.slice/business.daily/_components/daily-log-card.tsx
```typescript
import { useEffect, useState } from "react";
import type { Timestamp } from "@/shared/ports";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Card } from "@/shared/shadcn-ui/card";
import { type DailyLog, type Account } from "@/shared/types";
import { BookmarkButton } from "./actions/bookmark-button";
import { CommentButton } from "./actions/comment-button";
import { LikeButton } from "./actions/like-button";
import { ImageCarousel } from "./image-carousel";
function WorkspaceAvatar(
function TimeAgo(
⋮----
const update = () =>
⋮----
interface DailyLogCardProps {
  log: DailyLog;
  currentUser: Account | null;
  onOpen: () => void;
}
```

## File: src/features/workspace.slice/business.daily/_components/daily.account-view.tsx
```typescript
import { AlertCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import type { DailyLog } from "@/shared/types";
import { WorkspaceProvider } from "../../core";
import { useAggregatedLogs } from "../_hooks/use-aggregated-logs";
import { DailyLogCard } from "./daily-log-card";
import { DailyLogDialog } from "./daily-log-dialog";
⋮----
onOpen=
```

## File: src/features/workspace.slice/business.daily/_components/daily.view.tsx
```typescript
import { AccountDailyComponent } from "./daily.account-view";
export default function AccountDailyView()
```

## File: src/features/workspace.slice/business.daily/_components/daily.workspace-view.tsx
```typescript
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../../core";
import { useWorkspaceDailyLog } from "../_hooks/use-workspace-daily";
import { DailyLogComposer } from "./composer";
import { DailyLogCard } from "./daily-log-card";
⋮----
router.push(
```

## File: src/features/workspace.slice/business.daily/_components/image-carousel.tsx
```typescript
import Image from "next/image";
import { Card, CardContent } from "@/shared/shadcn-ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/shadcn-ui/carousel";
interface ImageCarouselProps {
    images: string[];
}
```

## File: src/features/workspace.slice/business.daily/_hooks/use-aggregated-logs.ts
```typescript
import { useMemo } from "react";
import type { DailyLog } from "@/shared/types";
import { useAccount } from "../../core";
export function useAggregatedLogs()
```

## File: src/features/workspace.slice/business.daily/_hooks/use-daily-upload.ts
```typescript
import { useState, useCallback } from "react";
import { useStorage } from "../../business.files";
import { useWorkspace } from "../../core";
export function useDailyUpload()
```

## File: src/features/workspace.slice/business.daily/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { getDailyLogs as getDailyLogsFacade } from "@/shared/infra/firestore/firestore.facade";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "@/shared/infra/firestore/firestore.read.adapter";
import type { DailyLog, DailyLogComment } from "@/shared/types";
export async function getDailyLogs(
  accountId: string,
  limit = 30
): Promise<DailyLog[]>
export function subscribeToDailyLogComments(
  accountId: string,
  logId: string,
  onUpdate: (comments: DailyLogComment[]) => void,
): Unsubscribe
export function subscribeToBookmarks(
  userId: string,
  onUpdate: (bookmarkedIds: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe
```

## File: src/features/workspace.slice/business.document-parser/_form-actions.ts
```typescript
import { z } from 'zod';
import { extractInvoiceItems } from '@/app-runtime/ai/flows/extract-invoice-items';
import type { WorkItem } from '@/app-runtime/ai/schemas/docu-parse';
⋮----
function isAllowedStorageUrl(url: string): boolean
export type ActionState = {
  data?: { workItems: WorkItem[] };
  error?: string;
  fileName?: string;
};
export async function extractDataFromDocument(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState>
⋮----
const toNum = (v: unknown, fallback: number): number =>
⋮----
// quantity 0 is invalid for an invoice line — default to 1
⋮----
// 0 is a valid price (e.g. free/fully-discounted) — only fall back when null/undefined
⋮----
// [SEC-1] Log a safe message only — do not log the raw error object which
// may expose internal AI model details or stack traces to server logs.
```

## File: src/features/workspace.slice/business.files/_actions.ts
```typescript
import {
  type CommandResult,
  commandFailureFrom,
  commandSuccess,
} from '@/features/shared-kernel';
import {
  createWorkspaceFile as createFileFacade,
  addWorkspaceFileVersion as addVersionFacade,
  restoreWorkspaceFileVersion as restoreVersionFacade,
} from '@/shared/infra/firestore/firestore.facade';
import { serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkspaceFile, WorkspaceFileVersion } from '@/shared/types';
export type CreateWorkspaceFileInput = Omit<WorkspaceFile, 'id' | 'updatedAt'>;
export async function createWorkspaceFile(
  workspaceId: string,
  fileData: CreateWorkspaceFileInput
): Promise<CommandResult>
export async function addWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<CommandResult>
export async function restoreWorkspaceFileVersion(
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<CommandResult>
```

## File: src/features/workspace.slice/business.files/_hooks/use-storage.ts
```typescript
import { useCallback } from 'react';
import { useApp } from '@/shared/app-providers/app-context';
import {
  uploadDailyPhoto as uploadDailyPhotoAction,
  uploadTaskAttachment as uploadTaskAttachmentAction,
} from '../_storage-actions';
export function useStorage(workspaceId: string)
```

## File: src/features/workspace.slice/business.files/_hooks/use-workspace-filters.ts
```typescript
import { useMemo, useDeferredValue } from "react";
import type { Workspace } from "@/shared/types";
export function useWorkspaceFilters(
  workspaces: Workspace[],
  searchQuery: string
)
```

## File: src/features/workspace.slice/business.files/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { getWorkspaceFiles as getWorkspaceFilesFacade } from '@/shared/infra/firestore/firestore.facade';
import { collection, query, orderBy, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import type { WorkspaceFile } from '@/shared/types';
export function subscribeToWorkspaceFiles(
  workspaceId: string,
  onUpdate: (files: WorkspaceFile[]) => void
): Unsubscribe
export async function getWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]>
```

## File: src/features/workspace.slice/business.files/_storage-actions.ts
```typescript
import {
  uploadDailyPhoto as uploadDailyPhotoFacade,
  uploadTaskAttachment as uploadTaskAttachmentFacade,
  uploadProfilePicture as uploadProfilePictureFacade,
  uploadWorkspaceDocument,
} from "@/shared/infra/storage/storage.facade"
export async function uploadDailyPhoto(
  accountId: string,
  workspaceId: string,
  file: File
): Promise<string>
export async function uploadTaskAttachment(
  workspaceId: string,
  file: File
): Promise<string>
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string>
export async function uploadRawFile(
  workspaceId: string,
  fileId: string,
  versionId: string,
  file: File
): Promise<string>
```

## File: src/features/workspace.slice/business.finance/index.ts
```typescript

```

## File: src/features/workspace.slice/business.parsing-intent/index.ts
```typescript

```

## File: src/features/workspace.slice/business.quality-assurance/index.ts
```typescript

```

## File: src/features/workspace.slice/business.tasks/_queries.ts
```typescript
import {
  getWorkspaceTasks as getWorkspaceTasksFacade,
  getWorkspaceTask as getWorkspaceTaskFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { WorkspaceTask } from "@/shared/types";
export async function getWorkspaceTasks(
  workspaceId: string
): Promise<WorkspaceTask[]>
export async function getWorkspaceTask(
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null>
```

## File: src/features/workspace.slice/business.workflow/_aggregate.ts
```typescript
export type WorkflowStage =
  | 'draft'
  | 'in-progress'
  | 'quality-assurance'
  | 'acceptance'
  | 'finance'
  | 'completed';
export interface WorkflowAggregateState {
  workflowId: string;
  workspaceId: string;
  stage: WorkflowStage;
  blockedBy: string[];
  version: number;
  updatedAt: number;
}
⋮----
export function createWorkflowAggregate(
  workspaceId: string,
  workflowId: string
): WorkflowAggregateState
export function canAdvanceWorkflowStage(
  current: WorkflowStage,
  next: WorkflowStage
): boolean
export function advanceWorkflowStage(
  state: WorkflowAggregateState,
  next: WorkflowStage
): WorkflowAggregateState
export function blockWorkflow(
  state: WorkflowAggregateState,
  issueId: string
): WorkflowAggregateState
export function unblockWorkflow(
  state: WorkflowAggregateState,
  resolvedIssueId: string
): WorkflowAggregateState
export function isWorkflowUnblocked(state: WorkflowAggregateState): boolean
```

## File: src/features/workspace.slice/core.event-bus/_bus.ts
```typescript
import { recordEventPublished } from "@/features/observability"
import type { ImplementsEventEnvelopeContract } from '@/features/shared-kernel'
import type {
  WorkspaceEventName,
  WorkspaceEventHandler,
  PublishFn,
  SubscribeFn,
  WorkspaceEventPayloadMap,
} from "./_events"
type HandlerRegistry = Map<WorkspaceEventName, WorkspaceEventHandler<WorkspaceEventName>[]>
export class WorkspaceEventBus implements ImplementsEventEnvelopeContract
readonly implementsEventEnvelope = true as const;
⋮----
constructor()
```

## File: src/features/workspace.slice/core.event-bus/_event-funnel.ts
```typescript

```

## File: src/features/workspace.slice/core.event-bus/index.ts
```typescript

```

## File: src/features/workspace.slice/core.event-store/_store.ts
```typescript
import {
  appendDomainEvent as appendDomainEventRepo,
  getDomainEvents as getDomainEventsRepo,
  type StoredWorkspaceEvent,
} from '@/shared/infra/firestore/firestore.facade';
⋮----
export async function appendDomainEvent(
  workspaceId: string,
  event: Omit<StoredWorkspaceEvent, 'id' | 'occurredAt'>
): Promise<string>
export async function getDomainEvents(
  workspaceId: string
): Promise<StoredWorkspaceEvent[]>
```

## File: src/features/workspace.slice/core.event-store/index.ts
```typescript

```

## File: src/features/workspace.slice/core/_components/account-provider.tsx
```typescript
import type React from 'react';
import {type ReactNode} from 'react';
import { createContext, useReducer, useEffect } from 'react';
import type { ScheduleItem } from '@/features/shared-kernel';
import { type Workspace, type DailyLog, type AuditLog, type PartnerInvite } from '@/shared/types';
import { useApp } from '../_hooks/use-app';
import {
  subscribeToDailyLogsForAccount,
  subscribeToAuditLogsForAccount,
  subscribeToInvitesForAccount,
  subscribeToScheduleItemsForAccount,
  subscribeToWorkspacesForAccount,
} from '../_queries';
interface AccountState {
  workspaces: Record<string, Workspace>;
  dailyLogs: Record<string, DailyLog>;
  auditLogs: Record<string, AuditLog>;
  invites: Record<string, PartnerInvite>;
  schedule_items: Record<string, ScheduleItem>;
}
type Action =
  | { type: 'SET_WORKSPACES'; payload: Record<string, Workspace> }
  | { type: 'SET_DAILY_LOGS'; payload: Record<string, DailyLog> }
  | { type: 'SET_AUDIT_LOGS'; payload: Record<string, AuditLog> }
  | { type: 'SET_INVITES'; payload: Record<string, PartnerInvite> }
  | { type: 'SET_SCHEDULE_ITEMS'; payload: Record<string, ScheduleItem> }
  | { type: 'RESET_STATE' };
⋮----
const accountReducer = (state: AccountState, action: Action): AccountState =>
⋮----
export const AccountProvider = (
```

## File: src/features/workspace.slice/core/_components/app-provider.tsx
```typescript

```

## File: src/features/workspace.slice/core/_components/create-workspace-dialog.tsx
```typescript
import { useState } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { useApp } from "../_hooks/use-app";
import { handleCreateWorkspace } from "../_use-cases";
interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
⋮----
const onCreate = async () =>
```

## File: src/features/workspace.slice/core/_components/dashboard-view.tsx
```typescript
import { User as UserIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { PermissionTree } from "@/features/account.slice"
import { AccountGrid } from "@/features/organization.slice"
import { useAuth } from "@/shared/app-providers/auth-provider"
import { Badge } from "@/shared/shadcn-ui/badge"
import { PageHeader } from "@/shared/ui/page-header"
import { useApp } from "../_hooks/use-app"
import { useVisibleWorkspaces } from "../_hooks/use-visible-workspaces"
import { StatCards } from "./stat-cards"
import { WorkspaceList } from "./workspace-list"
```

## File: src/features/workspace.slice/core/_components/shell/dashboard-sidebar.tsx
```typescript
import { usePathname } from 'next/navigation';
import { useI18n } from "@/config/i18n/i18n-provider";
import { useUser } from "@/features/account.slice";
import { useOrganizationManagement } from "@/features/organization.slice";
import { useAuth } from "@/shared/app-providers/auth-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarSeparator,
} from "@/shared/shadcn-ui/sidebar";
import { useApp } from "../../_hooks/use-app";
import { useVisibleWorkspaces } from "../../_hooks/use-visible-workspaces";
import { AccountSwitcher } from "./account-switcher";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavWorkspaces } from "./nav-workspaces";
```

## File: src/features/workspace.slice/core/_components/shell/header.tsx
```typescript
import { Search, Command } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GlobalSearch } from "@/features/global-search.slice";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/shadcn-ui/breadcrumb";
import { Button } from "@/shared/shadcn-ui/button";
import { Separator } from "@/shared/shadcn-ui/separator";
import { SidebarTrigger } from "@/shared/shadcn-ui/sidebar";
import type { Account } from '@/shared/types'
import { useApp } from "../../_hooks/use-app";
import { useVisibleWorkspaces } from '../../_hooks/use-visible-workspaces';
import { NotificationCenter } from "./notification-center";
⋮----
function usePageBreadcrumbs(pathname: string)
⋮----
const down = (e: KeyboardEvent) =>
⋮----
const handleSwitchOrganization = (organization: Account) =>
```

## File: src/features/workspace.slice/core/_components/shell/nav-workspaces.tsx
```typescript
import { Terminal } from "lucide-react";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/shared/shadcn-ui/sidebar";
import type { Workspace } from "@/shared/types";
interface NavWorkspacesProps {
  workspaces: Workspace[];
  pathname: string;
  t: (key: string) => string;
}
```

## File: src/features/workspace.slice/core/_components/shell/notification-center.tsx
```typescript
import { Bell, Trash2, Check } from "lucide-react";
import { Button } from "@/shared/shadcn-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { type Notification } from "@/shared/types";
import type { AppAction } from '../app-provider'
interface NotificationCenterProps {
  notifications: Notification[];
  dispatch: React.Dispatch<AppAction>;
}
```

## File: src/features/workspace.slice/core/_components/stat-cards.tsx
```typescript
import { ShieldCheck, Activity, Layers, Zap } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Progress } from "@/shared/shadcn-ui/progress";
import { useAccount } from "../_hooks/use-account";
import { useApp } from "../_hooks/use-app";
export function StatCards()
```

## File: src/features/workspace.slice/core/_components/workspace-grid-view.tsx
```typescript
import type { Workspace } from "@/shared/types";
import { WorkspaceCard } from "./workspace-card";
interface WorkspaceGridViewProps {
  workspaces: Workspace[];
}
export function WorkspaceGridView(
```

## File: src/features/workspace.slice/core/_components/workspace-list-header.tsx
```typescript
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/config/i18n/i18n-provider";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
import { Input } from "@/shared/shadcn-ui/input";
import { PageHeader } from "@/shared/ui/page-header";
interface WorkspaceListHeaderProps {
  activeAccountName: string;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}
⋮----
title=
⋮----
placeholder=
⋮----
onChange=
```

## File: src/features/workspace.slice/core/_components/workspace-list.tsx
```typescript
import { Eye, EyeOff, Shield, Trash2, ArrowUpRight, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { type Workspace } from "@/shared/types";
interface WorkspaceListItemProps {
  workspace: Workspace;
  onDelete?: (id: string) => void;
}
⋮----
<span className="text-[10px] text-muted-foreground">ID:
⋮----
onClick=
```

## File: src/features/workspace.slice/core/_components/workspace-nav-tabs.tsx
```typescript
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { useMemo } from "react"
import type { Capability } from "@/shared/types"
import { useApp } from "../_hooks/use-app"
import { useWorkspace } from "./workspace-provider";
⋮----
interface WorkspaceNavTabsProps {
  workspaceId: string
}
```

## File: src/features/workspace.slice/core/_components/workspace-table-view.tsx
```typescript
import { Eye, EyeOff, Shield, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import type { Workspace } from "@/shared/types";
interface WorkspaceListItemProps {
  workspace: Workspace;
}
⋮----
ID:
```

## File: src/features/workspace.slice/core/_components/workspaces-view.tsx
```typescript
import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/shadcn-ui/button";
import { useWorkspaceFilters } from "../../business.files/_hooks/use-workspace-filters";
import { useApp } from "../_hooks/use-app";
import { useVisibleWorkspaces } from "../_hooks/use-visible-workspaces";
import { WorkspaceGridView } from "./workspace-grid-view";
import { WorkspaceListHeader } from "./workspace-list-header";
import { WorkspaceTableView } from "./workspace-table-view";
```

## File: src/features/workspace.slice/core/_hooks/use-account.ts
```typescript
import { useContext } from 'react';
import { AccountContext } from '../_components/account-provider';
export const useAccount = () =>
```

## File: src/features/workspace.slice/core/_hooks/use-app.ts
```typescript

```

## File: src/features/workspace.slice/core/_shell/account-create-dialog.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/account-switcher.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/dashboard-sidebar.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/header.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/nav-main.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/nav-user.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/nav-workspaces.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/notification-center.tsx
```typescript

```

## File: src/features/workspace.slice/core/_shell/theme-adapter.tsx
```typescript

```

## File: src/features/workspace.slice/gov.audit-convergence/_bridge.ts
```typescript
export interface AuditConvergenceInput {
  accountId: string;
  workspaceId?: string;
  limit?: number;
}
export interface AuditProjectionQuery {
  accountId: string;
  workspaceId?: string;
  limit: number;
}
⋮----
function normalizeAuditLimit(limit?: number): number
export function toAuditProjectionQuery(
  input: AuditConvergenceInput
): AuditProjectionQuery
```

## File: src/features/workspace.slice/gov.audit-convergence/index.ts
```typescript

```

## File: src/features/workspace.slice/gov.audit/_actions.ts
```typescript
import { commandSuccess, commandFailureFrom } from '@/features/shared-kernel';
import type { CommandResult } from '@/features/shared-kernel';
import { addDocument, serverTimestamp } from '@/shared/infra/firestore/firestore.write.adapter';
import type { AuditLog } from '@/shared/types';
export interface WriteAuditLogInput {
  accountId: string;
  actor: string;
  action: string;
  target: string;
  type: AuditLog['type'];
  workspaceId?: string;
}
export async function writeAuditLog(input: WriteAuditLogInput): Promise<CommandResult>
export interface WriteDailyLogInput {
  accountId: string;
  content: string;
  author: { uid: string; name: string; avatarUrl: string };
  workspaceId?: string;
  workspaceName?: string;
  photoURLs?: string[];
}
export async function writeDailyLog(input: WriteDailyLogInput): Promise<CommandResult>
```

## File: src/features/workspace.slice/gov.audit/_components/audit-detail-sheet.tsx
```typescript
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/shadcn-ui/sheet";
import { type AuditLog } from "@/shared/types";
interface AuditDetailSheetProps {
    log: AuditLog | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}
export function AuditDetailSheet(
```

## File: src/features/workspace.slice/gov.audit/_components/audit-type-icon.tsx
```typescript
import { Zap, Shield, Activity, Terminal } from "lucide-react";
import { type AuditLog } from "@/shared/types";
interface AuditTypeIconProps {
    type: AuditLog['type'];
}
export function AuditTypeIcon(
```

## File: src/features/workspace.slice/gov.audit/_components/audit.account-view.tsx
```typescript
import { AlertCircle, Terminal } from "lucide-react";
import { useAccountAudit } from "../_hooks/use-account-audit";
import { AuditDetailSheet } from "./audit-detail-sheet";
import { AuditEventItem } from "./audit-event-item";
import { AuditTimeline } from "./audit-timeline";
```

## File: src/features/workspace.slice/gov.audit/_components/audit.view.tsx
```typescript
import { AccountAuditComponent } from "./audit.account-view";
export default function AccountAuditView()
```

## File: src/features/workspace.slice/gov.audit/_components/audit.workspace-view.tsx
```typescript
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { useWorkspaceAudit } from "../_hooks/use-workspace-audit";
import { AuditDetailSheet } from "./audit-detail-sheet";
import { AuditTypeIcon } from "./audit-type-icon";
⋮----
onOpenChange={(open) => { if (!open) clearSelection(); }}
      />
    </div>
  );
```

## File: src/features/workspace.slice/gov.audit/_hooks/use-account-audit.ts
```typescript
import { useMemo, useState } from "react";
import { useApp } from "@/shared/app-providers/app-context";
import { type AuditLog } from "@/shared/types";
import { useAccount } from "../../core";
export function useAccountAudit()
```

## File: src/features/workspace.slice/gov.audit/_hooks/use-logger.ts
```typescript
import { useCallback } from "react";
import { useApp } from "@/shared/app-providers/app-context";
import type { AuditLog, Account } from "@/shared/types";
import { writeDailyLog, writeAuditLog } from '../_actions';
export function useLogger(workspaceId?: string, workspaceName?: string)
⋮----
avatarUrl: '', // populated at display time from the user's profile photo URL
```

## File: src/features/workspace.slice/gov.audit/_hooks/use-workspace-audit.ts
```typescript
import { useState } from "react";
import { type AuditLog } from "@/shared/types";
import { useWorkspace } from "../../core";
export function useWorkspaceAudit()
```

## File: src/features/workspace.slice/gov.audit/_queries.ts
```typescript
import {
  getAuditLogs as getAuditLogsFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { AuditLog } from "@/shared/types"
export async function getAuditLogs(
  accountId: string,
  workspaceId?: string,
  limit = 50
): Promise<AuditLog[]>
```

## File: src/features/workspace.slice/gov.members/_queries.ts
```typescript
import {
  getWorkspaceGrants as getWorkspaceGrantsFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { WorkspaceGrant } from "@/shared/types"
export async function getWorkspaceGrants(
  workspaceId: string
): Promise<WorkspaceGrant[]>
```

## File: src/features/workspace.slice/gov.members/index.ts
```typescript

```

## File: src/features/workspace.slice/gov.partners/index.ts
```typescript

```

## File: src/features/workspace.slice/gov.role/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  grantIndividualWorkspaceAccess,
  revokeIndividualWorkspaceAccess,
} from '@/shared/infra/firestore/firestore.facade';
import type { WorkspaceRole } from '@/shared/types';
export interface AssignWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  protocol?: string;
}
export interface RevokeWorkspaceRoleInput {
  workspaceId: string;
  userId: string;
}
export async function assignWorkspaceRole(input: AssignWorkspaceRoleInput): Promise<CommandResult>
export async function revokeWorkspaceRole(input: RevokeWorkspaceRoleInput): Promise<CommandResult>
```

## File: src/features/workspace.slice/gov.role/_hooks/use-workspace-role.ts
```typescript
import { useState, useEffect } from 'react';
import type { WorkspaceGrant } from '@/shared/types';
import { getWorkspaceGrant } from '../_queries';
export function useWorkspaceRole(workspaceId: string | null, userId: string | null)
```

## File: src/features/workspace.slice/gov.role/_queries.ts
```typescript
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import type { Workspace, WorkspaceGrant } from '@/shared/types';
export async function getWorkspaceGrant(
  workspaceId: string,
  userId: string
): Promise<WorkspaceGrant | null>
export async function getWorkspaceGrants(workspaceId: string): Promise<WorkspaceGrant[]>
```

## File: src/features/workspace.slice/gov.teams/index.ts
```typescript

```

## File: src/shared-infra/firebase/.firebaserc
```
{
  "projects": {
    "default": "xuanwu-i-00708880-4e2d8"
  }
}
```

## File: src/shared-infra/firebase/firebase.json
```json
{
  "firestore": {
    "database": "(default)",
    "location": "asia-east1",
    "rules": "firestore/firestore.rules",
    "indexes": "firestore/firestore.indexes.json"
  },
  "storage": {
    "rules": "storage/storage.rules"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "i18n": {
      "root": "/localized-files"
    },
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix functions run lint",
        "npm --prefix functions run build"
      ]
    }
  ]
}
```

## File: src/shared-infra/firebase/firestore/firestore.rules
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## File: src/shared-infra/firebase/functions/.eslintrc.js
```javascript

```

## File: src/shared-infra/firebase/functions/.gitignore
```
# Compiled JavaScript files
lib/**/*.js
lib/**/*.js.map

# TypeScript v1 declaration files
typings/

# Node.js dependency directory
node_modules/
*.local
```

## File: src/shared-infra/firebase/functions/package.json
```json
{
  "name": "functions",
  "scripts": {
    "lint": "echo \"skip lint\"",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "22"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^13.6.0",
    "firebase-functions": "^7.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "firebase-functions-test": "^3.4.1",
    "typescript": "^5.7.3"
  },
  "private": true
}
```

## File: src/shared-infra/firebase/functions/src/claims/claims-refresh.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
⋮----
interface ClaimsRefreshPayload {
  readonly userId: string;
  readonly orgId?: string;
  readonly roles?: string[];
  readonly scopes?: string[];
}
```

## File: src/shared-infra/firebase/functions/src/dlq/dlq-block.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqBlockRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly traceId: string;
  readonly [key: string]: unknown;
}
```

## File: src/shared-infra/firebase/functions/src/dlq/dlq-review.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqReviewRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId?: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
```

## File: src/shared-infra/firebase/functions/src/dlq/dlq-safe.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface DlqSafeRecord {
  readonly eventId: string;
  readonly traceId: string;
  readonly idempotencyKey: string;
  readonly [key: string]: unknown;
}
⋮----
function sleep(ms: number): Promise<void>
```

## File: src/shared-infra/firebase/functions/src/gateway/command-gateway.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
interface CommandSuccess {
  readonly success: true;
  readonly aggregateId: string;
  readonly version: number;
}
interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly aggregateId?: string;
}
interface CommandFailure {
  readonly success: false;
  readonly error: DomainError;
}
type CommandResult = CommandSuccess | CommandFailure;
⋮----
function checkRateLimit(key: string): boolean
```

## File: src/shared-infra/firebase/functions/src/gateway/webhook.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { randomUUID } from "crypto";
```

## File: src/shared-infra/firebase/functions/src/ier/background.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/firebase/functions/src/ier/critical.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/firebase/functions/src/ier/ier.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
⋮----
export function resolveLane(
  eventType: string
): "CRITICAL" | "STANDARD" | "BACKGROUND"
```

## File: src/shared-infra/firebase/functions/src/ier/standard.lane.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import type { EventEnvelope } from "../types.js";
```

## File: src/shared-infra/firebase/functions/src/index.ts
```typescript
import { initializeApp, getApps } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
```

## File: src/shared-infra/firebase/functions/src/observability/domain-errors.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
type ErrorLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";
type ErrorSource =
  | "WS_TX_RUNNER"
  | "SCHEDULE_SAGA"
  | "DLQ_SECURITY_BLOCK"
  | "STALE_TAG_WARNING"
  | "TOKEN_REFRESH_FAILURE"
  | "GENERIC";
interface DomainErrorEvent {
  readonly level: ErrorLevel;
  readonly source: ErrorSource;
  readonly traceId?: string;
  readonly aggregateId?: string;
  readonly eventType?: string;
  readonly message: string;
  readonly details?: unknown;
}
```

## File: src/shared-infra/firebase/functions/src/observability/domain-metrics.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
⋮----
interface MetricEvent {
  readonly metricType:
    | "IER_THROUGHPUT"
    | "IER_LATENCY"
    | "FUNNEL_PROCESSING"
    | "RELAY_LAG"
    | "RATE_LIMIT_HIT"
    | "CIRCUIT_OPEN"
    | "CIRCUIT_HALF_OPEN"
    | "CLAIMS_REFRESH_SUCCESS";
  readonly lane?: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly traceId?: string;
  readonly valueMs?: number;
  readonly labels?: Record<string, string>;
}
```

## File: src/shared-infra/firebase/functions/src/projection/critical-proj.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
} from "../staleness-contract.js";
```

## File: src/shared-infra/firebase/functions/src/projection/event-funnel.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_CRITICAL_MS,
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
⋮----
async function applyVersionGuard(
  db: FirebaseFirestore.Firestore,
  viewCollection: string,
  aggregateId: string,
  incomingVersion: number
): Promise<boolean>
⋮----
interface ProjectionTarget {
  viewCollection: string;
  lane: "CRITICAL" | "STANDARD";
}
function resolveProjectionTarget(eventType: string): ProjectionTarget | null
function buildProjectionUpdate(envelope: EventEnvelope): Record<string, unknown>
function checkSla(lane: "CRITICAL" | "STANDARD", processingMs: number): boolean
```

## File: src/shared-infra/firebase/functions/src/projection/standard-proj.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import {
  PROJ_STALE_STANDARD_MS,
} from "../staleness-contract.js";
```

## File: src/shared-infra/firebase/functions/src/relay/outbox-relay.fn.ts
```typescript
import { onRequest } from "firebase-functions/v2/https";
⋮----
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import type { EventEnvelope } from "../types.js";
import { dlqCollectionName } from "../types.js";
⋮----
interface OutboxRecord extends EventEnvelope {
  deliveryAttempts: number;
  lastAttemptAt?: Timestamp;
  status: "PENDING" | "DELIVERED" | "FAILED";
}
⋮----
async function deliverToIer(record: OutboxRecord): Promise<void>
async function moveToDlq(
  db: FirebaseFirestore.Firestore,
  record: OutboxRecord,
  error: unknown
): Promise<void>
function getDlqProcessorUrl(dlqTier: string): string | null
function sleep(ms: number): Promise<void>
```

## File: src/shared-infra/firebase/functions/src/staleness-contract.ts
```typescript

```

## File: src/shared-infra/firebase/functions/src/types.ts
```typescript
import { Timestamp } from "firebase-admin/firestore";
export interface EventEnvelope {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
  readonly traceId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly idempotencyKey: string;
  readonly lane: "CRITICAL" | "STANDARD" | "BACKGROUND";
  readonly dlqTier: "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
  readonly createdAt: Timestamp;
}
export type DlqTier = "SAFE_AUTO" | "REVIEW_REQUIRED" | "SECURITY_BLOCK";
export function dlqCollectionName(tier: DlqTier): string
```

## File: src/shared-infra/firebase/functions/tsconfig.dev.json
```json
{
  "include": [
    ".eslintrc.js"
  ]
}
```

## File: src/shared-infra/firebase/functions/tsconfig.json
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "esModuleInterop": true,
    "moduleResolution": "nodenext",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

## File: src/shared-infra/firebase/storage/storage.rules
```
rules_version = '2';

// Craft rules based on data in your Firestore database
// allow write: if firestore.get(
//    /databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin;
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## File: src/shared-infra/README.MD
```markdown
放置外部基礎設施適配器：資料庫、第三方 SDK、網路存取層，需透過 ports 封裝。
只允許向下依賴；向上 import 為架構違規。
```

## File: src/shared/app-providers/_queries.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  onSnapshot,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type { Account } from '@/shared/types';
export function subscribeToAccountsForUser(
  userId: string,
  onUpdate: (accounts: Record<string, Account>) => void,
): Unsubscribe
```

## File: src/shared/app-providers/app-context.tsx
```typescript
import type React from 'react'
import { type ReactNode, createContext, useReducer, useEffect } from 'react'
import { useContext } from 'react'
import { type Account, type CapabilitySpec, type Notification } from '@/shared/types'
import { subscribeToAccountsForUser } from './_queries'
import { useAuth } from './auth-provider'
export interface AppState {
  accounts: Record<string, Account>
  activeAccount: Account | null
  notifications: Notification[]
  capabilitySpecs: CapabilitySpec[]
  scheduleTaskRequest: { taskName: string; workspaceId: string } | null
}
export type AppAction =
  | { type: 'SET_ACCOUNTS'; payload: { accounts: Record<string, Account>; user: Account } }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: Account | null }
  | { type: 'RESET_STATE' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'REQUEST_SCHEDULE_TASK'; payload: { taskName: string; workspaceId: string } }
  | { type: 'CLEAR_SCHEDULE_TASK_REQUEST' }
⋮----
function appReducer(state: AppState, action: AppAction): AppState
```

## File: src/shared/app-providers/auth-provider.tsx
```typescript
import { type User as FirebaseUser } from "firebase/auth";
import type React from 'react';
import {type ReactNode} from 'react';
import { createContext, useReducer, useContext, useEffect } from 'react';
import { authAdapter } from '@/shared/infra/auth/auth.adapter';
import { type Account } from '@/shared/types';
interface AuthState {
  user: Account | null;
  authInitialized: boolean;
}
type Action =
  | { type: 'SET_AUTH_STATE'; payload: { user: Account | null, initialized: boolean } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<Account> };
const authReducer = (state: AuthState, action: Action): AuthState =>
⋮----
export const AuthProvider = (
⋮----
const logout = async () =>
⋮----
export const useAuth = () =>
```

## File: src/shared/app-providers/firebase-provider.tsx
```typescript
import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';
import { createContext, useContext, type ReactNode } from 'react';
import { app } from '@/shared/infra/app.client';
import { auth } from '@/shared/infra/auth/auth.client';
import { db } from '@/shared/infra/firestore/firestore.client';
import { storage } from '@/shared/infra/storage/storage.client';
interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}
⋮----
export function FirebaseClientProvider(
export const useFirebase = () =>
```

## File: src/shared/app-providers/theme-provider.tsx
```typescript
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
export function ThemeProvider(
```

## File: src/shared/constants/location-units.ts
```typescript
export type LocationUnitKey =
  | 'dong'
  | 'lou'
  | 'qu'
  | 'shi'
  | 'hao'
  | 'chang'
  | 'cang'
  | 'qi'
  | 'zuo'
  | 'jidi'
  | 'zhu';
export interface LocationUnitMeta {
  key: LocationUnitKey;
  zhLabel: string;
  enLabel: string;
  description: string;
  example: string;
}
⋮----
export function findLocationUnit(key: string): LocationUnitMeta | undefined
```

## File: src/shared/constants/roles.ts
```typescript
import type { OrganizationRole } from '@/shared/types/account.types';
import type { WorkspaceRole } from '@/shared/types/workspace.types';
⋮----
export interface OrgRoleMeta {
  role: OrganizationRole;
  zhLabel: string;
  enLabel: string;
  rank: 1 | 2 | 3 | 4;
  colorClass: string;
}
⋮----
export function orgRoleAtLeast(
  actorRole: OrganizationRole,
  requiredRole: OrganizationRole,
): boolean
⋮----
export interface WorkspaceRoleMeta {
  role: WorkspaceRole;
  zhLabel: string;
  enLabel: string;
  rank: 1 | 2 | 3;
  colorClass: string;
}
⋮----
export function workspaceRoleAtLeast(
  actorRole: WorkspaceRole,
  requiredRole: WorkspaceRole,
): boolean
```

## File: src/shared/constants/settings.ts
```typescript

```

## File: src/shared/constants/skills.ts
```typescript
export type SkillGroup =
  | 'CivilStructural'
  | 'MEP'
  | 'FinishingWorks'
  | 'Landscape'
  | 'TemporaryWorks'
  | 'SiteManagement'
  | 'Logistics'
  | 'BIM'
  | 'ProjectConsulting';
export type SkillSubCategory =
  | 'ConcreteFormwork'
  | 'MasonryStructural'
  | 'EarthSpecial'
  | 'ElectricalWorks'
  | 'MechanicalPlumbing'
  | 'FireProtection'
  | 'WetWorks'
  | 'DryWorks'
  | 'SoftLandscape'
  | 'HardLandscape'
  | 'TempScaffolding'
  | 'TempShoring'
  | 'TempSiteFacilities'
  | 'HeavyEquipmentOps'
  | 'SpecialistTrades'
  | 'EngineeringTechnical'
  | 'SafetyQuality'
  | 'ProjectMgmt'
  | 'MaterialLogistics'
  | 'Environmental'
  | 'BIMModeling'
  | 'DigitalConstruction'
  | 'ContractProcurement'
  | 'ConsultingAdvisory'
  | 'ClaimsDisputes';
export interface SkillGroupMeta {
  group: SkillGroup;
  zhLabel: string;
  enLabel: string;
  subCategories: readonly SkillSubCategory[];
}
export interface SkillSubCategoryMeta {
  subCategory: SkillSubCategory;
  group: SkillGroup;
  zhLabel: string;
  enLabel: string;
}
export interface SkillDefinition {
  slug: string;
  name: string;
  group: SkillGroup;
  subCategory: SkillSubCategory;
  description?: string;
}
⋮----
export type SkillSlug = (typeof SKILLS)[number]['slug'];
⋮----
export function findSkill(slug: string): SkillDefinition | undefined
```

## File: src/shared/constants/status.ts
```typescript
import type { ScheduleStatus } from '@/features/shared-kernel';
import type {
  InviteState,
  NotificationType,
  Presence,
} from '@/shared/types/account.types';
import type { AuditLogType } from '@/shared/types/audit.types';
import type { WorkspaceLifecycleState } from '@/shared/types/workspace.types';
⋮----
export interface ScheduleStatusMeta {
  status: ScheduleStatus;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
  bgClass: string;
}
⋮----
export interface WorkspaceLifecycleStateMeta {
  state: WorkspaceLifecycleState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface AuditLogTypeMeta {
  type: AuditLogType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface InviteStateMeta {
  state: InviteState;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
⋮----
export interface PresenceMeta {
  presence: Presence;
  zhLabel: string;
  enLabel: string;
  dotClass: string;
}
⋮----
export interface NotificationTypeMeta {
  type: NotificationType;
  zhLabel: string;
  enLabel: string;
  colorClass: string;
}
```

## File: src/shared/constants/taiwan-address.ts
```typescript
export type TwCountyType =
  | 'municipality'
  | 'city'
  | 'county';
export interface TwDistrictMeta {
  name: string;
  zip: string;
}
export interface TwCountyMeta {
  name: string;
  type: TwCountyType;
  enName: string;
  districts: readonly TwDistrictMeta[];
}
⋮----
export type TwCountyName = (typeof TW_COUNTIES)[number]['name'];
⋮----
export function getTwDistricts(countyName: string): readonly TwDistrictMeta[]
```

## File: src/shared/infra/analytics/analytics.adapter.ts
```typescript
import { logEvent } from 'firebase/analytics';
import { analytics } from './analytics.client';
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, unknown>) =>
```

## File: src/shared/infra/analytics/analytics.client.ts
```typescript
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { app } from '../app.client';
```

## File: src/shared/infra/app.client.ts
```typescript
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./firebase.config";
```

## File: src/shared/infra/auth/auth.adapter.ts
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './auth.client';
```

## File: src/shared/infra/auth/auth.client.ts
```typescript
import { getAuth, type Auth } from 'firebase/auth';
import { app } from '../app.client';
```

## File: src/shared/infra/auth/auth.types.ts
```typescript
import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import type { AuthUser } from '@/shared/ports/i-auth.service';
⋮----
export function mapFirebaseUser(user: FirebaseUser): AuthUser
```

## File: src/shared/infra/auth/index.ts
```typescript

```

## File: src/shared/infra/firebase.config.ts
```typescript

```

## File: src/shared/infra/firestore/firestore.client.ts
```typescript
import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from '../app.client';
```

## File: src/shared/infra/firestore/firestore.converter.ts
```typescript
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
} from 'firebase/firestore';
export const createConverter = <T extends
⋮----
toFirestore(modelObject: WithFieldValue<T>): DocumentData
fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
): T
```

## File: src/shared/infra/firestore/firestore.read.adapter.ts
```typescript
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type CollectionReference,
  type DocumentChange,
  type DocumentData,
  type DocumentSnapshot,
  type FieldPath,
  type OrderByDirection,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  type WhereFilterOp,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './firestore.client';
⋮----
export const getDocument = async <T>(
  path: string,
  converter?: FirestoreDataConverter<T>
): Promise<T | null> =>
export const getDocuments = async <T>(query: Query<T>): Promise<T[]> =>
export const createSubscription = <T>(
  query: Query<T, DocumentData>,
  onUpdate: (data: T[]) => void
): Unsubscribe =>
export const subscribeToDocument = <T extends object>(
  path: string,
  onUpdate: (data: (T & { id: string }) | null) => void
): Unsubscribe =>
```

## File: src/shared/infra/firestore/firestore.types.ts
```typescript
import type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore';
⋮----
export interface FirestoreTimestampedDoc {
  readonly createdAt?: Timestamp;
  readonly updatedAt?: Timestamp;
}
export interface VersionedProjectionDoc extends FirestoreTimestampedDoc {
  readonly lastProcessedVersion: number;
  readonly traceId?: string;
}
```

## File: src/shared/infra/firestore/firestore.utils.ts
```typescript
import type { QuerySnapshot } from "firebase/firestore"
export function snapshotToRecord<T extends
```

## File: src/shared/infra/firestore/firestore.write.adapter.ts
```typescript
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  type FieldValue,
  type Transaction,
  type WithFieldValue,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './firestore.client';
⋮----
export const addDocument = <T>(
  path: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>
) =>
export const setDocument = <T>(
  path: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>
) =>
export const updateDocument = (path: string, data: DocumentData) =>
export const deleteDocument = (path: string) =>
```

## File: src/shared/infra/firestore/index.ts
```typescript

```

## File: src/shared/infra/firestore/repositories/account.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import type {
  Account,
  MemberReference,
  Team,
  ThemeConfig,
} from '@/shared/types'
import { db } from '../firestore.client'
import { updateDocument, addDocument, setDocument } from '../firestore.write.adapter'
export const createUserAccount = async (userId: string, name: string, email: string): Promise<void> =>
export const createOrganization = async (organizationName: string, owner: Account): Promise<string> =>
export const recruitOrganizationMember = async (organizationId: string, newId: string, name: string, email: string): Promise<void> =>
export const dismissOrganizationMember = async (organizationId: string, member: MemberReference): Promise<void> =>
export const createTeam = async (organizationId: string, teamName: string, type: 'internal' | 'external'): Promise<void> =>
export const updateTeamMembers = async (organizationId: string, teamId: string, memberId: string, action: 'add' | 'remove'): Promise<void> =>
export const sendPartnerInvite = async (organizationId: string, teamId: string, email: string): Promise<void> =>
export const dismissPartnerMember = async (organizationId: string, teamId: string, member: MemberReference): Promise<void> =>
export const updateOrganizationSettings = async (organizationId: string, settings:
export const deleteOrganization = async (organizationId: string): Promise<void> =>
```

## File: src/shared/infra/firestore/repositories/audit.repository.ts
```typescript
import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
} from 'firebase/firestore'
import type { AuditLog } from '@/shared/types'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
export const getAuditLogs = async (
  accountId: string,
  workspaceId?: string,
  limitCount = 50
): Promise<AuditLog[]> =>
```

## File: src/shared/infra/firestore/repositories/daily.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  increment,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  runTransaction,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import type { DailyLog, DailyLogComment } from '@/shared/types'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
export const toggleDailyLogLike = async (
  organizationId: string,
  logId: string,
  userId: string
): Promise<void> =>
export const addDailyLogComment = async (
  organizationId: string,
  logId: string,
  author: { uid: string; name: string; avatarUrl?: string },
  content: string
): Promise<void> =>
export const getDailyLogs = async (
  accountId: string,
  limitCount = 30
): Promise<DailyLog[]> =>
```

## File: src/shared/infra/firestore/repositories/projection.registry.repository.ts
```typescript
import {
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firestore.client';
export interface ProjectionVersionRecord {
  projectionName: string;
  lastEventOffset: number;
  readModelVersion: string;
  updatedAt: Timestamp;
}
export const getProjectionVersion = async (
  projectionName: string
): Promise<ProjectionVersionRecord | null> =>
export const upsertProjectionVersion = async (
  projectionName: string,
  lastEventOffset: number,
  readModelVersion: string
): Promise<void> =>
```

## File: src/shared/infra/firestore/repositories/schedule.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import type { ScheduleItem } from '@/features/shared-kernel'
import { db } from '../firestore.client'
import { createConverter } from '../firestore.converter'
import { getDocuments } from '../firestore.read.adapter'
import { addDocument, updateDocument } from '../firestore.write.adapter'
export const createScheduleItem = async (
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
export const updateScheduleItemStatus = async (
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<void> =>
export const assignMemberAndApprove = async (
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const assignMemberToScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const unassignMemberFromScheduleItem = async (
  accountId: string,
  itemId: string,
  memberId: string
): Promise<void> =>
export const getScheduleItems = async (
  accountId: string,
  workspaceId?: string
): Promise<ScheduleItem[]> =>
```

## File: src/shared/infra/firestore/repositories/user.repository.ts
```typescript
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import type { Account } from '@/shared/types'
import { db } from '../firestore.client'
import { setDocument } from '../firestore.write.adapter'
export const getUserProfile = async (
  userId: string
): Promise<Account | null> =>
export const updateUserProfile = async (
  userId: string,
  data: Partial<Account>
): Promise<void> =>
export const addBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
export const removeBookmark = async (
  userId: string,
  logId: string
): Promise<void> =>
```

## File: src/shared/infra/firestore/repositories/workspace-business.files.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  arrayUnion,
  type FieldValue,
} from 'firebase/firestore';
import type { WorkspaceFile, WorkspaceFileVersion } from '@/shared/types';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { updateDocument, addDocument } from '../firestore.write.adapter';
export const createWorkspaceFile = async (
  workspaceId: string,
  fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'> & { updatedAt: FieldValue }
): Promise<string> =>
export const addWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  version: WorkspaceFileVersion,
  currentVersionId: string
): Promise<void> =>
export const restoreWorkspaceFileVersion = async (
  workspaceId: string,
  fileId: string,
  versionId: string
): Promise<void> =>
export const getWorkspaceFilesFromSubcollection = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
```

## File: src/shared/infra/firestore/repositories/workspace-core.event-store.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { addDocument } from '../firestore.write.adapter';
export interface StoredWorkspaceEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  aggregateId: string;
  occurredAt: Timestamp;
  correlationId?: string;
  causedBy?: string;
}
export const appendDomainEvent = async (
  workspaceId: string,
  event: Omit<StoredWorkspaceEvent, 'id' | 'occurredAt'>
): Promise<string> =>
export const getDomainEvents = async (
  workspaceId: string
): Promise<StoredWorkspaceEvent[]> =>
```

## File: src/shared/infra/firestore/version-guard.middleware.ts
```typescript
export type VersionGuardResult = 'allow' | 'discard';
export function applyFirestoreVersionGuard(
  eventVersion: number,
  viewLastProcessedVersion: number
): VersionGuardResult
export function allowFirestoreWrite(
  eventVersion: number,
  viewLastProcessedVersion: number
): boolean
```

## File: src/shared/infra/index.ts
```typescript

```

## File: src/shared/infra/messaging/index.ts
```typescript

```

## File: src/shared/infra/messaging/messaging.adapter.ts
```typescript

```

## File: src/shared/infra/messaging/messaging.client.ts
```typescript
import { getMessaging, type Messaging } from 'firebase/messaging';
import { app } from '../app.client';
```

## File: src/shared/infra/messaging/messaging.types.ts
```typescript
export interface FcmData {
  readonly [key: string]: string;
}
export interface FcmMessage {
  readonly token: string;
  readonly notification: {
    readonly title: string;
    readonly body: string;
  };
  readonly data: FcmData & { readonly traceId: string };
}
```

## File: src/shared/infra/storage/index.ts
```typescript

```

## File: src/shared/infra/storage/storage-path.resolver.ts
```typescript
dailyPhoto(accountId: string, workspaceId: string, fileId: string, fileName: string): string
taskAttachment(workspaceId: string, fileId: string, fileName: string): string
userAvatar(userId: string): string
workspaceDocument(workspaceId: string, fileId: string, versionId: string, fileName: string): string
```

## File: src/shared/infra/storage/storage.adapter.ts
```typescript
import type { IFileStore, UploadOptions } from '@/shared/ports/i-file-store';
import { getFileDownloadURL } from './storage.read.adapter';
import { deleteFile, uploadFile } from './storage.write.adapter';
export class StorageAdapter implements IFileStore
⋮----
async upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>
async getDownloadURL(path: string): Promise<string>
async deleteFile(path: string): Promise<void>
```

## File: src/shared/infra/storage/storage.client.ts
```typescript
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { app } from '../app.client';
```

## File: src/shared/infra/storage/storage.facade.ts
```typescript
import { getFileDownloadURL } from './storage.read.adapter';
import { uploadFile } from './storage.write.adapter';
export const uploadDailyPhoto = async (
  accountId: string,
  workspaceId: string,
  file: File
): Promise<string> =>
export const uploadTaskAttachment = async (
  workspaceId: string,
  file: File
): Promise<string> =>
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> =>
export const uploadWorkspaceDocument = async (
  workspaceId: string,
  fileId: string,
  versionId: string,
  file: File
): Promise<string> =>
```

## File: src/shared/infra/storage/storage.read.adapter.ts
```typescript
import { ref, getDownloadURL, listAll, type ListResult } from 'firebase/storage';
import { storage } from './storage.client';
export const getFileDownloadURL = (path: string): Promise<string> =>
export const listFiles = (path: string): Promise<ListResult> =>
```

## File: src/shared/infra/storage/storage.types.ts
```typescript
import type {
  StorageReference,
  UploadMetadata,
  UploadResult,
} from 'firebase/storage';
⋮----
export interface UploadTaskResult {
  readonly downloadURL: string;
  readonly storagePath: string;
}
```

## File: src/shared/infra/storage/storage.write.adapter.ts
```typescript
import {
  ref,
  uploadBytes,
  deleteObject,
  type UploadResult,
  type UploadMetadata,
} from 'firebase/storage';
import { storage } from './storage.client';
export const uploadFile = (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadResult> =>
export const deleteFile = (path: string): Promise<void> =>
```

## File: src/shared/ports/i-auth.service.ts
```typescript
export interface AuthUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}
export interface IAuthService {
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signInAnonymously(): Promise<AuthUser>;
  updateProfile(user: AuthUser, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}
⋮----
signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser>;
sendPasswordResetEmail(email: string): Promise<void>;
signInAnonymously(): Promise<AuthUser>;
updateProfile(user: AuthUser, profile:
signOut(): Promise<void>;
onAuthStateChanged(callback: (user: AuthUser | null)
getCurrentUser(): AuthUser | null;
```

## File: src/shared/ports/i-file-store.ts
```typescript
export interface UploadOptions {
  readonly contentType?: string;
}
export interface IFileStore {
  upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
  getDownloadURL(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
⋮----
upload(path: string, file: File | Blob, options?: UploadOptions): Promise<string>;
getDownloadURL(path: string): Promise<string>;
deleteFile(path: string): Promise<void>;
```

## File: src/shared/ports/i-firestore.repo.ts
```typescript
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}
⋮----
toDate(): Date;
toMillis(): number;
⋮----
export interface FirestoreDoc<T = Record<string, unknown>> {
  readonly id: string;
  readonly data: T;
}
export interface WriteOptions {
  readonly aggregateVersion?: number;
  readonly merge?: boolean;
}
export interface IFirestoreRepo {
  getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
  getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
  setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
  deleteDoc(collectionPath: string, docId: string): Promise<void>;
  onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void
  ): () => void;
}
⋮----
getDoc<T>(collectionPath: string, docId: string): Promise<FirestoreDoc<T> | null>;
getDocs<T>(collectionPath: string): Promise<FirestoreDoc<T>[]>;
setDoc<T>(collectionPath: string, docId: string, data: T, opts?: WriteOptions): Promise<void>;
deleteDoc(collectionPath: string, docId: string): Promise<void>;
onSnapshot<T>(
    collectionPath: string,
    callback: (docs: FirestoreDoc<T>[]) => void
): ()
```

## File: src/shared/ports/i-messaging.ts
```typescript
export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
}
export interface IMessaging {
  send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string
  ): Promise<void>;
  getToken(): Promise<string | null>;
  onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void
  ): () => void;
}
⋮----
send(
    fcmToken: string,
    payload: PushNotificationPayload,
    traceId: string
  ): Promise<void>;
getToken(): Promise<string | null>;
onForegroundMessage(
    callback: (payload: PushNotificationPayload) => void
): ()
```

## File: src/shared/ports/index.ts
```typescript

```

## File: src/shared/README.MD
```markdown
放置無狀態共用程式庫：UI 元件、helpers、types 與工具函式。
只允許向下依賴；向上 import 為架構違規。
```

## File: src/shared/shadcn-ui/aspect-ratio.tsx
```typescript

```

## File: src/shared/shadcn-ui/collapsible.tsx
```typescript

```

## File: src/shared/shadcn-ui/sonner.tsx
```typescript
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
type ToasterProps = React.ComponentProps<typeof Sonner>
```

## File: src/shared/types/index.ts
```typescript

```

## File: src/shared/types/schedule.types.ts
```typescript

```

## File: src/shared/ui/language-switcher.tsx
```typescript
import { Globe } from "lucide-react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { type Locale } from "@/config/i18n/i18n-types"
import { Button } from "@/shared/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
⋮----
export function LanguageSwitcher()
⋮----
onClick=
```

## File: src/shared/ui/page-header.tsx
```typescript
import type { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
}
export function PageHeader(
```

## File: tailwind.config.ts
```typescript
import type {Config} from 'tailwindcss';
```

## File: vitest.config.ts
```typescript
import path from 'path';
import { defineConfig } from 'vitest/config';
```

## File: src/app/(shell)/(account)/(dashboard)/dashboard/account/settings/page.tsx
```typescript
import { AccountSettingsRouter } from "@/features/account.slice"
export default function AccountSettingsPage()
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/@modal/(.)settings/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useState } from "react"
import { WorkspaceSettingsDialog , useWorkspace } from "@/features/workspace.slice"
import type { WorkspaceLifecycleState, Address, WorkspacePersonnel } from "@/shared/types"
export default function WorkspaceSettingsModalPage()
⋮----
const onSave = async (settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
    personnel?: WorkspacePersonnel
}) =>
⋮----
onOpenChange=
```

## File: src/app/(shell)/(account)/(workspaces)/workspaces/[id]/settings/page.tsx
```typescript
import { useRouter } from "next/navigation"
import { useState } from "react"
import { WorkspaceSettingsDialog , useWorkspace } from "@/features/workspace.slice"
import type { WorkspaceLifecycleState, Address, WorkspacePersonnel } from "@/shared/types"
export default function WorkspaceSettingsPage()
⋮----
const onSave = async (settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
    personnel?: WorkspacePersonnel
}) =>
⋮----
onOpenChange=
```

## File: src/app/layout.tsx
```typescript
import type {Metadata} from 'next';
⋮----
import { I18nProvider } from '@/config/i18n/i18n-provider';
import { AppProvider } from '@/features/workspace.slice';
import { AuthProvider } from '@/shared/app-providers/auth-provider';
import { FirebaseClientProvider } from '@/shared/app-providers/firebase-provider';
import { ThemeProvider } from '@/shared/app-providers/theme-provider';
import { cn } from '@/shared/shadcn-ui/utils/utils';
import {Toaster} from '@/shared/shadcn-ui/toaster';
⋮----
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
```

## File: src/features/account.slice/_account.rules.ts
```typescript
import type { Account, Team } from "@/shared/types"
export function isOwner(account: Account, userId: string): boolean
export function getUserTeams(account: Account, userId: string): Team[]
export function getUserTeamIds(account: Account, userId: string): Set<string>
```

## File: src/features/account.slice/user.profile/_components/account-settings-router.tsx
```typescript
import { OrgSettingsView } from "@/features/organization.slice";
import { useApp } from "@/shared/app-providers/app-context";
import { UserSettingsView } from "./user-settings-view";
export function AccountSettingsRouter()
```

## File: src/features/account.slice/user.profile/_components/user-settings.tsx
```typescript
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { findSkill } from "@/shared/constants/skills";
import { type SkillGrant } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useUser } from "../_hooks/use-user";
import { PreferencesCard } from "./preferences-card";
import { ProfileCard } from "./profile-card";
import { SecurityCard } from "./security-card";
export function UserSettings()
⋮----
const handleSaveProfile = async () =>
const handleWithdraw = () =>
const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) =>
const handleSkillToggle = (slug: string) =>
```

## File: src/features/account.slice/user.profile/index.ts
```typescript

```

## File: src/features/identity.slice/_components/login-view.tsx
```typescript
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import { completeRegistration , signIn, signInAnonymously } from "../_actions"
import { AuthBackground } from "./auth-background"
import { AuthTabsRoot } from "./auth-tabs-root"
export function LoginView()
⋮----
const handleAuth = async (type: "login" | "register") =>
const handleAnonymous = async () =>
```

## File: src/features/identity.slice/_components/reset-password-form.tsx
```typescript
import { Mail } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { Button } from "@/shared/shadcn-ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/shadcn-ui/input-group";
import { Label } from "@/shared/shadcn-ui/label";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { sendPasswordResetEmail } from "../_actions";
interface ResetPasswordFormProps {
  defaultEmail?: string;
  onSuccess: () => void;
  onCancel: () => void;
}
⋮----
const handleSend = async () =>
```

## File: src/features/notification-hub.slice/user.notification/_components/notification-list.tsx
```typescript
import { cn } from '@/shared/shadcn-ui/utils/utils';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import type { Notification } from '@/shared/types';
interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}
```

## File: src/features/organization.slice/core/_components/account-new-form.tsx
```typescript
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { useApp } from "@/shared/app-providers/app-context";
import { Button } from "@/shared/shadcn-ui/button";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useOrganizationManagement } from "../_hooks/use-organization-management";
interface AccountNewFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}
⋮----
const handleCreate = async () =>
⋮----
```

## File: src/features/organization.slice/core/_components/org-settings-view.tsx
```typescript
import { useI18n } from "@/config/i18n/i18n-provider";
import { PageHeader } from "@/shared/ui/page-header";
import { OrgSettings } from "./org-settings";
export function OrgSettingsView()
⋮----
title=
```

## File: src/features/organization.slice/core/index.ts
```typescript

```

## File: src/features/organization.slice/gov.members/_components/members-view.tsx
```typescript
import { UserPlus, Trash2, Mail, AlertCircle, Sparkles } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { getAllOrgMembersView } from "@/features/projection.bus"
import type { OrgEligibleMemberView } from "@/features/projection.bus"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/shadcn-ui/card"
import { type MemberReference } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import { useMemberManagement } from '../_hooks/use-member-management'
⋮----
title=
```

## File: src/features/organization.slice/gov.partners/_components/partner-detail-view.tsx
```typescript
import {
  ArrowLeft,
  MailPlus,
  Trash2,
  Globe,
  Clock,
  ShieldCheck,
  SendHorizontal
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs"
import type { PartnerInvite, MemberReference , Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import { usePartnerManagement } from "../_hooks/use-partner-management"
import { subscribeToOrgPartnerInvites } from "../_queries"
⋮----
// Subscribe to this org's invites directly (Account BC data — accounts/{orgId}/invites)
⋮----
const handleSendInvite = async () =>
const handleDismissMember = async (member: MemberReference) =>
```

## File: src/features/organization.slice/gov.partners/_components/partners-view.tsx
```typescript
import { Handshake, Plus, ArrowRight, Globe, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import type { Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import { usePartnerManagement } from "../_hooks/use-partner-management"
⋮----
title=
⋮----
<span className="font-mono text-[9px] text-muted-foreground">TID:
```

## File: src/features/organization.slice/gov.teams/_components/team-detail-view.tsx
```typescript
import { ArrowLeft, UserPlus, Trash2, Users } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useTeamManagement } from "@/features/organization.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent } from "@/shared/shadcn-ui/card"
import type { MemberReference, Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
⋮----
const handleMemberToggle = async (memberId: string, action: 'add' | 'remove') =>
⋮----
<Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-primary" onClick=
```

## File: src/features/organization.slice/gov.teams/_components/teams-view.tsx
```typescript
import { Users, Plus, FolderTree, ArrowRight, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useI18n } from "@/config/i18n/i18n-provider"
import { useTeamManagement } from "@/features/organization.slice"
import { useApp } from "@/shared/app-providers/app-context"
import { Badge } from "@/shared/shadcn-ui/badge"
import { Button } from "@/shared/shadcn-ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/shadcn-ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import type { Team } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
⋮----
title=
⋮----
<span className="font-mono text-[9px] text-muted-foreground">ID:
```

## File: src/features/organization.slice/index.ts
```typescript

```

## File: src/features/scheduling.slice/_actions.ts
```typescript
import {
  type CommandResult,
  type SkillRequirement,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import {
  assignMemberToScheduleItem,
  unassignMemberFromScheduleItem,
  createScheduleItem as createScheduleItemFacade,
  updateScheduleItemStatus as updateScheduleItemStatusFacade,
  assignMemberAndApprove,
} from '@/shared/infra/firestore/firestore.facade';
import { Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import {
  approveOrgScheduleProposal,
  cancelOrgScheduleProposal,
  completeOrgSchedule,
} from './_aggregate';
import { executeWriteOp } from './_write-op';
export async function createScheduleItem(
  itemData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<CommandResult>
export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult>
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: 'OFFICIAL' | 'REJECTED' | 'COMPLETED'
): Promise<CommandResult>
export async function manualAssignScheduleMember(
  scheduleItemId: string,
  targetAccountId: string,
  assignedBy: string,
  opts: {
    workspaceId: string;
    orgId: string;
    title: string;
    startDate: string;
    endDate: string;
    traceId?: string;
  },
  skillRequirements?: SkillRequirement[]
): Promise<CommandResult>
export async function cancelScheduleProposalAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  cancelledBy: string,
  reason?: string,
  traceId?: string
): Promise<CommandResult>
export async function completeOrgScheduleAction(
  scheduleItemId: string,
  orgId: string,
  workspaceId: string,
  targetAccountId: string,
  completedBy: string,
  traceId?: string
): Promise<CommandResult>
```

## File: src/features/scheduling.slice/_components/org-skill-pool-manager.tsx
```typescript
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
import { addOrgSkillTagAction, removeOrgSkillTagAction } from '@/features/skill-xp.slice';
import { getOrgSkillTags } from '@/features/skill-xp.slice';
import { useApp } from '@/shared/app-providers/app-context';
import {
  SKILL_GROUPS,
  SKILL_SUB_CATEGORY_BY_KEY,
  SKILLS,
  type SkillGroup,
  type SkillSubCategory,
} from '@/shared/constants/skills';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
```

## File: src/features/scheduling.slice/_components/schedule-proposal-content.tsx
```typescript
import { parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import type { SkillRequirement } from "@/features/shared-kernel"
import { useWorkspace } from "@/features/workspace.slice"
import type { Location } from "@/shared/types"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import { ProposalDialog } from "./proposal-dialog"
interface ScheduleProposalContentProps {
  fullPage?: boolean
}
export function ScheduleProposalContent(
⋮----
const handleSubmit = async (data: {
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    location: Location
    requiredSkills: SkillRequirement[]
}) =>
```

## File: src/features/scheduling.slice/_components/schedule.account-view.tsx
```typescript
import { addMonths, subMonths } from "date-fns";
import { AlertCircle, UserPlus, Calendar, ListChecks, History, Users, BookOpen, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import type { ScheduleItem } from '@/features/shared-kernel';
import { useApp } from "@/shared/app-providers/app-context";
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import type { MemberReference } from "@/shared/types";
import { useGlobalSchedule } from "../_hooks/use-global-schedule";
import { useScheduleActions } from "../_hooks/use-schedule-commands";
import { decisionHistoryColumns } from "./decision-history-columns";
import { OrgScheduleGovernance } from "./org-schedule-governance";
import { OrgSkillPoolManager } from "./org-skill-pool-manager";
import { ScheduleDataTable } from "./schedule-data-table";
import { UnifiedCalendarGrid } from "./unified-calendar-grid";
import { upcomingEventsColumns } from "./upcoming-events-columns";
interface MemberAssignPopoverProps {
  item: ScheduleItem;
  members: MemberReference[];
  onAssign: (item: ScheduleItem, memberId: string) => void;
  onUnassign: (item: ScheduleItem, memberId: string) => void;
}
⋮----
onUnassign(item, member.id);
⋮----
const onItemClick = (item: ScheduleItem) =>
const handleMonthChange = (direction: 'prev' | 'next') =>
```

## File: src/features/scheduling.slice/_hooks/use-global-schedule.ts
```typescript
import { useMemo } from "react";
import { useAccount } from "@/features/workspace.slice";
import { useApp } from "@/shared/app-providers/app-context";
import {
  selectAllScheduleItems,
  selectPendingProposals,
  selectDecisionHistory,
  selectUpcomingEvents,
  selectPresentEvents,
} from '../_selectors';
export function useGlobalSchedule()
```

## File: src/features/scheduling.slice/_hooks/use-schedule-event-handler.ts
```typescript
import { useEffect } from "react";
import { useWorkspace } from "@/features/workspace.slice";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
export function useScheduleEventHandler()
```

## File: src/features/scheduling.slice/_hooks/use-workspace-schedule.ts
```typescript
import { addMonths, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { ScheduleItem } from '@/features/shared-kernel';
import { useWorkspace } from "@/features/workspace.slice";
import { useApp } from "@/shared/app-providers/app-context";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { subscribeToWorkspaceScheduleItems } from '../_queries';
export function useWorkspaceSchedule()
⋮----
const handleMonthChange = (direction: "prev" | "next") =>
const handleOpenAddDialog = (date: Date) =>
```

## File: src/features/scheduling.slice/_saga.ts
```typescript
import { getOrgEligibleMembersWithTier } from '@/features/projection.bus';
import type { WorkspaceScheduleProposedPayload } from '@/features/shared-kernel';
import { getDocument, Timestamp } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import {
  handleScheduleProposed,
  approveOrgScheduleProposal,
} from './_aggregate';
import { findEligibleCandidatesForRequirements } from './_eligibility';
import { executeWriteOp } from './_write-op';
export type SagaStep =
  | 'receive_proposal'
  | 'eligibility_check'
  | 'assign'
  | 'compensate';
export type SagaStatus =
  | 'pending'
  | 'eligibility_check'
  | 'assigned'
  | 'compensated';
export interface SagaState {
  readonly sagaId: string;
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  status: SagaStatus;
  currentStep: SagaStep;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  compensationReason?: string;
  traceId?: string;
}
⋮----
function sagaPath(sagaId: string): string
async function persistSaga(state: SagaState): Promise<void>
async function updateSagaStatus(
  sagaId: string,
  patch: Partial<
    Pick<
      SagaState,
      'status' | 'currentStep' | 'completedAt' | 'compensationReason' | 'updatedAt'
    >
  >
): Promise<void>
export async function getSagaState(sagaId: string): Promise<SagaState | null>
export async function startSchedulingSaga(
  event: WorkspaceScheduleProposedPayload,
  sagaId: string
): Promise<SagaState>
```

## File: src/features/scheduling.slice/_schedule.rules.ts
```typescript
import type { ScheduleStatus } from '@/features/shared-kernel'
⋮----
export function canTransitionScheduleStatus(
  from: ScheduleStatus,
  to: ScheduleStatus
): boolean
```

## File: src/features/scheduling.slice/_selectors.ts
```typescript
import { subDays, isFuture, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { ScheduleItem } from '@/features/shared-kernel';
export interface ScheduleItemWithWorkspace extends ScheduleItem {
  workspaceName: string;
}
export type ScheduleItemWithMembers<M> = ScheduleItemWithWorkspace & {
  members: M[];
};
export function selectAllScheduleItems(
  scheduleItems: Record<string, ScheduleItem>,
  workspaces: Record<string, { name?: string }>
): ScheduleItemWithWorkspace[]
export function selectPendingProposals(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[]
export function selectDecisionHistory(
  items: ScheduleItemWithWorkspace[]
): ScheduleItemWithWorkspace[]
export function selectUpcomingEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[]
export function selectPresentEvents<M>(
  items: ScheduleItemWithWorkspace[],
  members: M[]
): ScheduleItemWithMembers<M>[]
```

## File: src/features/scheduling.slice/_write-op.ts
```typescript
import { updateDocument, arrayUnion } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WriteOp } from './_aggregate';
export async function executeWriteOp(op: WriteOp): Promise<void>
```

## File: src/features/shared-kernel/account-contract/index.ts
```typescript
import type { Timestamp } from '@/shared/ports'
import type { SkillGrant } from '../skill-tier'
export type AccountType = 'user' | 'organization'
export type OrganizationRole = 'Owner' | 'Admin' | 'Member' | 'Guest'
export type Presence = 'active' | 'away' | 'offline'
export type InviteState = 'pending' | 'accepted' | 'expired'
export type NotificationType = 'info' | 'alert' | 'success'
export interface Account {
  id: string
  name: string
  accountType: AccountType
  email?: string
  photoURL?: string
  bio?: string
  achievements?: string[]
  expertiseBadges?: ExpertiseBadge[]
  skillGrants?: SkillGrant[]
  wallet?: Wallet
  description?: string
  ownerId?: string
  role?: OrganizationRole
  theme?: ThemeConfig
  members?: MemberReference[]
  memberIds?: string[]
  teams?: Team[]
  createdAt?: Timestamp
}
export interface MemberReference {
  id: string
  name: string
  email: string
  role: OrganizationRole
  presence: Presence
  isExternal?: boolean
  expiryDate?: Timestamp
  skillGrants?: SkillGrant[]
}
export interface Team {
  id: string
  name: string
  description: string
  type: 'internal' | 'external'
  memberIds: string[]
}
export interface ThemeConfig {
  primary: string
  background: string
  accent: string
}
export interface Wallet {
  balance: number
}
export interface ExpertiseBadge {
  id: string
  name: string
  icon?: string
}
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  timestamp: number
}
export interface PartnerInvite {
  id: string
  email: string
  teamId: string
  role: OrganizationRole
  inviteState: InviteState
  invitedAt: Timestamp
  protocol: string
}
```

## File: src/features/shared-kernel/index.ts
```typescript

```

## File: src/features/shared-kernel/skill-tier/index.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export type SkillTier =
  | 'apprentice'
  | 'journeyman'
  | 'expert'
  | 'artisan'
  | 'grandmaster'
  | 'legendary'
  | 'titan';
export interface TierDefinition {
  tier: SkillTier;
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;
  minXp: number;
  maxXp: number;
  color: string;
  cssVar: string;
}
export interface SkillRequirement {
  tagSlug: string;
  tagId?: string;
  minimumTier: SkillTier;
  quantity: number;
}
⋮----
export function getTierDefinition(tier: SkillTier): TierDefinition
export function getTier(xp: number): SkillTier
⋮----
export function getTierRank(tier: SkillTier): number
export function tierSatisfies(grantedTier: SkillTier, minimumTier: SkillTier): boolean
export interface SkillTag {
  slug: string;
  name: string;
  category?: string;
  description?: string;
}
export interface SkillGrant {
  tagSlug: string;
  tagName?: string;
  tagId?: string;
  tier: SkillTier;
  xp: number;
  earnedInOrgId?: string;
  grantedAt?: Timestamp;
}
export interface WorkspaceScheduleProposedPayload {
  readonly scheduleItemId: string;
  readonly workspaceId: string;
  readonly orgId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly proposedBy: string;
  readonly intentId?: string;
  readonly skillRequirements?: SkillRequirement[];
  readonly locationId?: string;
  readonly traceId?: string;
}
export interface ImplementsScheduleProposedPayloadContract {
  readonly implementsScheduleProposedPayload: true;
}
```

## File: src/features/workspace.slice/_task.rules.ts
```typescript
import type { WorkspaceTask, TaskWithChildren } from "@/shared/types";
⋮----
export const buildTaskTree = (tasks: WorkspaceTask[]): TaskWithChildren[] =>
⋮----
const build = (
    node: TaskWithChildren,
    parentNo: string,
    index: number,
    path: Set<string>
) =>
```

## File: src/features/workspace.slice/_workspace.rules.ts
```typescript
import { isOwner, getUserTeamIds } from "@/features/account.slice"
import type { Workspace, Account } from "@/shared/types"
export function hasWorkspaceAccess(
  workspace: Workspace,
  userId: string,
  userTeamIds: Set<string>
): boolean
export function isWorkspaceVisibleToUser(
  workspace: Workspace,
  userId: string,
  userTeamIds: Set<string>
): boolean
export function filterVisibleWorkspaces(
  workspaces: Workspace[],
  userId: string,
  activeAccount: Account,
  allAccounts: Record<string, Account>
): Workspace[]
```

## File: src/features/workspace.slice/business.acceptance/_components/acceptance-view.tsx
```typescript
import { Trophy, CheckCircle2, Search, XCircle, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import type { WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
const getErrorMessage = (error: unknown, fallback: string)
export function WorkspaceAcceptance()
⋮----
const handleAccept = async (task: WorkspaceTask) =>
const handleFail = async (task: WorkspaceTask) =>
```

## File: src/features/workspace.slice/business.daily/_components/actions/bookmark-button.tsx
```typescript
import { Bookmark, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Button } from "@/shared/shadcn-ui/button";
import { useBookmarkActions } from '../../_hooks/use-bookmark-commands';
interface BookmarkButtonProps {
  logId: string;
}
```

## File: src/features/workspace.slice/business.daily/_components/actions/like-button.tsx
```typescript
import { Heart } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Button } from "@/shared/shadcn-ui/button";
import { type DailyLog, type Account } from "@/shared/types";
import { useDailyActions } from '../../_hooks/use-daily-commands';
interface LikeButtonProps {
  log: DailyLog;
  currentUser: Account | null;
}
⋮----
className=
```

## File: src/features/workspace.slice/business.daily/_components/actions/share-button.tsx
```typescript
import { Share2 } from "lucide-react";
import { Button } from "@/shared/shadcn-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu";
import { type DailyLog } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from "../../../core";
interface ShareButtonProps {
  log: DailyLog;
}
export function ShareButton(
⋮----
const handleForward = (target: "tasks") =>
⋮----
<DropdownMenuItem onSelect=
```

## File: src/features/workspace.slice/business.daily/_components/daily-log-dialog.tsx
```typescript
import { CornerUpLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import type { Timestamp } from "@/shared/ports";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/shadcn-ui/dialog";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type DailyLog, type DailyLogComment, type Account } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { addDailyLogComment } from "../_actions";
import { subscribeToDailyLogComments } from '../_queries';
import { BookmarkButton } from "./actions/bookmark-button";
import { CommentButton } from './actions/comment-button';
import { LikeButton } from './actions/like-button';
import { ShareButton } from './actions/share-button';
import { ImageCarousel } from "./image-carousel";
interface DailyLogDialogProps {
  log: DailyLog | null;
  currentUser: Account | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}
function WorkspaceAvatar(
function TimeAgo(
⋮----
const update = () =>
⋮----
const handlePostComment = async () =>
```

## File: src/features/workspace.slice/business.daily/_hooks/use-bookmark-commands.ts
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/app-providers/auth-provider';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import { toggleBookmark as toggleBookmarkAction } from '../_bookmark-actions';
import { subscribeToBookmarks } from '../_queries';
export function useBookmarkActions()
```

## File: src/features/workspace.slice/business.daily/_hooks/use-daily-commands.ts
```typescript
import { useCallback } from "react";
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { toggleLike as toggleLikeAction } from "../_actions";
export function useDailyActions()
```

## File: src/features/workspace.slice/business.daily/_hooks/use-workspace-daily.ts
```typescript
import { useState, useMemo } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { type DailyLog } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from "../../core";
import { useAccount } from "../../core";
import { useLogger } from "../../gov.audit";
import { useDailyUpload } from "./use-daily-upload";
const getErrorMessage = (error: unknown, fallback: string)
export function useWorkspaceDailyLog()
⋮----
const handlePost = async () =>
```

## File: src/features/workspace.slice/business.daily/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export interface DailyLogComment {
  id: string;
  author: {
    uid: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: Timestamp;
}
export interface DailyLog {
  id: string;
  accountId: string;
  workspaceId: string;
  workspaceName: string;
  author: {
    uid: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  photoURLs: string[];
  recordedAt: Timestamp;
  createdAt: Timestamp;
  likes?: string[];
  likeCount?: number;
  commentCount?: number;
  comments?: DailyLogComment[];
}
```

## File: src/features/workspace.slice/business.daily/index.ts
```typescript

```

## File: src/features/workspace.slice/business.files/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export interface WorkspaceFileVersion {
  versionId: string;
  versionNumber: number;
  versionName: string;
  size: number;
  uploadedBy: string;
  createdAt: Timestamp | Date;
  downloadURL: string;
}
export interface WorkspaceFile {
  id: string;
  name: string;
  type: string;
  currentVersionId: string;
  updatedAt: Timestamp | Date;
  versions: WorkspaceFileVersion[];
}
```

## File: src/features/workspace.slice/business.files/index.ts
```typescript

```

## File: src/features/workspace.slice/business.finance/_components/finance-view.tsx
```typescript
import { Wallet, Landmark, TrendingUp, CheckCircle2, AlertCircle, ArrowUpRight, FileSearch } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { type WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
type ParsedFinanceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sourceDocument: string;
  intentId: string;
};
⋮----
const handleDisburse = async (task: WorkspaceTask) =>
```

## File: src/features/workspace.slice/business.issues/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createIssue as createIssueFacade,
  addCommentToIssue as addCommentToIssueFacade,
  resolveIssue as resolveIssueFacade,
} from "@/shared/infra/firestore/firestore.facade"
export async function createIssue(
  workspaceId: string,
  title: string,
  type: "technical" | "financial",
  priority: "high" | "medium",
  sourceTaskId?: string
): Promise<CommandResult>
export async function addCommentToIssue(
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<CommandResult>
export async function resolveIssue(
  workspaceId: string,
  issueId: string
): Promise<CommandResult>
```

## File: src/features/workspace.slice/business.issues/_components/issues-view.tsx
```typescript
import { format } from "date-fns";
import { AlertCircle, Plus, ArrowRight, ShieldAlert, DollarSign, PenTool, MessageSquare, CornerUpLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn-ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/shared/shadcn-ui/sheet";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type WorkspaceIssue } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
const getErrorMessage = (error: unknown, fallback: string)
export function WorkspaceIssues()
⋮----
const handleAddIssue = async () =>
const handleAddComment = async () =>
const handleResolveIssue = async (issue: WorkspaceIssue) =>
const getIssueIcon = (type: string) =>
```

## File: src/features/workspace.slice/business.issues/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export interface IssueComment {
  id: string;
  author: string;
  content: string;
  createdAt: Timestamp;
}
export interface WorkspaceIssue {
  id: string;
  title: string;
  type: 'technical' | 'financial';
  priority: 'high' | 'medium';
  issueState: 'open' | 'closed';
  sourceTaskId?: string;
  createdAt: Timestamp;
  comments?: IssueComment[];
}
```

## File: src/features/workspace.slice/business.issues/index.ts
```typescript

```

## File: src/features/workspace.slice/business.quality-assurance/_components/quality-assurance-view.tsx
```typescript
import { ShieldCheck, XCircle, CheckCircle, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { type WorkspaceTask } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
const getErrorMessage = (error: unknown, fallback: string)
export function WorkspaceQualityAssurance()
⋮----
const handleApprove = async (task: WorkspaceTask) =>
const handleReject = async (task: WorkspaceTask) =>
```

## File: src/features/workspace.slice/business.tasks/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createTask as createTaskFacade,
  updateTask as updateTaskFacade,
  deleteTask as deleteTaskFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { WorkspaceTask } from "@/shared/types"
export async function createTask(
  workspaceId: string,
  taskData: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">
): Promise<CommandResult>
export async function updateTask(
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<CommandResult>
export async function deleteTask(
  workspaceId: string,
  taskId: string
): Promise<CommandResult>
export async function batchImportTasks(
  workspaceId: string,
  items: Omit<WorkspaceTask, "id" | "createdAt" | "updatedAt">[]
): Promise<CommandResult>
```

## File: src/features/workspace.slice/business.tasks/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
import type { SkillRequirement } from '@/features/shared-kernel'
export interface Location {
  building?: string;
  floor?: string;
  room?: string;
  description: string;
}
export interface WorkspaceTask {
  id: string;
  name: string;
  description?: string;
  progressState: 'todo' | 'doing' | 'blocked' | 'completed' | 'verified' | 'accepted';
  priority: 'low' | 'medium' | 'high';
  type?: string;
  progress?: number;
  quantity?: number;
  completedQuantity?: number;
  unitPrice?: number;
  unit?: string;
  discount?: number;
  subtotal: number;
  parentId?: string;
  assigneeId?: string;
  dueDate?: Timestamp;
  photoURLs?: string[];
  location?: Location;
  sourceIntentId?: string;
  requiredSkills?: SkillRequirement[];
  aggregateVersion?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}
export type TaskWithChildren = WorkspaceTask & {
  children: TaskWithChildren[];
  descendantSum: number;
  wbsNo: string;
  progress: number;
}
```

## File: src/features/workspace.slice/business.tasks/index.ts
```typescript

```

## File: src/features/workspace.slice/business.workflow/_issue-handler.ts
```typescript
import { blockWorkflow, createWorkflowAggregate, isWorkflowUnblocked, unblockWorkflow } from './_aggregate';
import { findWorkflowsBlockedByIssue, loadWorkflowState, saveWorkflowState } from './_persistence';
export interface WorkflowIssueBlockedResult {
  workflowId: string;
  blockedByCount: number;
  wasChanged: boolean;
}
export interface WorkflowIssueResolvedResult {
  touchedWorkflowIds: string[];
  unblockedWorkflowIds: string[];
}
async function getOrCreateWorkflowState(
  workspaceId: string,
  workflowId: string
)
export async function handleIssueCreatedForWorkflow(
  workspaceId: string,
  issueId: string,
  workflowId = workspaceId
): Promise<WorkflowIssueBlockedResult>
export async function handleIssueResolvedForWorkflow(
  workspaceId: string,
  issueId: string
): Promise<WorkflowIssueResolvedResult>
```

## File: src/features/workspace.slice/business.workflow/_persistence.ts
```typescript
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, getDocs, limit, query, type QueryDocumentSnapshot, type DocumentData, where } from '@/shared/infra/firestore/firestore.read.adapter';
import { getDocument } from '@/shared/infra/firestore/firestore.read.adapter';
import { setDocument, updateDocument } from '@/shared/infra/firestore/firestore.write.adapter';
import type { WorkflowAggregateState, WorkflowStage } from './_aggregate';
const workflowPath = (workspaceId: string, workflowId: string)
const workflowCollectionPath = (workspaceId: string)
export async function loadWorkflowState(
  workspaceId: string,
  workflowId: string
): Promise<WorkflowAggregateState | null>
export async function saveWorkflowState(state: WorkflowAggregateState): Promise<void>
export async function updateWorkflowState(
  workspaceId: string,
  workflowId: string,
  patch: Partial<Pick<WorkflowAggregateState, 'stage' | 'blockedBy' | 'version' | 'updatedAt'>>
): Promise<void>
export async function findWorkflowsBlockedByIssue(
  workspaceId: string,
  issueId: string
): Promise<WorkflowAggregateState[]>
export async function findWorkflowsByStage(
  workspaceId: string,
  stage: WorkflowStage
): Promise<WorkflowAggregateState[]>
export async function listWorkflowStates(
  workspaceId: string,
  maxResults = 200
): Promise<WorkflowAggregateState[]>
```

## File: src/features/workspace.slice/core.event-bus/_context.ts
```typescript

```

## File: src/features/workspace.slice/core.event-bus/_hooks/_context.ts
```typescript
import { createContext, useContext } from "react"
import type {
  PublishFn,
  SubscribeFn,
} from "../_events"
export interface WorkspaceEventContextType {
  publish: PublishFn
  subscribe: SubscribeFn
}
⋮----
export function useWorkspaceEvents(): WorkspaceEventContextType
```

## File: src/features/workspace.slice/core/_actions.ts
```typescript
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from '@/features/shared-kernel';
import {
  createWorkspace as createWorkspaceFacade,
  authorizeWorkspaceTeam as authorizeWorkspaceTeamFacade,
  revokeWorkspaceTeam as revokeWorkspaceTeamFacade,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessFacade,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessFacade,
  mountCapabilities as mountCapabilitiesFacade,
  unmountCapability as unmountCapabilityFacade,
  updateWorkspaceSettings as updateWorkspaceSettingsFacade,
  deleteWorkspace as deleteWorkspaceFacade,
  createWorkspaceLocation as createWorkspaceLocationFacade,
  updateWorkspaceLocation as updateWorkspaceLocationFacade,
  deleteWorkspaceLocation as deleteWorkspaceLocationFacade,
} from "@/shared/infra/firestore/firestore.facade"
import type { Account, Capability, WorkspaceRole, WorkspaceLifecycleState, WorkspaceLocation, Address, WorkspacePersonnel } from "@/shared/types"
export async function createWorkspace(
  name: string,
  account: Account
): Promise<CommandResult>
export async function authorizeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult>
export async function revokeWorkspaceTeam(
  workspaceId: string,
  teamId: string
): Promise<CommandResult>
export async function grantIndividualWorkspaceAccess(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<CommandResult>
export async function revokeIndividualWorkspaceAccess(
  workspaceId: string,
  grantId: string
): Promise<CommandResult>
export async function mountCapabilities(
  workspaceId: string,
  capabilities: Capability[]
): Promise<CommandResult>
export async function unmountCapability(
  workspaceId: string,
  capability: Capability
): Promise<CommandResult>
export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
    personnel?: WorkspacePersonnel
  }
): Promise<CommandResult>
export async function deleteWorkspace(workspaceId: string): Promise<CommandResult>
export async function createWorkspaceLocation(
  workspaceId: string,
  location: WorkspaceLocation
): Promise<CommandResult>
export async function updateWorkspaceLocation(
  workspaceId: string,
  locationId: string,
  updates: Partial<Pick<WorkspaceLocation, 'label' | 'description' | 'capacity'>>
): Promise<CommandResult>
export async function deleteWorkspaceLocation(
  workspaceId: string,
  locationId: string
): Promise<CommandResult>
```

## File: src/features/workspace.slice/core/_components/shell/account-create-dialog.tsx
```typescript
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/shared/shadcn-ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/shadcn-ui/dialog"
import { Input } from "@/shared/shadcn-ui/input"
import { Label } from "@/shared/shadcn-ui/label"
import { type Account } from "@/shared/types"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"
import type { AppAction } from '../app-provider'
interface AccountCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createOrganization: (name: string) => Promise<string>
  dispatch: React.Dispatch<AppAction>
  accounts: Record<string, Account>
  t: (key: string) => string
}
⋮----
const handleCreate = async () =>
⋮----
```

## File: src/features/workspace.slice/core/_components/shell/account-switcher.tsx
```typescript
import { Check, ChevronsUpDown, Globe, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ROUTES } from "@/shared/constants/routes"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/shared/shadcn-ui/sidebar"
import type { Account } from "@/shared/types"
import type { AppAction } from '../app-provider'
interface AccountSwitcherProps {
  user: Account | null
  accounts: Record<string, Account>
  activeAccount: Account | null
  dispatch: React.Dispatch<AppAction>
  createOrganization: (name: string) => Promise<string>
  t: (key: string) => string
}
const getAccountInitial = (name?: string)
⋮----
<AvatarFallback className=
⋮----
```

## File: src/features/workspace.slice/core/_components/shell/nav-main.tsx
```typescript
import {
  LayoutDashboard,
  Layers,
  FolderTree,
  ChevronRight,
  Users,
  Globe,
  Settings,
  Grid3X3,
  Calendar,
  MessageSquare,
  History,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/shadcn-ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuButton,
} from "@/shared/shadcn-ui/sidebar";
interface NavMainProps {
  pathname: string;
  isOrganizationAccount: boolean;
  t: (key: string) => string;
}
⋮----
const isActive = (path: string)
const isPartiallyActive = (path: string)
⋮----
<SidebarMenuButton asChild isActive=
⋮----
<SidebarMenuSubButton asChild isActive=
```

## File: src/features/workspace.slice/core/_components/shell/nav-user.tsx
```typescript
import { UserCircle, LogOut, ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { ROUTES } from "@/shared/constants/routes"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/shared/shadcn-ui/sidebar"
import type { Account } from "@/shared/types"
interface NavUserProps {
  user: Account | null
  accounts: Record<string, Account>
  activeAccount: Account | null
  logout: () => void
  t: (key: string, params?: Record<string, string | number>) => string;
}
const getAccountInitial = (name?: string)
⋮----
const handleLogout = () =>
⋮----
<AvatarFallback className="rounded-lg bg-primary/10 font-bold text-primary">
```

## File: src/features/workspace.slice/core/_components/shell/theme-adapter.tsx
```typescript
import { useEffect, useState, useRef } from "react";
import { hexToHsl } from "@/shared/shadcn-ui/utils/utils";
import { Skeleton } from "@/shared/shadcn-ui/skeleton";
import { useApp } from "../../_hooks/use-app";
⋮----
interface ThemeAdapterProps {
    children: React.ReactNode;
}
export function ThemeAdapter(
⋮----
async function adaptTheme()
```

## File: src/features/workspace.slice/core/_components/workspace-capabilities.tsx
```typescript
import {
  Box,
  Trash2,
  FileText,
  ListTodo,
  ShieldCheck,
  Trophy,
  AlertCircle,
  MessageSquare,
  Layers,
  Plus,
  Users,
  Settings2,
  Activity,
  Landmark,
  Info,
  Calendar,
  FileScan,
  Loader2,
} from "lucide-react";
import { useCallback, useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/shadcn-ui/alert-dialog";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Checkbox } from "@/shared/shadcn-ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { Label } from "@/shared/shadcn-ui/label";
import { type Capability } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useApp } from '../_hooks/use-app';
import { useWorkspace } from './workspace-provider';
⋮----
const getErrorMessage = (error: unknown, fallback: string)
⋮----
const toggleCapSelection = (capId: string) =>
const getIcon = (id: string) =>
const getSpecIcon = (type: string) =>
⋮----
<span className="font-mono text-[9px] text-muted-foreground opacity-60">SPEC_ID:
⋮----
<Button size="sm" className="gap-2" onClick=
⋮----
<Dialog open=
⋮----
```

## File: src/features/workspace.slice/core/_components/workspace-locations-panel.tsx
```typescript
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/shadcn-ui/dialog';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import type { WorkspaceLocation } from '@/shared/types';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import { createWorkspaceLocation, updateWorkspaceLocation, deleteWorkspaceLocation } from '../_actions';
interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  existing?: WorkspaceLocation;
  onSaved: () => void;
}
⋮----
// FR-L2: update
⋮----
onChange=
⋮----
onClick=
```

## File: src/features/workspace.slice/core/_components/workspace-settings.tsx
```typescript
import { HardHat, ShieldCheck, User2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn-ui/select";
import { Switch } from "@/shared/shadcn-ui/switch";
import type { Workspace, WorkspaceLifecycleState, Address, WorkspacePersonnel } from "@/shared/types";
interface WorkspaceSettingsDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: {
    name: string;
    visibility: "visible" | "hidden";
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
  }) => Promise<void>;
  loading: boolean;
}
⋮----
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  onSave,
  loading,
}: WorkspaceSettingsDialogProps)
⋮----
const handleAddressChange = (field: keyof Address, value: string) =>
const handlePersonnelChange = (field: keyof WorkspacePersonnel, value: string) =>
const handleSave = () =>
⋮----
onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          {}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              指派人員 Personnel
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <User2 className="h-3.5 w-3.5" />
                  <span>經理 Manager</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.managerId ?? ""}
                  onChange={(e) => handlePersonnelChange("managerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <HardHat className="h-3.5 w-3.5" />
                  <span>督導 Supervisor</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.supervisorId ?? ""}
                  onChange={(e) => handlePersonnelChange("supervisorId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>安衛 Safety</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.safetyOfficerId ?? ""}
                  onChange={(e) => handlePersonnelChange("safetyOfficerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
onValueChange=
⋮----
onChange={(e) => handlePersonnelChange("managerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <HardHat className="h-3.5 w-3.5" />
                  <span>督導 Supervisor</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.supervisorId ?? ""}
                  onChange={(e) => handlePersonnelChange("supervisorId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>安衛 Safety</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.safetyOfficerId ?? ""}
                  onChange={(e) => handlePersonnelChange("safetyOfficerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
onValueChange=
⋮----
onChange={(e) => handlePersonnelChange("supervisorId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>安衛 Safety</span>
                </div>
                <Input
                  placeholder="User ID / 姓名"
                  value={personnel.safetyOfficerId ?? ""}
                  onChange={(e) => handlePersonnelChange("safetyOfficerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
onValueChange=
⋮----
onChange={(e) => handlePersonnelChange("safetyOfficerId", e.target.value)}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
                Physical Address
            </Label>
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="h-11 rounded-xl"
                />
                <Input
                    placeholder="State / Province"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
            <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="h-11 rounded-xl"
            />
            <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">
              Current Lifecycle State
            </Label>
            <Select
              value={lifecycleState}
onValueChange=
```

## File: src/features/workspace.slice/core/_components/workspace-status-bar.tsx
```typescript
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/shared/shadcn-ui/badge";
import { useWorkspace } from "./workspace-provider";
⋮----
ID:
```

## File: src/features/workspace.slice/core/_hooks/use-visible-workspaces.ts
```typescript
import { useMemo } from 'react'
import { useAuth } from '@/shared/app-providers/auth-provider'
import { filterVisibleWorkspaces } from '../../_workspace.rules'
import { useAccount } from './use-account'
import { useApp } from './use-app'
export function useVisibleWorkspaces()
```

## File: src/features/workspace.slice/core/_hooks/use-workspace-commands.ts
```typescript
import { useCallback } from "react";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { deleteWorkspace } from "../_actions";
export function useWorkspaceCommands()
```

## File: src/features/workspace.slice/core/_queries.ts
```typescript
import type { ScheduleItem } from '@/features/shared-kernel';
import { db } from '@/shared/infra/firestore/firestore.client';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
  where,
} from '@/shared/infra/firestore/firestore.read.adapter';
import { snapshotToRecord } from '@/shared/infra/firestore/firestore.utils';
import type { PartnerInvite } from '@/shared/types';
import type { DailyLog } from '../business.daily/_types';
import type { AuditLog } from '../gov.audit/_types';
import type { Workspace } from './_types';
export function subscribeToDailyLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, DailyLog>) => void,
): Unsubscribe
export function subscribeToAuditLogsForAccount(
  accountId: string,
  onUpdate: (logs: Record<string, AuditLog>) => void,
): Unsubscribe
export function subscribeToInvitesForAccount(
  accountId: string,
  onUpdate: (invites: Record<string, PartnerInvite>) => void,
): Unsubscribe
export function subscribeToScheduleItemsForAccount(
  accountId: string,
  onUpdate: (items: Record<string, ScheduleItem>) => void,
): Unsubscribe
export function subscribeToWorkspacesForAccount(
  dimensionId: string,
  onUpdate: (workspaces: Record<string, Workspace>) => void,
): Unsubscribe
```

## File: src/features/workspace.slice/core/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
import type { WorkspaceGrant } from '../gov.role/_types'
import type { WorkspaceTask } from '../business.tasks/_types'
import type { WorkspaceIssue } from '../business.issues/_types'
import type { WorkspaceFile } from '../business.files/_types'
export type WorkspaceLifecycleState = 'preparatory' | 'active' | 'stopped';
export interface WorkspacePersonnel {
  managerId?: string;
  supervisorId?: string;
  safetyOfficerId?: string;
}
export interface CapabilitySpec {
  id: string;
  name: string;
  type: 'ui' | 'api' | 'data' | 'governance' | 'monitoring';
  status: 'stable' | 'beta';
  description: string;
}
export interface Capability extends CapabilitySpec {
  config?: object;
}
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  details?: string;
}
export interface WorkspaceLocation {
  locationId: string;
  label: string;
  description?: string;
  capacity?: number;
}
export interface Workspace {
  id: string;
  dimensionId: string;
  name: string;
  lifecycleState: WorkspaceLifecycleState;
  visibility: 'visible' | 'hidden';
  scope: string[];
  protocol: string;
  capabilities: Capability[];
  grants: WorkspaceGrant[];
  teamIds: string[];
  tasks?: Record<string, WorkspaceTask>;
  issues?: Record<string, WorkspaceIssue>;
  files?: Record<string, WorkspaceFile>;
  address?: Address;
  locations?: WorkspaceLocation[];
  personnel?: WorkspacePersonnel;
  createdAt: Timestamp;
}
```

## File: src/features/workspace.slice/core/index.ts
```typescript

```

## File: src/features/workspace.slice/gov.audit/_components/audit-event-item.tsx
```typescript
import { format } from "date-fns";
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Badge } from "@/shared/shadcn-ui/badge";
import { type AuditLog } from "@/shared/types";
import { AuditEventItemContainer } from "./audit-timeline";
import { AuditTypeIcon } from "./audit-type-icon";
interface AuditEventItemProps {
    log: AuditLog;
    onSelect: () => void;
}
⋮----
<span className=
```

## File: src/features/workspace.slice/gov.audit/_components/audit-timeline.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils";
interface AuditTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function AuditTimeline(
⋮----
<div className=
⋮----
interface AuditEventItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function AuditEventItemContainer(
```

## File: src/features/workspace.slice/gov.audit/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export type AuditLogType = 'create' | 'update' | 'delete' | 'security';
export interface AuditLog {
  id: string;
  accountId: string;
  workspaceId?: string;
  workspaceName?: string;
  recordedAt: Timestamp;
  actor: string;
  actorId?: string;
  action: string;
  target: string;
  type: AuditLogType;
  metadata?: {
    before?: unknown;
    after?: unknown;
    ip?: string;
  };
}
```

## File: src/features/workspace.slice/gov.audit/index.ts
```typescript

```

## File: src/features/workspace.slice/gov.role/_types.ts
```typescript
import type { Timestamp } from '@/shared/ports'
export type WorkspaceRole = 'Manager' | 'Contributor' | 'Viewer';
export interface WorkspaceGrant {
  grantId: string;
  userId: string;
  role: WorkspaceRole;
  protocol: string;
  status: 'active' | 'revoked' | 'expired';
  grantedAt: Timestamp;
  revokedAt?: Timestamp;
  expiresAt?: Timestamp;
}
```

## File: src/features/workspace.slice/gov.role/index.ts
```typescript

```

## File: src/shared-infra/firebase/firestore/firestore.indexes.json
```json
{
  "indexes": [
    {
      "collectionGroup": "dailyLogs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "recordedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "orgId", "order": "ASCENDING" },
        { "fieldPath": "recordedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "memberIds",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "schedule_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## File: src/shared/constants/routes.ts
```typescript

```

## File: src/shared/infra/firestore/repositories/workspace-business.issues.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  collection,
  query,
  orderBy,
  type FieldValue,
} from 'firebase/firestore';
import type { WorkspaceIssue, IssueComment } from '@/shared/types';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
export const createIssue = async (
  workspaceId: string,
  title: string,
  type: 'technical' | 'financial',
  priority: 'high' | 'medium',
  sourceTaskId?: string
): Promise<string> =>
export const addCommentToIssue = async (
  workspaceId: string,
  issueId: string,
  author: string,
  content: string
): Promise<void> =>
export const resolveIssue = async (
  workspaceId: string,
  issueId: string
): Promise<void> =>
export const getWorkspaceIssues = async (
  workspaceId: string
): Promise<WorkspaceIssue[]> =>
```

## File: src/shared/infra/firestore/repositories/workspace-business.parsing-imports.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  where,
  limit,
} from 'firebase/firestore';
import type { ParsingImport, ParsingImportStatus } from '@/shared/types';
import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import { addDocument, updateDocument } from '../firestore.write.adapter';
export const createParsingImport = async (
  workspaceId: string,
  importData: Omit<ParsingImport, 'id' | 'startedAt'>
): Promise<string> =>
export const getParsingImportByIdempotencyKey = async (
  workspaceId: string,
  idempotencyKey: string
): Promise<ParsingImport | null> =>
⋮----
const isTerminalParsingImportStatus = (status: ParsingImportStatus): boolean
export const updateParsingImportStatus = async (
  workspaceId: string,
  importId: string,
  updates: Pick<ParsingImport, 'status' | 'appliedTaskIds'> &
    Partial<Pick<ParsingImport, 'error'>>
): Promise<void> =>
```

## File: src/shared/infra/firestore/repositories/workspace-business.tasks.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { WorkspaceTask } from '@/shared/types';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
export const createTask = async (
  workspaceId: string,
  taskData: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> =>
export const updateTask = async (
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>
): Promise<void> =>
export const deleteTask = async (
  workspaceId: string,
  taskId: string
): Promise<void> =>
export const getWorkspaceTasks = async (
  workspaceId: string
): Promise<WorkspaceTask[]> =>
export const getWorkspaceTask = async (
  workspaceId: string,
  taskId: string
): Promise<WorkspaceTask | null> =>
```

## File: src/shared/infra/firestore/repositories/workspace-core.repository.ts
```typescript
import {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  runTransaction,
  type FieldValue,
} from 'firebase/firestore';
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceGrant,
  WorkspaceFile,
  Capability,
  WorkspaceLifecycleState,
  Account,
  WorkspaceLocation,
  Address,
  WorkspacePersonnel,
} from '@/shared/types';
import { db } from '../firestore.client';
import {
  updateDocument,
  addDocument,
  deleteDocument,
} from '../firestore.write.adapter';
export const createWorkspace = async (
  name: string,
  account: Account
): Promise<string> =>
export const authorizeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
export const revokeWorkspaceTeam = async (
  workspaceId: string,
  teamId: string
): Promise<void> =>
export const grantIndividualWorkspaceAccess = async (
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  protocol?: string
): Promise<void> =>
export const revokeIndividualWorkspaceAccess = async (
  workspaceId: string,
  grantId: string
): Promise<void> =>
export const mountCapabilities = async (
  workspaceId: string,
  capabilities: Capability[]
): Promise<void> =>
export const unmountCapability = async (
  workspaceId: string,
  capability: Capability
): Promise<void> =>
export const updateWorkspaceSettings = async (
  workspaceId: string,
  settings: {
    name: string;
    visibility: 'visible' | 'hidden';
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
  }
): Promise<void> =>
export const deleteWorkspace = async (workspaceId: string): Promise<void> =>
export const getWorkspaceFiles = async (
  workspaceId: string
): Promise<WorkspaceFile[]> =>
export const getWorkspaceGrants = async (
  workspaceId: string
): Promise<WorkspaceGrant[]> =>
export const createWorkspaceLocation = async (
  workspaceId: string,
  location: WorkspaceLocation
): Promise<void> =>
export const updateWorkspaceLocation = async (
  workspaceId: string,
  locationId: string,
  updates: Partial<Pick<WorkspaceLocation, 'label' | 'description' | 'capacity'>>
): Promise<void> =>
export const deleteWorkspaceLocation = async (
  workspaceId: string,
  locationId: string
): Promise<void> =>
```

## File: src/shared/shadcn-ui/accordion.tsx
```typescript
import { ChevronDown } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/alert-dialog.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { buttonVariants } from "@/shared/shadcn-ui/button"
⋮----
className=
```

## File: src/shared/shadcn-ui/alert.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/avatar.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/badge.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
function Badge(
⋮----
<div className=
```

## File: src/shared/shadcn-ui/breadcrumb.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/button-group.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Separator } from "@/shared/shadcn-ui/separator"
⋮----
className=
```

## File: src/shared/shadcn-ui/button.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
⋮----
className=
```

## File: src/shared/shadcn-ui/calendar.tsx
```typescript
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Button, buttonVariants } from "@/shared/shadcn-ui/button"
⋮----
className=
```

## File: src/shared/shadcn-ui/card.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/carousel.tsx
```typescript
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Button } from "@/shared/shadcn-ui/button"
type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]
type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps
⋮----
function useCarousel()
⋮----
className=
```

## File: src/shared/shadcn-ui/chart.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}
type ChartContextProps = {
  config: ChartConfig
}
⋮----
function useChart()
⋮----
className=
⋮----
<div className=
⋮----
return <div className=
```

## File: src/shared/shadcn-ui/checkbox.tsx
```typescript
import { Check } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/command.tsx
```typescript
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Dialog, DialogContent } from "@/shared/shadcn-ui/dialog"
⋮----
className=
```

## File: src/shared/shadcn-ui/context-menu.tsx
```typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/dialog.tsx
```typescript
import { X } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/drawer.tsx
```typescript
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/dropdown-menu.tsx
```typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/empty.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
⋮----
className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}
function EmptyTitle(
```

## File: src/shared/shadcn-ui/field.tsx
```typescript
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Label } from "@/shared/shadcn-ui/label"
import { Separator } from "@/shared/shadcn-ui/separator"
⋮----
className=
```

## File: src/shared/shadcn-ui/form.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Label } from "@/shared/shadcn-ui/label"
⋮----
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}
⋮----
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) =>
const useFormField = () =>
type FormItemContextValue = {
  id: string
}
⋮----
className=
```

## File: src/shared/shadcn-ui/hooks/use-mobile.tsx
```typescript
export function useIsMobile()
⋮----
const onChange = () =>
```

## File: src/shared/shadcn-ui/hooks/use-toast.ts
```typescript
import type {
  ToastActionElement,
  ToastProps,
} from "@/shared/shadcn-ui/toast"
⋮----
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
⋮----
function genId()
type ActionType = typeof _actionTypes
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }
interface State {
  toasts: ToasterToast[]
}
⋮----
const addToRemoveQueue = (toastId: string) =>
export const reducer = (state: State, action: Action): State =>
⋮----
function dispatch(action: Action)
type Toast = Omit<ToasterToast, "id">
function toast(
⋮----
const update = (props: ToasterToast)
const dismiss = () => dispatch(
⋮----
function useToast()
```

## File: src/shared/shadcn-ui/hover-card.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/input-group.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Button } from "@/shared/shadcn-ui/button"
import { Input } from "@/shared/shadcn-ui/input"
import { Textarea } from "@/shared/shadcn-ui/textarea"
⋮----
className=
⋮----
if ((e.target as HTMLElement).closest("button"))
```

## File: src/shared/shadcn-ui/input-otp.tsx
```typescript
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/input.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/item.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Separator } from "@/shared/shadcn-ui/separator"
function ItemGroup(
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>)
⋮----
className=
```

## File: src/shared/shadcn-ui/kbd.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/label.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/menubar.tsx
```typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/navigation-menu.tsx
```typescript
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
<div className=
⋮----
className=
```

## File: src/shared/shadcn-ui/pagination.tsx
```typescript
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { ButtonProps, buttonVariants } from "@/shared/shadcn-ui/button"
const Pagination = (
⋮----
type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">
const PaginationLink = (
⋮----
className=
⋮----
const PaginationPrevious = (
```

## File: src/shared/shadcn-ui/popover.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/progress.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/radio-group.tsx
```typescript
import { Circle } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/scroll-area.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/select.tsx
```typescript
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/separator.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/sheet.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/skeleton.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>)
⋮----
className=
```

## File: src/shared/shadcn-ui/slider.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/spinner.tsx
```typescript
import { Loader2Icon } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
function Spinner(
⋮----
className=
```

## File: src/shared/shadcn-ui/switch.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/table.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/tabs.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/textarea.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/shadcn-ui/timeline.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils";
interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  children: React.ReactNode;
}
⋮----
interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  isLast?: boolean;
  isActive?: boolean;
}
⋮----
className=
```

## File: src/shared/shadcn-ui/toast.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/toaster.tsx
```typescript
import { useToast } from "@/shared/shadcn-ui/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/shared/shadcn-ui/toast"
```

## File: src/shared/shadcn-ui/toggle-group.tsx
```typescript
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { toggleVariants } from "@/shared/shadcn-ui/toggle"
```

## File: src/shared/shadcn-ui/toggle.tsx
```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/shadcn-ui/utils/utils"
```

## File: src/shared/shadcn-ui/tooltip.tsx
```typescript
import { cn } from "@/shared/shadcn-ui/utils/utils"
⋮----
className=
```

## File: src/shared/types/account.types.ts
```typescript

```

## File: src/shared/types/audit.types.ts
```typescript

```

## File: src/shared/types/daily.types.ts
```typescript

```

## File: src/shared/types/skill.types.ts
```typescript

```

## File: src/shared/types/task.types.ts
```typescript

```

## File: tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/shadcn-ui": ["./src/shared/shadcn-ui"],
      "@/shared/shadcn-ui/*": ["./src/shared/shadcn-ui/*"],
      "@/shared/lib/utils": ["./src/shared/lib/utils"],
      "@/shared/hooks": ["./src/shared/hooks"],
      "@/shared/hooks/*": ["./src/shared/hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": [
    "node_modules",
    "src/shared-infra/firebase/functions/**"
  ]
}
```

## File: src/features/account.slice/index.ts
```typescript

```

## File: src/features/scheduling.slice/_components/proposal-dialog.tsx
```typescript
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, MapPin, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { type DateRange } from "react-day-picker";
import type { SkillRequirement } from "@/features/shared-kernel";
import { getOrgSkillTags } from "@/features/skill-xp.slice";
import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills";
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Calendar } from "@/shared/shadcn-ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/shadcn-ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/shadcn-ui/dialog";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/shadcn-ui/popover";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type Location } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
⋮----
interface ProposalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    location: Location;
    requiredSkills: SkillRequirement[];
  }) => Promise<void>;
  initialDate: Date;
  orgId?: string;
}
export function ProposalDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialDate,
  orgId,
}: ProposalDialogProps)
⋮----
/** Value string for cmdk filtering — covers zh + en + sub-category labels. */
⋮----
const handleLocationChange = (field: keyof Location, value: string) =>
const handleAddSkillRequirement = () =>
const handleRemoveSkillRequirement = (slug: string) =>
const handleSubmit = async () =>
⋮----
<Input id="item-title" value=
⋮----

⋮----
<button
                        type="button"
                        onClick={() => handleRemoveSkillRequirement(req.tagSlug)}
                        className="ml-1 rounded-full hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
⋮----
setSelectedSkillSlug(skill.slug);
setSkillPickerOpen(false);
```

## File: src/features/scheduling.slice/_hooks/use-schedule-commands.ts
```typescript
import { useCallback } from "react";
import { getOrgMemberEligibilityWithTier } from "@/features/projection.bus";
import { tierSatisfies } from "@/features/shared-kernel";
import type { ScheduleItem } from '@/features/shared-kernel';
import { useApp } from "@/shared/app-providers/app-context";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { canTransitionScheduleStatus } from "../_schedule.rules";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import {
    assignMember as assignMemberAction,
    unassignMember as unassignMemberAction,
    updateScheduleItemStatus,
} from "../_actions";
import { getAccountActiveAssignments } from "../_queries";
export function useScheduleActions()
```

## File: src/features/workspace.slice/business.document-parser/_queries.ts
```typescript
import { SUBCOLLECTIONS } from '@/shared/infra/firestore/collection-paths';
import { db } from '@/shared/infra/firestore/firestore.client';
import { collection, query, orderBy, onSnapshot, type Unsubscribe } from '@/shared/infra/firestore/firestore.read.adapter';
import type { ParsingIntent } from './_types';
export function subscribeToParsingIntents(
  workspaceId: string,
  onUpdate: (intents: ParsingIntent[]) => void
): Unsubscribe
```

## File: src/features/workspace.slice/business.document-parser/_types.ts
```typescript
import type { SkillRequirement } from '@/features/shared-kernel'
import type { Timestamp } from '@/shared/ports'
export type IntentID = string & { readonly _brand: 'IntentID' }
export type SourcePointer = string & { readonly _brand: 'SourcePointer' }
export interface ParsedLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}
export type ParsingIntentSourceType = 'ai' | 'human' | 'system';
export type ParsingIntentReviewStatus =
  | 'not_required'
  | 'pending_review'
  | 'approved'
  | 'rejected';
export interface ParsingIntent {
  id: IntentID;
  workspaceId: string;
  sourceFileName: string;
  sourceFileDownloadURL?: SourcePointer;
  sourceFileId?: string;
  intentVersion: number;
  supersededByIntentId?: IntentID;
  baseIntentId?: IntentID;
  lineItems: ParsedLineItem[];
  skillRequirements?: SkillRequirement[];
  parserVersion?: string;
  modelVersion?: string;
  sourceType: ParsingIntentSourceType;
  reviewStatus: ParsingIntentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  semanticHash?: string;
  status: 'pending' | 'importing' | 'imported' | 'superseded' | 'failed';
  createdAt: Timestamp;
  importedAt?: Timestamp;
}
export type ParsingImportStatus =
  | 'started'
  | 'applied'
  | 'partial'
  | 'failed';
export interface ParsingImport {
  id: string;
  workspaceId: string;
  intentId: IntentID;
  intentVersion: number;
  idempotencyKey: string;
  status: ParsingImportStatus;
  appliedTaskIds: string[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
  error?: {
    code: string;
    message: string;
  };
}
```

## File: src/features/workspace.slice/business.parsing-intent/_contract.ts
```typescript
import type { SkillRequirement } from '@/features/shared-kernel';
export type ParsingIntentStatus = 'pending' | 'importing' | 'imported' | 'superseded' | 'failed';
export type ParsingIntentSourceType = 'ai' | 'human' | 'system';
export type ParsingIntentReviewStatus =
  | 'not_required'
  | 'pending_review'
  | 'approved'
  | 'rejected';
export interface ParsingIntentContract {
  intentId: string;
  workspaceId: string;
  sourceFileId: string;
  sourceVersionId: string;
  intentVersion: number;
  baseIntentId?: string;
  taskDraftCount: number;
  skillRequirements: SkillRequirement[];
  parserVersion?: string;
  modelVersion?: string;
  sourceType: ParsingIntentSourceType;
  reviewStatus: ParsingIntentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  semanticHash?: string;
  status: ParsingIntentStatus;
  supersededByIntentId?: string;
  createdAt: number;
  updatedAt: number;
}
export interface CreateParsingIntentInput {
  intentId: string;
  workspaceId: string;
  sourceFileId: string;
  sourceVersionId: string;
  intentVersion?: number;
  baseIntentId?: string;
  taskDraftCount: number;
  skillRequirements?: SkillRequirement[];
  parserVersion?: string;
  modelVersion?: string;
  sourceType?: ParsingIntentSourceType;
  reviewStatus?: ParsingIntentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  semanticHash?: string;
}
export function createParsingIntentContract(
  input: CreateParsingIntentInput
): ParsingIntentContract
export function markParsingIntentImported(
  current: ParsingIntentContract
): ParsingIntentContract
export function supersedeParsingIntent(
  current: ParsingIntentContract,
  nextIntentId: string
): ParsingIntentContract
```

## File: src/features/workspace.slice/business.workflow/index.ts
```typescript

```

## File: src/features/workspace.slice/core/_components/workflow-blockers-state.ts
```typescript
export type WorkflowBlockersState = Record<string, number>
export type WorkflowBlockersSource = {
  workflowId: string
  blockedBy?: string[]
}
export function applyWorkflowBlocked(
  state: WorkflowBlockersState,
  workflowId: string,
  blockedByCount: number
): WorkflowBlockersState
export function applyWorkflowUnblocked(
  state: WorkflowBlockersState,
  workflowId: string,
  blockedByCount = 0
): WorkflowBlockersState
export function deriveWorkflowBlockersFromSources(
  sources: readonly WorkflowBlockersSource[]
): WorkflowBlockersState
export function summarizeWorkflowBlockers(state: WorkflowBlockersState)
```

## File: src/features/workspace.slice/gov.members/_components/members-panel.tsx
```typescript
import {
  Users,
  Trash2,
  ShieldCheck,
  Globe,
  Plus,
  CheckCircle2,
  ShieldAlert,
  MoreVertical
} from "lucide-react";
import { useState, useMemo } from "react";
import { useApp } from '@/shared/app-providers/app-context';
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/shadcn-ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/shadcn-ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/shadcn-ui/dropdown-menu";
import { Label } from "@/shared/shadcn-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn-ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/shadcn-ui/tabs";
import { type Team, type WorkspaceRole, type MemberReference } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
const getErrorMessage = (error: unknown, fallback: string)
export function WorkspaceMembers()
⋮----
const handleToggleTeam = async (team: Team, isAuthorized: boolean) =>
const handleConfirmGrant = async () =>
const handleRevokeGrant = async (grantId: string) =>
⋮----
<DropdownMenuItem onClick=
```

## File: src/shared/infra/firestore/firestore.facade.ts
```typescript

```

## File: src/shared/infra/firestore/repositories/index.ts
```typescript

```

## File: src/shared/shadcn-ui/sidebar.tsx
```typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import { useIsMobile } from "@/shared/shadcn-ui/hooks/use-mobile"
import { cn } from "@/shared/shadcn-ui/utils/utils"
import { Button } from "@/shared/shadcn-ui/button"
import { Input } from "@/shared/shadcn-ui/input"
import { Separator } from "@/shared/shadcn-ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/shadcn-ui/sheet"
import { Skeleton } from "@/shared/shadcn-ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip"
⋮----
type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
⋮----
function useSidebar()
⋮----
const handleKeyDown = (event: KeyboardEvent) =>
⋮----
className=
⋮----
{/* This is what handles the sidebar gap on desktop */}
⋮----
onClick?.(event)
toggleSidebar()
```

## File: src/features/organization.slice/core/_components/org-settings.tsx
```typescript
import { AlertTriangle, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { useApp } from "@/shared/app-providers/app-context";
import { ROUTES } from "@/shared/constants/routes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/shadcn-ui/alert-dialog";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useOrganizationManagement } from "../_hooks/use-organization-management";
⋮----
const handleSave = async () =>
const handleDelete = async () =>
```

## File: src/features/scheduling.slice/_components/demand-board.tsx
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SkillRequirement } from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';
import { SKILLS } from '@/shared/constants/skills';
import type { Timestamp } from '@/shared/ports';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import {
  approveScheduleItemWithMember,
  updateScheduleItemStatus,
} from '../_actions';
function formatTimestamp(ts: Timestamp | string | undefined): string
interface OrgMember {
  id: string;
  name: string;
}
interface DemandRowProps {
  item: ScheduleItem;
  orgMembers: OrgMember[];
  orgId: string;
}
```

## File: src/features/workspace.slice/business.document-parser/index.ts
```typescript

```

## File: src/features/workspace.slice/business.files/_components/files-view.tsx
```typescript
import {
  FileText,
  UploadCloud,
  Clock,
  History,
  RotateCcw,
  Trash2,
  MoreVertical,
  ImageIcon,
  FileArchive,
  FileCode,
  FileJson,
  User,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  FileScan,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/shared/app-providers/auth-provider";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/shared/shadcn-ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/shadcn-ui/table";
import type { WorkspaceFile, WorkspaceFileVersion } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { useWorkspace } from '../../core';
import {
  createWorkspaceFile,
  addWorkspaceFileVersion,
  restoreWorkspaceFileVersion,
} from '../_actions';
import { subscribeToWorkspaceFiles } from '../_queries';
import { uploadRawFile } from '../_storage-actions';
const getErrorMessage = (error: unknown, fallback: string)
const formatBytes = (bytes: number): string =>
⋮----
const getFileIcon = (fileName: string) =>
const handleUploadClick = () =>
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) =>
const handleRestore = async (file: WorkspaceFile, versionId: string) =>
⋮----
<DropdownMenuItem onClick=
⋮----
<div className=
```

## File: src/features/workspace.slice/core/_use-cases.ts
```typescript
import type { CommandResult } from '@/features/shared-kernel';
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import type {
  Account,
  Capability,
  WorkspaceLifecycleState,
  Address,
  WorkspacePersonnel,
} from "@/shared/types";
import { createWorkspace, mountCapabilities, updateWorkspaceSettings, deleteWorkspace } from "./_actions";
export async function createWorkspaceWithCapabilities(
  name: string,
  account: Account,
  capabilities: Capability[] = []
): Promise<CommandResult>
export const handleCreateWorkspace = async (
  name: string,
  activeAccount: Account | null,
  onSuccess: () => void,
  t: (key: string) => string
) =>
export const handleUpdateWorkspaceSettings = async (
  workspaceId: string,
  settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address; personnel?: WorkspacePersonnel },
  onSuccess: () => void
) =>
export const handleDeleteWorkspace = async (workspaceId: string, onSuccess: () => void) =>
```

## File: src/features/workspace.slice/index.ts
```typescript

```

## File: src/shared/infra/firestore/collection-paths.ts
```typescript

```

## File: src/shared/shadcn-ui/utils/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[])
export function firestoreTimestampToISO(ts: unknown): string
export function hexToHsl(hex: string): string
```

## File: src/features/scheduling.slice/_components/unified-calendar-grid.tsx
```typescript
import { format, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Plus, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ScheduleItem, Timestamp } from "@/features/shared-kernel";
import { findSkill } from "@/shared/constants/skills";
import { cn } from "@/shared/shadcn-ui/utils/utils";
import { Avatar, AvatarFallback } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/shadcn-ui/tooltip";
import { type MemberReference } from "@/shared/types";
⋮----
interface UnifiedCalendarGridProps {
  items: ScheduleItem[];
  members: MemberReference[];
  viewMode: 'workspace' | 'organization';
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onItemClick?: (item: ScheduleItem) => void;
  onAddClick?: (date: Date) => void;
  onApproveProposal?: (item: ScheduleItem) => void;
  onRejectProposal?: (item: ScheduleItem) => void;
  renderItemActions?: (item: ScheduleItem) => React.ReactNode;
}
⋮----
const toDate = (timestamp: Timestamp | Date |
⋮----
<div className=
⋮----
e.stopPropagation();
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-destructive" onClick=
⋮----
<Button size="icon" variant="ghost" className="size-6 p-0 text-green-600" onClick=
```

## File: src/features/scheduling.slice/index.ts
```typescript

```

## File: src/features/workspace.slice/business.tasks/_components/tasks-view.tsx
```typescript
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Settings2,
  Trash2,
  Coins,
  Clock,
  View,
  BarChart3,
  CalendarPlus,
  ClipboardPlus,
  OctagonX,
  Send,
  UploadCloud,
  X,
  Loader2,
  Paperclip,
  MapPin,
} from 'lucide-react';
import Image from "next/image";
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/shared/shadcn-ui/utils/utils';
import { buildTaskTree } from '../../_task.rules';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/shadcn-ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/shadcn-ui/dropdown-menu';
import { Input } from '@/shared/shadcn-ui/input';
import { Label } from '@/shared/shadcn-ui/label';
import { Progress } from '@/shared/shadcn-ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/shadcn-ui/select';
import { Textarea } from '@/shared/shadcn-ui/textarea';
import { type WorkspaceTask, type Location , type TaskWithChildren } from '@/shared/types';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import { useStorage } from '../../business.files';
import { useWorkspace } from '../../core';
const getErrorMessage = (error: unknown, fallback: string)
function ProgressReportDialog({
  task,
  isOpen,
  onClose,
  onSubmit,
}: {
  task: TaskWithChildren | null;
  isOpen: boolean;
onClose: ()
⋮----
const handleSubmit = async () =>
⋮----
const handleLocationChange = (field: keyof Location, value: string) =>
const handleSaveTask = async () =>
const handleReportProgress = async (taskId: string, newCompletedQuantity: number) =>
const handleSubmitForQA = async (task: TaskWithChildren) =>
const handleDeleteTask = async (node: TaskWithChildren) =>
const handleScheduleRequest = (task: WorkspaceTask) =>
const handleMarkBlocked = async (task: TaskWithChildren) =>
const toggleColumn = (key: string) =>
const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
const handleRemovePhoto = (index: number) =>
⋮----
className=
```

## File: src/features/workspace.slice/core/_components/workspace-card.tsx
```typescript
import {
  Building2,
  Eye,
  EyeOff,
  HardHat,
  Hash,
  MapPin,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useI18n } from "@/config/i18n/i18n-provider";
import { ROUTES } from "@/shared/constants/routes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/shadcn-ui/alert-dialog";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/shadcn-ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/shadcn-ui/tooltip";
import type { Workspace, WorkspaceLifecycleState, Address, WorkspacePersonnel } from "@/shared/types";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { deleteWorkspace, updateWorkspaceSettings } from "../_actions";
import { WorkspaceSettingsDialog } from "./workspace-settings";
interface WorkspaceCardProps {
  workspace: Workspace;
}
function buildMapsUrl(address: Workspace["address"]): string
function PersonnelSlot({
  icon: Icon,
  label,
  userId,
  onAssign,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  userId?: string;
onAssign: ()
⋮----
onClick=
⋮----
const handleSettingsSave = async (settings: {
    name: string;
    visibility: "visible" | "hidden";
    lifecycleState: WorkspaceLifecycleState;
    address?: Address;
    personnel?: WorkspacePersonnel;
}) =>
const handleDestroyConfirm = async () =>
⋮----
href=
```

## File: src/features/workspace.slice/core/_components/workspace-provider.tsx
```typescript
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { initTagChangedSubscriber } from '@/features/notification-hub.slice';
import {
  createScheduleItem as createScheduleItemAction,
} from '@/features/scheduling.slice'
import type { CommandResult, ScheduleItem } from '@/features/shared-kernel';
import { firestoreTimestampToISO } from '@/shared/shadcn-ui/utils/utils';
import { type Workspace, type AuditLog, type WorkspaceTask, type WorkspaceRole, type Capability, type WorkspaceLifecycleState, type Address, type WorkspacePersonnel } from '@/shared/types';
import { registerOrgPolicyCache, runTransaction } from '../../application';
import {
  createIssue as createIssueAction,
  addCommentToIssue as addCommentToIssueAction,
  resolveIssue as resolveIssueAction,
} from '../../business.issues'
import {
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  getWorkspaceTask as getWorkspaceTaskAction,
} from '../../business.tasks'
import { listWorkflowStates } from '../../business.workflow'
import { WorkspaceEventBus , WorkspaceEventContext, registerWorkspaceFunnel, registerOrganizationFunnel, type WorkspaceEventName, type FileSendToParserPayload } from '../../core.event-bus';
import { writeAuditLog } from '../../gov.audit/_actions';
import {
  authorizeWorkspaceTeam as authorizeWorkspaceTeamAction,
  revokeWorkspaceTeam as revokeWorkspaceTeamAction,
  grantIndividualWorkspaceAccess as grantIndividualWorkspaceAccessAction,
  revokeIndividualWorkspaceAccess as revokeIndividualWorkspaceAccessAction,
  mountCapabilities as mountCapabilitiesAction,
  unmountCapability as unmountCapabilityAction,
  updateWorkspaceSettings as updateWorkspaceSettingsAction,
  deleteWorkspace as deleteWorkspaceAction,
} from '../_actions'
import { useAccount } from '../_hooks/use-account';
import { useApp } from '../_hooks/use-app';
import {
  applyWorkflowBlocked,
  applyWorkflowUnblocked,
  deriveWorkflowBlockersFromSources,
  summarizeWorkflowBlockers,
  type WorkflowBlockersState,
} from './workflow-blockers-state';
interface WorkspaceContextType {
  workspace: Workspace;
  localAuditLogs: AuditLog[];
  logAuditEvent: (action: string, detail: string, type: 'create' | 'update' | 'delete') => Promise<void>;
  eventBus: WorkspaceEventBus;
  protocol: string;
  scope: string[];
  createTask: (task: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommandResult>;
  updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<CommandResult>;
  authorizeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  revokeWorkspaceTeam: (teamId: string) => Promise<CommandResult>;
  grantIndividualWorkspaceAccess: (userId: string, role: WorkspaceRole, protocol?: string) => Promise<CommandResult>;
  revokeIndividualWorkspaceAccess: (grantId: string) => Promise<CommandResult>;
  mountCapabilities: (capabilities: Capability[]) => Promise<CommandResult>;
  unmountCapability: (capability: Capability) => Promise<CommandResult>;
  updateWorkspaceSettings: (settings: { name: string; visibility: 'visible' | 'hidden'; lifecycleState: WorkspaceLifecycleState; address?: Address; personnel?: WorkspacePersonnel }) => Promise<CommandResult>;
  deleteWorkspace: () => Promise<CommandResult>;
  createIssue: (title: string, type: 'technical' | 'financial', priority: 'high' | 'medium', sourceTaskId?: string) => Promise<CommandResult>;
  addCommentToIssue: (issueId: string, author: string, content: string) => Promise<CommandResult>;
  resolveIssue: (issueId: string, issueTitle: string, resolvedBy: string, sourceTaskId?: string) => Promise<void>;
  createScheduleItem: (itemData: CreateScheduleItemInput) => Promise<CommandResult>;
  pendingParseFile: FileSendToParserPayload | null;
  setPendingParseFile: (payload: FileSendToParserPayload | null) => void;
  workflowBlockers: WorkflowBlockersState;
  blockedWorkflowCount: number;
  totalBlockedByCount: number;
  hasBlockedWorkflows: boolean;
}
export type CreateScheduleItemInput = Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
  startDate?: Date | null;
  endDate?: Date | null;
};
⋮----
export function WorkspaceProvider(
⋮----
const hydrateWorkflowBlockers = async () =>
⋮----
export function useWorkspace()
```

## File: src/features/workspace.slice/business.document-parser/_components/document-parser-view.tsx
```typescript
import { Loader2, UploadCloud, File as FileIcon, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useActionState, useTransition, useRef, useEffect, useCallback, useState, type ChangeEvent } from 'react';
import type { WorkItem } from '@/app-runtime/ai/schemas/docu-parse';
import { logDomainError } from '@/features/observability';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/shadcn-ui/card';
import { useToast } from '@/shared/shadcn-ui/hooks/use-toast';
import { persistWorkspaceOutboxEvent } from '../../application/_outbox';
import { useWorkspace } from '../../core';
import {
  extractDataFromDocument,
  type ActionState,
} from '../_form-actions';
import {
  INITIAL_PARSING_INTENT_VERSION,
  saveParsingIntent,
} from '../_intent-actions';
import { subscribeToParsingIntents } from '../_queries';
import type { IntentID, SourcePointer, ParsingIntent } from '../_types';
⋮----
function WorkItemsTable({
  initialData,
  onImport,
}: {
  initialData: WorkItem[];
onImport: ()
export function WorkspaceDocumentParser()
⋮----
// On mount: if files-view queued a file via WorkspaceProvider context, auto-trigger.
// This bridges the cross-tab gap — subscriber only exists when this component is mounted.
// Deps intentionally empty: pendingParseFile/setPendingParseFile are stable React state
// references, triggerParseFromURL is stable via useCallback, and we only want to run once
// on mount (not re-run whenever pendingParseFile changes later).
⋮----
// eslint-disable-next-line react-hooks/exhaustive-deps
⋮----
const handleFileChange = (event: ChangeEvent<HTMLInputElement>) =>
const handleUploadClick = () =>
const handleImport = async () =>
⋮----
// Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
```

## File: src/features/workspace.slice/core.event-bus/_events.ts
```typescript
import type { SkillRequirement, WorkspaceScheduleProposedPayload } from "@/features/shared-kernel"
import type { DailyLog } from "../business.daily/_types"
import type { WorkspaceTask } from "../business.tasks/_types"
⋮----
export interface WorkspaceTaskCompletedPayload {
  task: WorkspaceTask
  traceId?: string
}
export interface WorkspaceTaskScheduleRequestedPayload {
  taskName: string
}
export interface QualityAssuranceRejectedPayload {
  task: WorkspaceTask
  rejectedBy: string
  traceId?: string
}
export interface WorkspaceAcceptanceFailedPayload {
  task: WorkspaceTask
  rejectedBy: string
  traceId?: string
}
export interface WorkspaceQualityAssuranceApprovedPayload {
  task: WorkspaceTask
  approvedBy: string
}
export interface WorkspaceAcceptancePassedPayload {
  task: WorkspaceTask
  acceptedBy: string
}
export interface DocumentParserItemsExtractedPayload {
  sourceDocument: string
  intentId: string
  intentVersion: number
  autoImport?: boolean
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    discount?: number
    subtotal: number
  }>
  skillRequirements?: SkillRequirement[]
}
export interface IntentDeltaProposedPayload {
  intentId: string
  intentVersion: number
  workspaceId: string
  sourceFileName: string
  taskDraftCount: number
  oldIntentId?: string
  skillRequirements?: SkillRequirement[]
  traceId?: string
}
export interface DailyLogForwardRequestedPayload {
  log: DailyLog
  targetCapability: "tasks" | "issues"
  action: "create"
}
export interface FileSendToParserPayload {
  fileName: string
  downloadURL: string
  fileType: string
  fileId?: string
}
export interface WorkspaceIssueResolvedPayload {
  issueId: string
  issueTitle: string
  resolvedBy: string
  sourceTaskId?: string
  traceId?: string
}
export interface WorkspaceWorkflowBlockedPayload {
  workflowId: string
  issueId: string
  blockedByCount: number
  traceId?: string
}
export interface WorkspaceWorkflowUnblockedPayload {
  workflowId: string
  issueId: string
  blockedByCount: number
  traceId?: string
}
export interface WorkspaceFinanceDisbursementFailedPayload {
  taskId: string
  taskTitle: string
  amount: number
  reason: string
  traceId?: string
}
export interface WorkspaceTaskBlockedPayload {
  task: WorkspaceTask
  reason?: string
  traceId?: string
}
export interface WorkspaceTaskAssignedPayload {
  taskId: string
  taskName: string
  assigneeId: string
  workspaceId: string
  sourceIntentId?: string
  requiredSkills?: SkillRequirement[]
  traceId?: string
}
export type WorkspaceEventName =
  | "workspace:tasks:completed"
  | "workspace:tasks:scheduleRequested"
  | "workspace:tasks:blocked"
  | "workspace:tasks:assigned"
  | "workspace:schedule:proposed"
  | "workspace:quality-assurance:rejected"
  | "workspace:acceptance:failed"
  | "workspace:quality-assurance:approved"
  | "workspace:acceptance:passed"
  | "workspace:document-parser:itemsExtracted"
  | "workspace:files:sendToParser"
  | "workspace:issues:resolved"
  | "workspace:workflow:blocked"
  | "workspace:workflow:unblocked"
  | "workspace:finance:disburseFailed"
  | "daily:log:forwardRequested"
  | "workspace:parsing-intent:deltaProposed"
export interface WorkspaceEventPayloadMap {
  "workspace:tasks:completed": WorkspaceTaskCompletedPayload
  "workspace:tasks:scheduleRequested": WorkspaceTaskScheduleRequestedPayload
  "workspace:tasks:blocked": WorkspaceTaskBlockedPayload
  "workspace:tasks:assigned": WorkspaceTaskAssignedPayload
  "workspace:schedule:proposed": WorkspaceScheduleProposedPayload
  "workspace:quality-assurance:rejected": QualityAssuranceRejectedPayload
  "workspace:acceptance:failed": WorkspaceAcceptanceFailedPayload
  "workspace:quality-assurance:approved": WorkspaceQualityAssuranceApprovedPayload
  "workspace:acceptance:passed": WorkspaceAcceptancePassedPayload
  "workspace:document-parser:itemsExtracted": DocumentParserItemsExtractedPayload
  "workspace:files:sendToParser": FileSendToParserPayload
  "workspace:issues:resolved": WorkspaceIssueResolvedPayload
  "workspace:workflow:blocked": WorkspaceWorkflowBlockedPayload
  "workspace:workflow:unblocked": WorkspaceWorkflowUnblockedPayload
  "workspace:finance:disburseFailed": WorkspaceFinanceDisbursementFailedPayload
  "daily:log:forwardRequested": DailyLogForwardRequestedPayload
  "workspace:parsing-intent:deltaProposed": IntentDeltaProposedPayload
}
export type WorkspaceEventPayload<T extends WorkspaceEventName> =
  WorkspaceEventPayloadMap[T]
export type WorkspaceEventHandler<T extends WorkspaceEventName> = (
  payload: WorkspaceEventPayload<T>
) => Promise<void> | void
export type PublishFn = <T extends WorkspaceEventName>(
  type: T,
  payload: WorkspaceEventPayload<T>
) => void
export type SubscribeFn = <T extends WorkspaceEventName>(
  type: T,
  handler: WorkspaceEventHandler<T>
) => () => void
```

## File: src/shared/infra/firestore/repositories/workspace-business.document-parser.repository.ts
```typescript
import {
  serverTimestamp,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import type { ParsingIntent } from '@/shared/types';
import { SUBCOLLECTIONS } from '../collection-paths';
import { db } from '../firestore.client';
import { createConverter } from '../firestore.converter';
import { getDocuments } from '../firestore.read.adapter';
import {
  updateDocument,
  addDocument,
} from '../firestore.write.adapter';
export const createParsingIntent = async (
  workspaceId: string,
  intentData: Omit<ParsingIntent, 'id' | 'createdAt'>
): Promise<string> =>
export const updateParsingIntentStatus = async (
  workspaceId: string,
  intentId: string,
  status: 'importing' | 'imported' | 'failed' | 'superseded'
): Promise<void> =>
export const supersedeParsingIntent = async (
  workspaceId: string,
  oldIntentId: string,
  newIntentId: string
): Promise<void> =>
export const getParsingIntents = async (
  workspaceId: string
): Promise<ParsingIntent[]> =>
```

## File: src/shared/types/workspace.types.ts
```typescript

```

## File: src/features/workspace.slice/business.document-parser/_intent-actions.ts
```typescript
import type { SkillRequirement } from '@/features/shared-kernel'
import {
  createParsingImport as createParsingImportFacade,
  createParsingIntent as createParsingIntentFacade,
  getParsingImportByIdempotencyKey as getParsingImportByIdempotencyKeyFacade,
  supersedeParsingIntent as supersedeParsingIntentFacade,
  updateParsingImportStatus as updateParsingImportStatusFacade,
  updateParsingIntentStatus as updateParsingIntentStatusFacade,
} from '@/shared/infra/firestore/firestore.facade'
import type { Timestamp } from '@/shared/ports'
import type {
  ParsedLineItem,
  IntentID,
  SourcePointer,
  ParsingImport,
  ParsingImportStatus,
  ParsingIntentReviewStatus,
  ParsingIntentSourceType,
} from './_types'
⋮----
function stableSerialize(value: unknown, seen = new WeakSet<object>()): string
async function createSemanticHash(lineItems: ParsedLineItem[]): Promise<string>
export type ParsingImportStartResult = {
  importId: string
  idempotencyKey: string
  status: ParsingImportStatus
  isDuplicate: boolean
}
export type ParsingImportFinishInput = {
  status: ParsingImportStatus
  appliedTaskIds: string[]
  error?: {
    code: string
    message: string
  }
}
/**
 * Builds the canonical idempotency key for one intent materialization attempt.
 *
 * intentId      = ParsingIntent aggregate ID.
 * intentVersion = ParsingIntent version for that aggregate snapshot.
 *
 * Format: import:{intentId}:{intentVersion}
 */
export function buildParsingImportIdempotencyKey(
  intentId: string,
  intentVersion: number
): string
export type SaveParsingIntentResult = {
  intentId: IntentID
  /** Present when a previous intent was superseded by this save. */
  oldIntentId?: IntentID
}
⋮----
/** Present when a previous intent was superseded by this save. */
⋮----
export async function saveParsingIntent(
  workspaceId: string,
  sourceFileName: string,
  lineItems: ParsedLineItem[],
  options?: {
    sourceFileDownloadURL?: SourcePointer
    sourceFileId?: string
    skillRequirements?: SkillRequirement[]
    intentVersion?: number
    parserVersion?: string
    modelVersion?: string
    sourceType?: ParsingIntentSourceType
    reviewStatus?: ParsingIntentReviewStatus
    reviewedBy?: string
    reviewedAt?: Timestamp
    semanticHash?: string
    baseIntentId?: IntentID
    /** When provided, the old intent is marked as superseded by the new intent [#A4]. */
    previousIntentId?: IntentID
  }
): Promise<SaveParsingIntentResult>
⋮----
/** When provided, the old intent is marked as superseded by the new intent [#A4]. */
⋮----
export async function startParsingImport(
  workspaceId: string,
  intentId: string,
  intentVersion = INITIAL_PARSING_INTENT_VERSION
): Promise<ParsingImportStartResult>
export async function finishParsingImport(
  workspaceId: string,
  importId: string,
  input: ParsingImportFinishInput
): Promise<void>
export async function markParsingIntentImported(
  workspaceId: string,
  intentId: string
): Promise<void>
export async function markParsingIntentFailed(
  workspaceId: string,
  intentId: string
): Promise<void>
```

## File: src/features/scheduling.slice/_components/org-schedule-governance.tsx
```typescript
import { CheckCircle, XCircle, Users, Flag, UserPlus } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { getOrgEligibleMembersWithTier } from '@/features/projection.bus';
import type { OrgEligibleMemberView } from '@/features/projection.bus';
import { tierSatisfies } from '@/features/shared-kernel';
import type { SkillRequirement } from '@/features/shared-kernel';
import type { ScheduleItem } from '@/features/shared-kernel';
import { useAccount } from '@/features/workspace.slice';
import { useApp } from '@/shared/app-providers/app-context';
import { findSkill } from '@/shared/constants/skills';
import type { Timestamp } from '@/shared/ports';
import { Avatar, AvatarFallback } from '@/shared/shadcn-ui/avatar';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/shadcn-ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/shadcn-ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/shadcn-ui/popover';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/shadcn-ui/tooltip';
import { toast } from '@/shared/shadcn-ui/hooks/use-toast';
import {
  assignMember,
  updateScheduleItemStatus,
} from '../_actions';
function getSkillName(slug: string): string
function AssignedMemberAvatars(
function formatTimestamp(ts: Timestamp | string | undefined): string
function computeSkillMatch(
  member: OrgEligibleMemberView,
  skillRequirements?: SkillRequirement[]
): [number, number]
interface ProposalRowProps {
  item: ScheduleItem;
  orgMembers: Array<{ id: string; name: string }>;
  eligibleMembers: OrgEligibleMemberView[];
  orgId: string;
  approvedBy: string;
}
⋮----
<CommandItem key=
⋮----
```

## File: src/features/workspace.slice/core/_hooks/use-workspace-event-handler.tsx
```typescript
import { useEffect } from "react";
import { handleScheduleProposed } from "@/features/scheduling.slice";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";
import { ToastAction } from "@/shared/shadcn-ui/toast";
import type { WorkspaceTask } from "@/shared/types";
import {
  finishParsingImport,
  markParsingIntentFailed,
  markParsingIntentImported,
  startParsingImport,
} from "../../business.document-parser";
import { createIssue } from "../../business.issues";
import { createTask } from "../../business.tasks";
import {
  handleIssueCreatedForWorkflow,
  handleIssueResolvedForWorkflow,
} from "../../business.workflow";
import type { DocumentParserItemsExtractedPayload } from '../../core.event-bus';
import { useWorkspace } from '../_components/workspace-provider';
import { useApp } from './use-app';
⋮----
export function useWorkspaceEventHandler()
⋮----
const pushNotification = (
      title: string,
      message: string,
      type: "info" | "success" | "alert"
) =>
const createIssueAndBlockWorkflow = async (
      title: string,
      type: "technical" | "financial",
      sourceTaskId?: string,
      traceId?: string
) =>
⋮----
const handleImport = (payload: DocumentParserItemsExtractedPayload) =>
⋮----
const importItems = () =>
⋮----
const buildWorkflowBlockedMessage = (
      workflowId: string,
      issueId: string,
      blockedByCount: number
)
⋮----
const buildIssueResolvedMessage = (
      issueTitle: string,
      resolvedBy: string,
      unblockedCount: number
)
```