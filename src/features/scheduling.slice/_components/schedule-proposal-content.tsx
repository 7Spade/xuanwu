// [職責] Shared schedule proposal form logic for both canonical and intercepting routes.
"use client"

import { parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"

import type { SkillRequirement } from "@/features/shared-kernel"
import { useWorkspace } from "@/features/workspace.slice"
import type { Location } from "@/shared/types"
import { toast } from "@/shared/shadcn-ui/hooks/use-toast"

import { ProposalDialog } from "./proposal-dialog"


interface ScheduleProposalContentProps {
  /** Wrap the dialog in a full-page centering container (for canonical route). */
  fullPage?: boolean
}

export function ScheduleProposalContent({ fullPage = false }: ScheduleProposalContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { workspace, createScheduleItem } = useWorkspace()

  const dateParam = searchParams.get("date")
  const initialDate = dateParam ? parseISO(dateParam) : new Date()

  const handleSubmit = async (data: {
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    location: Location
    requiredSkills: SkillRequirement[]
  }) => {
    await createScheduleItem({
      accountId: workspace.dimensionId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      title: data.title.trim(),
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      location: data.location,
      status: "PROPOSAL",
      originType: "MANUAL",
      assigneeIds: [],
      // Omit optional fields rather than passing undefined — Firestore rejects undefined values.
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      ...(data.requiredSkills.length > 0 ? { requiredSkills: data.requiredSkills } : {}),
    })
    toast({
      title: "排程提案已送出",
      description: "您的申請已送至組織審核。",
    })
    router.back()
  }

  const dialog = (
    <ProposalDialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      onSubmit={handleSubmit}
      initialDate={initialDate}
      orgId={workspace.dimensionId}
    />
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {dialog}
      </div>
    )
  }

  return dialog
}
