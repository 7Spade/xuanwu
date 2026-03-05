// [職責] @modal intercept: workspace settings dialog (deep-linkable)
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { WorkspaceSettingsDialog , useWorkspace } from "@/features/workspace.slice"
import type { WorkspaceLifecycleState, Address, WorkspacePersonnel } from "@/features/workspace.slice"

export default function WorkspaceSettingsModalPage() {
  const router = useRouter()
  const { workspace, updateWorkspaceSettings } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const onSave = async (settings: {
    name: string
    visibility: "visible" | "hidden"
    lifecycleState: WorkspaceLifecycleState
    address?: Address
    personnel?: WorkspacePersonnel
  }) => {
    setLoading(true)
    await updateWorkspaceSettings(settings)
    setLoading(false)
    router.back()
  }

  return (
    <WorkspaceSettingsDialog
      workspace={workspace}
      open
      onOpenChange={(open) => !open && router.back()}
      onSave={onSave}
      loading={loading}
    />
  )
}
