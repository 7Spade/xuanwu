/**
 * global-search.slice — GlobalSearchDialog component
 *
 * Cross-cutting Authority: the system's sole Cmd+K search portal. [D26][A12]
 *
 * Per logic-overview.md:
 *   GLOBAL_SEARCH["...Cmd+K 唯一服務提供者\n_actions.ts / _services.ts [D26]"]
 *
 * This component is the SOLE owner of the Cmd+K shortcut UI.
 * It MUST NOT live inside any business slice (D26/A12 invariant).
 *
 * Accepts pre-fetched navigation data (organizations, workspaces, members)
 * from the hosting shell; cross-domain display is mediated by this boundary.
 */
"use client";

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

/**
 * GlobalSearchDialog — Cmd+K search portal owned by global-search.slice [D26].
 *
 * All business slices MUST use this component; they MUST NOT implement
 * their own cross-domain search or Cmd+K UI (A12 invariant).
 */
export function GlobalSearchDialog({
  isOpen,
  onOpenChange,
  organizations,
  workspaces,
  members,
  activeOrganizationId,
  onSwitchOrganization,
}: GlobalSearchDialogProps) {
  const router = useRouter();

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Dimensions">
          {organizations.map((organization) => (
            <CommandItem key={organization.id} onSelect={() => handleSelect(() => onSwitchOrganization(organization))}>
              <Globe className="mr-2 size-4 text-primary" />
              <span>{organization.name}</span>
              {activeOrganizationId === organization.id && <Badge variant="outline" className="ml-auto h-4 text-[8px]">Current</Badge>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Spaces">
          {workspaces.map((workspace) => (
            <CommandItem key={workspace.id} onSelect={() => handleSelect(() => router.push(`${ROUTES.WORKSPACES}/${workspace.id}`))}>
              <Layers className="mr-2 size-4 text-primary" />
              <span>{workspace.name}</span>
              <span className="ml-auto font-mono text-[9px] text-muted-foreground">{workspace.id.toUpperCase()}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="People">
          {members.map((member) => (
            <CommandItem key={member.id} onSelect={() => handleSelect(() => router.push(ROUTES.ACCOUNT_MEMBERS))}>
              <User className="mr-2 size-4 text-primary" />
              <span>{member.name}</span>
              <span className="ml-auto text-[9px] text-muted-foreground">{member.email}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * GlobalSearch — canonical alias for GlobalSearchDialog.
 * Exposed for backward-compatible imports across the application shell.
 */
export { GlobalSearchDialog as GlobalSearch };
