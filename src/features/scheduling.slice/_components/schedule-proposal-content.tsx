// [職責] Shared schedule proposal form logic for both canonical and intercepting routes.
"use client"

import { parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import type { SkillRequirement } from "@/shared-kernel"
import { useWorkspace } from "@/features/workspace.slice"
import type { Location } from "@/features/workspace.slice"
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
  const taskIdParam = searchParams.get("taskId")
  const initialDate = dateParam ? parseISO(dateParam) : new Date()
  const inheritedTask = taskIdParam ? workspace.tasks?.[taskIdParam] : undefined
  const taskOptions = useMemo(
    () => Object.values(workspace.tasks || {}).map((task) => ({
      id: task.id,
      name: task.name,
      location: task.location,
      requiredSkills: task.requiredSkills,
    })),
    [workspace.tasks]
  )

  const taskById = useMemo(
    () => new Map(Object.values(workspace.tasks || {}).map((task) => [task.id, task])),
    [workspace.tasks]
  )

  const handleSubmit = async (data: {
    taskId?: string
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    location: Location
    requiredSkills: SkillRequirement[]
  }) => {
    const selectedTask = data.taskId ? taskById.get(data.taskId) : undefined
    const effectiveTask = selectedTask ?? inheritedTask

    await createScheduleItem({
      accountId: workspace.dimensionId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      title: (effectiveTask?.name ?? data.title).trim(),
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      location: effectiveTask?.location ?? data.location,
      status: "PROPOSAL",
      originType: "MANUAL",
      assigneeIds: [],
      ...(effectiveTask?.id ? { originTaskId: effectiveTask.id } : {}),
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
      taskOptions={taskOptions}
      inheritedTitle={inheritedTask?.name}
      inheritedTaskId={inheritedTask?.id}
      inheritedLocation={inheritedTask?.location}
      initialRequiredSkills={inheritedTask?.requiredSkills}
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
