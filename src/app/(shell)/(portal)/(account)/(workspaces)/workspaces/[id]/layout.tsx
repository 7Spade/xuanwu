
// [職責] 為特定工作區的所有頁面提供共享的 Context 和 UI 佈局。
"use client";

import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useMemo, useRef, use } from "react";

import { WorkspaceProvider, useWorkspace , useWorkspaceEventHandler , WorkspaceStatusBar , WorkspaceNavTabs , useApp } from "@/features/workspace.slice"
import { Button } from "@/shared/shadcn-ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const PERMANENT_CAPABILITY_IDS = ["capabilities", "audit"];
const GOVERNANCE_CAPABILITY_ID = "members";
const NON_BUSINESS_CAPABILITY_IDS = [
  ...PERMANENT_CAPABILITY_IDS,
  GOVERNANCE_CAPABILITY_ID,
];

/**
 * WorkspaceLayoutInner - The actual UI layout component.
 * It consumes the context provided by WorkspaceLayout.
 */
function WorkspaceLayoutInner({ workspaceId, businesstab, modal, panel }: { workspaceId: string; businesstab: React.ReactNode; modal: React.ReactNode; panel: React.ReactNode }) {
  useWorkspaceEventHandler()
  const { workspace } = useWorkspace()
  const { state } = useApp();
  const router = useRouter();
  const activeCapability = useSelectedLayoutSegment("businesstab");

  const redirectingCapabilityRef = useRef<string | null>(null);

  const allowedCapabilityIds = useMemo(() => {
    const activeAccount = state.activeAccount;
    const isPersonalWorkspace =
      activeAccount?.accountType === "user" && activeAccount.id === workspace.dimensionId;
    const governance = isPersonalWorkspace ? [] : [GOVERNANCE_CAPABILITY_ID];
    const mountedBusiness = (workspace.capabilities ?? [])
      .map((cap) => cap.id)
      .filter((capId) => !NON_BUSINESS_CAPABILITY_IDS.includes(capId));

    return new Set([...PERMANENT_CAPABILITY_IDS, ...governance, ...mountedBusiness]);
  }, [state.activeAccount, workspace.dimensionId, workspace.capabilities]);

  useEffect(() => {
    if (activeCapability === null) {
      redirectingCapabilityRef.current = null;
      return;
    }

    if (allowedCapabilityIds.has(activeCapability)) {
      redirectingCapabilityRef.current = null;
      return;
    }

    if (redirectingCapabilityRef.current === activeCapability) {
      return;
    }

    redirectingCapabilityRef.current = activeCapability;
    router.replace(`/workspaces/${workspaceId}/capabilities`);
  }, [activeCapability, allowedCapabilityIds, router, workspaceId]);

  const formattedAddress = workspace.address ? [workspace.address.street, workspace.address.city, workspace.address.state, workspace.address.country, workspace.address.postalCode].filter(Boolean).join(', ') : 'No address defined.';

  return (
     <div className="gpu-accelerated mx-auto max-w-7xl space-y-6 pb-20 duration-500 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="size-8 hover:bg-primary/5"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>Dimension Space</span>
          <ChevronRight className="size-3 opacity-30" />
          <span className="text-foreground">{workspace.name}</span>
        </div>
      </div>

      <PageHeader
        title={workspace.name}
        description="Manage this space's atomic capability stack, data exchange, and governance protocols."
      >
        <div className="mb-2">
            <WorkspaceStatusBar />
        </div>
      </PageHeader>
      
      {workspace.address && (
          <div className="-mt-2 flex items-center gap-4 rounded-2xl border bg-muted/40 p-4">
              <MapPin className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{formattedAddress}</p>
          </div>
      )}

      <WorkspaceNavTabs workspaceId={workspaceId} />
      {businesstab}
      {panel}
      {modal}
    </div>
  )
}


/**
 * WorkspaceLayout - The main layout component.
 * Its sole responsibility is to provide the WorkspaceContext.
 */
export default function WorkspaceLayout({
  businesstab: businesstab,
  modal,
  panel,
  params,
}: {
  businesstab: React.ReactNode;
  modal: React.ReactNode;
  panel: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <WorkspaceProvider workspaceId={resolvedParams.id}>
      <WorkspaceLayoutInner workspaceId={resolvedParams.id} businesstab={businesstab} modal={modal} panel={panel} />
    </WorkspaceProvider>
  );
}

