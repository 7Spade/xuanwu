"use client"

/**
 * Module: gov.skill/_components/org-skill-graph-editor
 * Purpose: Vis-network based interactive editor for the organization skill graph.
 * Responsibilities: Render nodes/edges, handle add/edit/delete via vis manipulation API.
 * Constraints: 'use client'; no direct Firebase imports ([D24]).
 *
 * Design reference:
 *   https://visjs.github.io/vis-network/examples/network/version_migration/5.4.1_to_6.0.0/manipulationEditEdgeNoDrag.html
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { Network, DataSet } from "vis-network/standalone"
import type { IdType } from "vis-network"

import { useApp } from "@/app-runtime/providers/app-provider"
import { useI18n } from "@/app-runtime/providers/i18n-provider"
import { toast } from "@/shadcn-ui/hooks/use-toast"
import { Button } from "@/shadcn-ui/button"
import { Input } from "@/shadcn-ui/input"
import { Label } from "@/shadcn-ui/label"
import { Badge } from "@/shadcn-ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn-ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn-ui/dialog"
import { AlertCircle, Plus, Trash2, Edit2, Link2 } from "lucide-react"

import { useOrgSkillGraph } from "../_hooks/use-org-skill-graph"
import {
  addOrgSkillNodeAction,
  editOrgSkillNodeAction,
  deleteOrgSkillNodeAction,
  addOrgSkillEdgeAction,
  deleteOrgSkillEdgeAction,
} from "../_actions"
import type { OrgSkillNode, OrgSkillNodeGroup, OrgSkillEdge } from "../_types"

// ---------------------------------------------------------------------------
// Vis-network theme constants (matches vis manipulation example)
// ---------------------------------------------------------------------------

const GROUP_COLORS: Record<OrgSkillNodeGroup, { background: string; border: string; font: string }> = {
  category: { background: "#7b5ea7", border: "#4a3570", font: "#fff" },
  skill:    { background: "#43a39f", border: "#2c6e6b", font: "#fff" },
}

const VIS_OPTIONS = {
  manipulation: {
    enabled: false, // we control via custom toolbar
  },
  nodes: {
    shape: "dot",
    size: 20,
    font: { size: 14, color: "#222" },
    borderWidth: 2,
    shadow: true,
  },
  edges: {
    arrows: { to: { enabled: true, scaleFactor: 0.7 } },
    smooth: { type: "curvedCW", roundness: 0.2 } as never,
    font: { size: 11, align: "middle" },
    shadow: true,
  },
  physics: {
    enabled: true,
    barnesHut: { gravitationalConstant: -4000, springLength: 120 },
    stabilization: { iterations: 120 },
  },
  interaction: {
    hover: true,
    tooltipDelay: 200,
    navigationButtons: true,
    keyboard: { enabled: true, speed: { x: 10, y: 10, zoom: 0.01 } },
  },
} as const

// ---------------------------------------------------------------------------
// Dialog state
// ---------------------------------------------------------------------------

type DialogMode = "addNode" | "editNode" | "addEdge" | null

interface NodeFormState {
  id: string
  label: string
  group: OrgSkillNodeGroup
  description: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrgSkillGraphEditor() {
  const { t } = useI18n()
  const { state } = useApp()
  const { accounts, activeAccount } = state

  const orgId = activeAccount?.accountType === "organization" ? activeAccount.id : null
  const actorId = activeAccount?.id ?? ""

  const { graph, loading } = useOrgSkillGraph(orgId ?? "")

  // vis-network refs
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef   = useRef<Network | null>(null)
  const nodesRef     = useRef(new DataSet<Record<string, unknown>>([]))
  const edgesRef     = useRef(new DataSet<Record<string, unknown>>([]))

  // dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [nodeForm, setNodeForm]     = useState<NodeFormState>({
    id: "", label: "", group: "skill", description: "",
  })
  const [pendingEdge, setPendingEdge] = useState<{ from: string; to: string } | null>(null)
  const [edgeLabel, setEdgeLabel]    = useState("")
  const [saving, setSaving]          = useState(false)
  const [addingEdge, setAddingEdge]  = useState(false)

  // -------------------------------------------------------------------------
  // Sync Firestore → DataSet
  // -------------------------------------------------------------------------

  useEffect(() => {
    const visNodes = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      title: n.description,
      group: n.group,
      color: GROUP_COLORS[n.group] ?? undefined,
    }))

    const visEdges = graph.edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label ?? "",
    }))

    // Batch update DataSets (do not recreate so the Network ref stays valid)
    nodesRef.current.clear()
    nodesRef.current.add(visNodes)
    edgesRef.current.clear()
    edgesRef.current.add(visEdges)
  }, [graph])

  // -------------------------------------------------------------------------
  // Initialise vis-network once the container is mounted
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return
    if (networkRef.current) return // already initialised

    const network = new Network(
      containerRef.current,
      { nodes: nodesRef.current, edges: edgesRef.current },
      VIS_OPTIONS
    )
    networkRef.current = network

    return () => {
      network.destroy()
      networkRef.current = null
    }
  }, [])

  // -------------------------------------------------------------------------
  // Enable "add edge" mode via vis manipulation
  // -------------------------------------------------------------------------

  const startAddEdgeMode = useCallback(() => {
    const network = networkRef.current
    if (!network) return
    setAddingEdge(true)
    network.addEdgeMode()
    network.once("selectNode", (_params) => {/* keep mode active until second node selected */})
    // Listen for edge-add completion from vis
    network.once("afterDrawing", () => {/* noop */})
  }, [])

  // vis-network fires "onRelease" when both endpoints of a new edge are selected
  useEffect(() => {
    const network = networkRef.current
    if (!network) return

    function handleEdgeCreated(params: { from: IdType; to: IdType }) {
      setAddingEdge(false)
      network!.disableEditMode()
      setPendingEdge({ from: String(params.from), to: String(params.to) })
      setEdgeLabel("")
      setDialogMode("addEdge")
    }

    // vis fires "release" with {from, to} when addEdgeMode is active
    network.on("release", handleEdgeCreated)
    return () => {
      network.off("release", handleEdgeCreated)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Toolbar actions
  // -------------------------------------------------------------------------

  function openAddNode() {
    setNodeForm({ id: "", label: "", group: "skill", description: "" })
    setDialogMode("addNode")
  }

  function openEditNode() {
    const network = networkRef.current
    if (!network) return
    const selectedNodes = network.getSelectedNodes()
    if (selectedNodes.length !== 1) {
      toast({ title: t("org.skill.selectOneNodeToEdit"), variant: "destructive" })
      return
    }
    const nodeId = String(selectedNodes[0])
    const found  = graph.nodes.find((n) => n.id === nodeId)
    if (!found) return
    setNodeForm({ id: found.id, label: found.label, group: found.group, description: found.description ?? "" })
    setDialogMode("editNode")
  }

  async function handleDeleteSelected() {
    if (!orgId) return
    const network = networkRef.current
    if (!network) return

    const selectedNodes = network.getSelectedNodes()
    const selectedEdges = network.getSelectedEdges()

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      toast({ title: t("org.skill.selectItemsToDelete"), variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      for (const nodeId of selectedNodes) {
        await deleteOrgSkillNodeAction({ orgId, nodeId: String(nodeId) })
      }
      for (const edgeId of selectedEdges) {
        await deleteOrgSkillEdgeAction({ orgId, edgeId: String(edgeId) })
      }
      toast({ title: t("org.skill.deletedSuccess") })
      network.unselectAll()
    } catch {
      toast({ title: t("org.skill.deleteFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Save node (add / edit)
  // -------------------------------------------------------------------------

  async function handleSaveNode() {
    if (!orgId || !nodeForm.label.trim()) return
    setSaving(true)
    try {
      if (dialogMode === "addNode") {
        await addOrgSkillNodeAction({
          orgId,
          label: nodeForm.label,
          group: nodeForm.group,
          description: nodeForm.description || undefined,
          actorId,
        })
        toast({ title: t("org.skill.nodeAdded") })
      } else if (dialogMode === "editNode") {
        await editOrgSkillNodeAction({
          orgId,
          nodeId: nodeForm.id,
          label: nodeForm.label,
          group: nodeForm.group,
          description: nodeForm.description || undefined,
          actorId,
        })
        toast({ title: t("org.skill.nodeUpdated") })
      }
      setDialogMode(null)
    } catch {
      toast({ title: t("org.skill.saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Save edge
  // -------------------------------------------------------------------------

  async function handleSaveEdge() {
    if (!orgId || !pendingEdge) return
    setSaving(true)
    try {
      await addOrgSkillEdgeAction({
        orgId,
        from: pendingEdge.from,
        to: pendingEdge.to,
        label: edgeLabel || undefined,
        actorId,
      })
      toast({ title: t("org.skill.edgeAdded") })
      setDialogMode(null)
      setPendingEdge(null)
    } catch {
      toast({ title: t("org.skill.saveFailed"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function cancelEdge() {
    setDialogMode(null)
    setPendingEdge(null)
    networkRef.current?.disableEditMode()
    setAddingEdge(false)
  }

  // -------------------------------------------------------------------------
  // Guard — must be an org account
  // -------------------------------------------------------------------------

  if (!orgId) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h3 className="font-bold">{t("account.governanceNotAvailable")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("account.governanceNotAvailableDescription")}
        </p>
      </div>
    )
  }

  const activeOrg = accounts[orgId]
  if (!activeOrg) return null

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t("org.skill.graphTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("org.skill.graphSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {graph.nodes.length} {t("org.skill.nodes")}
          </Badge>
          <Badge variant="outline">
            {graph.edges.length} {t("org.skill.edges")}
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 rounded-lg border p-3 bg-muted/40">
        <Button size="sm" variant="outline" onClick={openAddNode} disabled={saving}>
          <Plus className="mr-1 size-4" />
          {t("org.skill.addNode")}
        </Button>
        <Button size="sm" variant="outline" onClick={openEditNode} disabled={saving}>
          <Edit2 className="mr-1 size-4" />
          {t("org.skill.editNode")}
        </Button>
        <Button
          size="sm"
          variant={addingEdge ? "default" : "outline"}
          onClick={startAddEdgeMode}
          disabled={saving}
        >
          <Link2 className="mr-1 size-4" />
          {addingEdge ? t("org.skill.clickSecondNode") : t("org.skill.addEdge")}
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDeleteSelected} disabled={saving}>
          <Trash2 className="mr-1 size-4" />
          {t("org.skill.deleteSelected")}
        </Button>
      </div>

      {/* Vis-network canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-lg border bg-background"
        style={{ height: 520 }}
        aria-label={t("org.skill.graphCanvasLabel")}
      />

      {loading && (
        <p className="text-sm text-center text-muted-foreground animate-pulse">
          {t("org.skill.loading")}
        </p>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Node Dialog */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={dialogMode === "addNode" || dialogMode === "editNode"}
        onOpenChange={(open) => { if (!open) setDialogMode(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "addNode" ? t("org.skill.addNodeTitle") : t("org.skill.editNodeTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="node-label">{t("org.skill.labelField")}</Label>
              <Input
                id="node-label"
                value={nodeForm.label}
                onChange={(e) => setNodeForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={t("org.skill.labelPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="node-group">{t("org.skill.groupField")}</Label>
              <Select
                value={nodeForm.group}
                onValueChange={(v) => setNodeForm((f) => ({ ...f, group: v as OrgSkillNodeGroup }))}
              >
                <SelectTrigger id="node-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">{t("org.skill.groupCategory")}</SelectItem>
                  <SelectItem value="skill">{t("org.skill.groupSkill")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="node-desc">{t("org.skill.descriptionField")}</Label>
              <Input
                id="node-desc"
                value={nodeForm.description}
                onChange={(e) => setNodeForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("org.skill.descriptionPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveNode} disabled={saving || !nodeForm.label.trim()}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Add Edge Dialog */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={dialogMode === "addEdge"}
        onOpenChange={(open) => { if (!open) cancelEdge() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("org.skill.addEdgeTitle")}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t("org.skill.addEdgeDesc", {
                from: graph.nodes.find((n) => n.id === pendingEdge?.from)?.label ?? pendingEdge?.from ?? "?",
                to:   graph.nodes.find((n) => n.id === pendingEdge?.to)?.label   ?? pendingEdge?.to   ?? "?",
              })}
            </p>
            <div className="flex flex-col gap-1">
              <Label htmlFor="edge-label">{t("org.skill.edgeLabelField")}</Label>
              <Input
                id="edge-label"
                value={edgeLabel}
                onChange={(e) => setEdgeLabel(e.target.value)}
                placeholder={t("org.skill.edgeLabelPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelEdge} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdge} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
