"use client";

/**
 * Module: org-semantic-dictionary-panel
 * Purpose: Manage organization task-type and skill-type dictionaries.
 * Responsibilities: CRUD task/skill semantic entries and task-type requiredSkills mapping.
 * Constraints: deterministic logic, respect module boundaries
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookType, Plus, Save, Sparkles, Trash2, Wrench } from 'lucide-react';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network/standalone';
import type { Edge, IdType, Node } from 'vis-network';
import 'vis-network/styles/vis-network.css';

import { useApp } from '@/app-runtime/providers/app-provider';
import {
  addOrgSkillTypeAction,
  addOrgTaskTypeAction,
  removeOrgSkillTypeAction,
  removeOrgTaskTypeAction,
  suggestOrgSkillTypeDraftAction,
  suggestOrgTaskTypeDraftAction,
  updateOrgSkillTypeAction,
  updateOrgTaskTypeAction,
} from '../_actions';
import { Badge } from '@/shadcn-ui/badge';
import { Button } from '@/shadcn-ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn-ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shadcn-ui/dialog';
import { Input } from '@/shadcn-ui/input';
import { Label } from '@/shadcn-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn-ui/select';
import { useToast } from '@/shadcn-ui/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn-ui/tabs';
import { Textarea } from '@/shadcn-ui/textarea';
import { tagSlugRef, TIER_DEFINITIONS, type SkillRequirement } from '@/shared-kernel';

import { getOrgSkillTypes, getOrgTaskTypes } from '../_queries';

import type { OrgSkillTypeEntry, OrgTaskTypeEntry } from '../_types';

type SkillRequirementDraft = {
  tagSlug: string;
  minimumTier: SkillRequirement['minimumTier'];
  quantity: string;
  minXp: string;
};

type TaskTypeFormState = {
  slug: string;
  name: string;
  aliases: string;
  description: string;
  active: boolean;
  requiredSkills: SkillRequirementDraft[];
};

type SkillTypeFormState = {
  slug: string;
  name: string;
  aliases: string;
  description: string;
  active: boolean;
};

type DictionaryViewMode = 'dictionary' | 'graph';

type GraphDebugState = {
  networkReady: boolean;
  containerSize: string;
  canvasCount: number;
  nodeCount: number;
  edgeCount: number;
};

const DEFAULT_SKILL_REQUIREMENT: SkillRequirementDraft = {
  tagSlug: '',
  minimumTier: 'apprentice',
  quantity: '1',
  minXp: '',
};

const DEFAULT_TASK_FORM: TaskTypeFormState = {
  slug: '',
  name: '',
  aliases: '',
  description: '',
  active: true,
  requiredSkills: [{ ...DEFAULT_SKILL_REQUIREMENT }],
};

const DEFAULT_SKILL_FORM: SkillTypeFormState = {
  slug: '',
  name: '',
  aliases: '',
  description: '',
  active: true,
};

const GRAPH_NODE_COLORS = {
  task: { background: '#7b5ea7', border: '#4a3570', font: '#ffffff' },
  skill: { background: '#2f9e93', border: '#1f6b63', font: '#ffffff' },
  unresolved: { background: '#f59e0b', border: '#b45309', font: '#111827' },
} as const;

const GRAPH_OPTIONS = {
  manipulation: { enabled: false },
  nodes: {
    shape: 'dot',
    size: 18,
    borderWidth: 2,
    shadow: true,
    font: { size: 12, multi: true },
  },
  edges: {
    arrows: { to: { enabled: true, scaleFactor: 0.6 } },
    smooth: { type: 'curvedCW', roundness: 0.18 } as never,
    font: { size: 10, align: 'middle', multi: true },
    shadow: true,
  },
  physics: {
    enabled: true,
    barnesHut: { gravitationalConstant: -3200, springLength: 130 },
    stabilization: { iterations: 100 },
  },
  interaction: {
    hover: true,
    navigationButtons: true,
    keyboard: { enabled: true, speed: { x: 10, y: 10, zoom: 0.02 } },
  },
} as const;

function aliasesToArray(input: string): string[] {
  return input
    .split(',')
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
}

function fromSkillRequirements(input: SkillRequirement[] | undefined): SkillRequirementDraft[] {
  if (!input || input.length === 0) {
    return [{ ...DEFAULT_SKILL_REQUIREMENT }];
  }
  return input.map((skill) => ({
    tagSlug: skill.tagSlug,
    minimumTier: skill.minimumTier,
    quantity: String(skill.quantity),
    minXp: skill.minXp !== undefined ? String(skill.minXp) : '',
  }));
}

function toSkillRequirements(input: SkillRequirementDraft[]): SkillRequirement[] {
  return input
    .filter((skill) => skill.tagSlug.trim().length > 0)
    .map((skill) => ({
      tagSlug: tagSlugRef(skill.tagSlug.trim()),
      minimumTier: skill.minimumTier,
      quantity: Math.max(1, Number(skill.quantity) || 1),
      ...(skill.minXp.trim() !== '' ? { minXp: Math.max(0, Number(skill.minXp) || 0) } : {}),
    }));
}

function buildTaskNodeLabel(task: OrgTaskTypeEntry): string {
  const status = task.active ? 'active' : 'inactive';
  return [task.name, task.slug, `${status} | req: ${task.requiredSkills.length}`].join('\n');
}

function buildSkillNodeLabel(skill: OrgSkillTypeEntry): string {
  const status = skill.active ? 'active' : 'inactive';
  return [skill.name, skill.slug, status].join('\n');
}

function buildEdgeLabel(requirement: SkillRequirement): string {
  const xpLine = requirement.minXp !== undefined ? `minXP: ${requirement.minXp}` : 'minXP: optional';
  return [`qty: ${requirement.quantity} | tier: ${requirement.minimumTier}`, xpLine].join('\n');
}

export function OrgSemanticDictionaryPanel() {
  const { state } = useApp();
  const { activeAccount } = state;
  const { toast } = useToast();

  const orgId = activeAccount?.accountType === 'organization' ? activeAccount.id : null;
  const actorId = activeAccount?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskAssistLoading, setTaskAssistLoading] = useState(false);
  const [skillAssistLoading, setSkillAssistLoading] = useState(false);
  const [taskTypes, setTaskTypes] = useState<OrgTaskTypeEntry[]>([]);
  const [skillTypes, setSkillTypes] = useState<OrgSkillTypeEntry[]>([]);
  const [taskAssistPrompt, setTaskAssistPrompt] = useState('');
  const [skillAssistPrompt, setSkillAssistPrompt] = useState('');

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingTaskSlug, setEditingTaskSlug] = useState<string | null>(null);
  const [editingSkillSlug, setEditingSkillSlug] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState<TaskTypeFormState>({ ...DEFAULT_TASK_FORM });
  const [skillForm, setSkillForm] = useState<SkillTypeFormState>({ ...DEFAULT_SKILL_FORM });
  const [viewMode, setViewMode] = useState<DictionaryViewMode>('dictionary');
  const [graphContainerEl, setGraphContainerEl] = useState<HTMLDivElement | null>(null);
  const [graphDebug, setGraphDebug] = useState<GraphDebugState>({
    networkReady: false,
    containerSize: '0x0',
    canvasCount: 0,
    nodeCount: 0,
    edgeCount: 0,
  });

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphNetworkRef = useRef<Network | null>(null);
  const graphBoundContainerRef = useRef<HTMLDivElement | null>(null);
  const graphNodesRef = useRef(new DataSet<Node>([]));
  const graphEdgesRef = useRef(new DataSet<Edge>([]));

  const tierOptions = useMemo(() => TIER_DEFINITIONS.map((tier) => tier.tier), []);
  const skillTypeSlugSet = useMemo(() => new Set(skillTypes.map((skill) => skill.slug)), [skillTypes]);
  const skillTypeOptions = useMemo(
    () => skillTypes.map((skill) => ({ slug: skill.slug, name: skill.name })),
    [skillTypes]
  );

  const captureGraphDebug = useCallback(() => {
    const container = graphContainerRef.current;
    const canvasCount = container ? container.querySelectorAll('canvas').length : 0;
    const width = container?.clientWidth ?? 0;
    const height = container?.clientHeight ?? 0;
    setGraphDebug({
      networkReady: graphNetworkRef.current !== null,
      containerSize: `${width}x${height}`,
      canvasCount,
      nodeCount: graphNodesRef.current.length,
      edgeCount: graphEdgesRef.current.length,
    });
  }, []);

  const bindGraphContainerRef = useCallback((element: HTMLDivElement | null) => {
    graphContainerRef.current = element;
    setGraphContainerEl(element);
  }, []);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    const [nextTaskTypes, nextSkillTypes] = await Promise.all([
      getOrgTaskTypes(orgId),
      getOrgSkillTypes(orgId),
    ]);
    setTaskTypes(nextTaskTypes.sort((a, b) => a.name.localeCompare(b.name)));
    setSkillTypes(nextSkillTypes.sort((a, b) => a.name.localeCompare(b.name)));
  }, [orgId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!orgId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await refresh();
      } catch (error: unknown) {
        toast({
          title: 'Failed to load semantic dictionaries',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [orgId, refresh, toast]);

  function resetTaskForm() {
    setTaskForm({ ...DEFAULT_TASK_FORM, requiredSkills: [{ ...DEFAULT_SKILL_REQUIREMENT }] });
    setTaskAssistPrompt('');
    setEditingTaskSlug(null);
  }

  function resetSkillForm() {
    setSkillForm({ ...DEFAULT_SKILL_FORM });
    setSkillAssistPrompt('');
    setEditingSkillSlug(null);
  }

  function openCreateTaskDialog() {
    resetTaskForm();
    setTaskDialogOpen(true);
  }

  function openEditTaskDialog(entry: OrgTaskTypeEntry) {
    setTaskForm({
      slug: entry.slug,
      name: entry.name,
      aliases: entry.aliases.join(', '),
      description: entry.description ?? '',
      active: entry.active,
      requiredSkills: fromSkillRequirements(entry.requiredSkills),
    });
    setEditingTaskSlug(entry.slug);
    setTaskDialogOpen(true);
  }

  function openCreateSkillDialog() {
    resetSkillForm();
    setSkillDialogOpen(true);
  }

  function openEditSkillDialog(entry: OrgSkillTypeEntry) {
    setSkillForm({
      slug: entry.slug,
      name: entry.name,
      aliases: entry.aliases.join(', '),
      description: entry.description ?? '',
      active: entry.active,
    });
    setEditingSkillSlug(entry.slug);
    setSkillDialogOpen(true);
  }

  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const skillBySlug = new Map<string, OrgSkillTypeEntry>();
    for (const skill of skillTypes) {
      skillBySlug.set(skill.slug, skill);
      nodes.push({
        id: `skill:${skill.slug}`,
        label: buildSkillNodeLabel(skill),
        title: `${skill.slug}${skill.active ? '' : ' (inactive)'}`,
        group: 'skill',
        color: GRAPH_NODE_COLORS.skill,
      });
    }

    const unresolvedSkillSlugs = new Set<string>();
    for (const task of taskTypes) {
      const taskNodeId = `task:${task.slug}`;
      nodes.push({
        id: taskNodeId,
        label: buildTaskNodeLabel(task),
        title: `${task.slug}${task.active ? '' : ' (inactive)'}`,
        group: 'task',
        color: GRAPH_NODE_COLORS.task,
      });

      task.requiredSkills.forEach((requirement, requirementIndex) => {
        const hasSkill = skillBySlug.has(requirement.tagSlug);
        const targetId = hasSkill ? `skill:${requirement.tagSlug}` : `missing:${requirement.tagSlug}`;
        if (!hasSkill) {
          unresolvedSkillSlugs.add(requirement.tagSlug);
        }
        edges.push({
          id: `${task.slug}=>${requirement.tagSlug}#${requirementIndex}`,
          from: taskNodeId,
          to: targetId,
          label: buildEdgeLabel(requirement),
        });
      });
    }

    for (const missingSlug of unresolvedSkillSlugs) {
      nodes.push({
        id: `missing:${missingSlug}`,
        label: ['Missing Skill', missingSlug].join('\n'),
        title: `Missing skill-type entry: ${missingSlug}`,
        group: 'unresolved',
        color: GRAPH_NODE_COLORS.unresolved,
      });
    }

    return {
      nodes,
      edges,
      unresolvedCount: unresolvedSkillSlugs.size,
    };
  }, [taskTypes, skillTypes]);

  useEffect(() => {
    if (viewMode !== 'graph') return;
    if (!graphContainerEl) return;

    let network = graphNetworkRef.current;
    if (network && graphBoundContainerRef.current !== graphContainerEl) {
      network.destroy();
      graphNetworkRef.current = null;
      network = null;
    }

    if (!network) {
      network = new Network(
        graphContainerEl,
        { nodes: graphNodesRef.current, edges: graphEdgesRef.current },
        GRAPH_OPTIONS
      );
      graphNetworkRef.current = network;
      graphBoundContainerRef.current = graphContainerEl;
    }

    try {
      graphNodesRef.current.clear();
      graphEdgesRef.current.clear();
      graphNodesRef.current.add(graphData.nodes);
      graphEdgesRef.current.add(graphData.edges);

      network.setData({
        nodes: graphNodesRef.current,
        edges: graphEdgesRef.current,
      });
    } catch (error: unknown) {
      toast({
        title: 'Graph render failed',
        description: error instanceof Error ? error.message : 'Unknown vis-network data error',
        variant: 'destructive',
      });
      return;
    }

    requestAnimationFrame(() => {
      network.redraw();
      if (graphData.nodes.length > 0) {
        network.fit({ animation: { duration: 220, easingFunction: 'easeInOutQuad' } });
      }
      captureGraphDebug();
    });
  }, [viewMode, graphContainerEl, graphData, toast, captureGraphDebug]);

  useEffect(() => {
    if (viewMode === 'graph') return;
    graphNetworkRef.current?.destroy();
    graphNetworkRef.current = null;
    graphBoundContainerRef.current = null;
    captureGraphDebug();
  }, [viewMode, captureGraphDebug]);

  useEffect(() => {
    return () => {
      graphNetworkRef.current?.destroy();
      graphNetworkRef.current = null;
      graphBoundContainerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const network = graphNetworkRef.current;
    if (!network) return;

    const onDoubleClick = (params: { nodes: IdType[] }) => {
      if (params.nodes.length !== 1) return;
      const nodeId = String(params.nodes[0]);
      if (nodeId.startsWith('task:')) {
        const slug = nodeId.slice('task:'.length);
        const entry = taskTypes.find((task) => task.slug === slug);
        if (entry) {
          openEditTaskDialog(entry);
        }
        return;
      }
      if (nodeId.startsWith('skill:')) {
        const slug = nodeId.slice('skill:'.length);
        const entry = skillTypes.find((skill) => skill.slug === slug);
        if (entry) {
          openEditSkillDialog(entry);
        }
      }
    };

    network.off('doubleClick', onDoubleClick);
    network.on('doubleClick', onDoubleClick);
    network.fit({ animation: { duration: 280, easingFunction: 'easeInOutQuad' } });

    return () => {
      network.off('doubleClick', onDoubleClick);
    };
  }, [graphData, taskTypes, skillTypes]);

  useEffect(() => {
    if (viewMode !== 'graph') return;
    const container = graphContainerEl;
    const network = graphNetworkRef.current;
    if (!container || !network || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      network.redraw();
      if (graphData.nodes.length > 0) {
        network.fit({ animation: false });
      }
      captureGraphDebug();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [viewMode, graphContainerEl, graphData.nodes.length, captureGraphDebug]);

  async function saveTaskType() {
    if (!orgId || !actorId || taskForm.slug.trim() === '' || taskForm.name.trim() === '') {
      return;
    }

    const invalidRequiredSkillSlugs = taskForm.requiredSkills
      .map((requirement) => requirement.tagSlug.trim())
      .filter((slug) => slug.length > 0 && !skillTypeSlugSet.has(slug));
    if (invalidRequiredSkillSlugs.length > 0) {
      toast({
        title: 'Invalid required skills',
        description: `Please select existing Skill-Type entries only. Invalid: ${invalidRequiredSkillSlugs.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        aliases: aliasesToArray(taskForm.aliases),
        description: taskForm.description.trim() || undefined,
        active: taskForm.active,
        requiredSkills: toSkillRequirements(taskForm.requiredSkills),
      };

      const result = editingTaskSlug
        ? await updateOrgTaskTypeAction(orgId, editingTaskSlug, {
            name: taskForm.name.trim(),
            ...payload,
          })
        : await addOrgTaskTypeAction(orgId, taskForm.slug.trim(), taskForm.name.trim(), actorId, payload);

      if (!result.success) {
        toast({ title: result.error.message, variant: 'destructive' });
        return;
      }

      toast({ title: editingTaskSlug ? 'Task type updated' : 'Task type created' });
      setTaskDialogOpen(false);
      resetTaskForm();
      await refresh();
    } catch (error: unknown) {
      toast({
        title: 'Failed to save task type',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function applyTaskTypeSuggestion() {
    if (!orgId) return;
    const prompt = taskAssistPrompt.trim();
    if (!prompt) {
      toast({
        title: 'Please describe the task type you want to create',
        description: 'Example: low-voltage wiring with panel setup, needs certified electrician.',
        variant: 'destructive',
      });
      return;
    }

    setTaskAssistLoading(true);
    try {
      const result = await suggestOrgTaskTypeDraftAction(orgId, prompt);
      if (!result.success) {
        toast({ title: 'AI suggestion failed', description: result.error, variant: 'destructive' });
        return;
      }

      setTaskForm((prev) => ({
        ...prev,
        slug: editingTaskSlug ? prev.slug : result.data.slug,
        name: result.data.name,
        aliases: result.data.aliases.join(', '),
        description: result.data.description ?? '',
        requiredSkills:
          result.data.requiredSkills.length > 0
            ? result.data.requiredSkills.map((requirement) => ({
                tagSlug: requirement.tagSlug,
                minimumTier: requirement.minimumTier,
                quantity: String(requirement.quantity),
                minXp:
                  typeof requirement.minXp === 'number' && Number.isFinite(requirement.minXp)
                    ? String(requirement.minXp)
                    : '',
              }))
            : [{ ...DEFAULT_SKILL_REQUIREMENT }],
      }));

      toast({ title: 'AI draft applied', description: 'You can fine-tune fields before saving.' });
    } finally {
      setTaskAssistLoading(false);
    }
  }

  async function saveSkillType() {
    if (!orgId || !actorId || skillForm.slug.trim() === '' || skillForm.name.trim() === '') {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        aliases: aliasesToArray(skillForm.aliases),
        description: skillForm.description.trim() || undefined,
        active: skillForm.active,
      };

      const result = editingSkillSlug
        ? await updateOrgSkillTypeAction(orgId, editingSkillSlug, {
            name: skillForm.name.trim(),
            ...payload,
          })
        : await addOrgSkillTypeAction(orgId, skillForm.slug.trim(), skillForm.name.trim(), actorId, payload);

      if (!result.success) {
        toast({ title: result.error.message, variant: 'destructive' });
        return;
      }

      toast({ title: editingSkillSlug ? 'Skill type updated' : 'Skill type created' });
      setSkillDialogOpen(false);
      resetSkillForm();
      await refresh();
    } catch (error: unknown) {
      toast({
        title: 'Failed to save skill type',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function applySkillTypeSuggestion() {
    if (!orgId) return;
    const prompt = skillAssistPrompt.trim();
    if (!prompt) {
      toast({
        title: 'Please describe the skill type you want to create',
        description: 'Example: advanced electrical troubleshooting for industrial control cabinets.',
        variant: 'destructive',
      });
      return;
    }

    setSkillAssistLoading(true);
    try {
      const result = await suggestOrgSkillTypeDraftAction(orgId, prompt);
      if (!result.success) {
        toast({ title: 'AI suggestion failed', description: result.error, variant: 'destructive' });
        return;
      }

      setSkillForm((prev) => ({
        ...prev,
        slug: editingSkillSlug ? prev.slug : result.data.slug,
        name: result.data.name,
        aliases: result.data.aliases.join(', '),
        description: result.data.description ?? '',
      }));

      toast({ title: 'AI draft applied', description: 'You can fine-tune fields before saving.' });
    } finally {
      setSkillAssistLoading(false);
    }
  }

  async function removeTaskType(slug: string) {
    if (!orgId) return;
    setSaving(true);
    try {
      const result = await removeOrgTaskTypeAction(orgId, slug);
      if (!result.success) {
        toast({ title: result.error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Task type removed' });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function removeSkillType(slug: string) {
    if (!orgId) return;
    setSaving(true);
    try {
      const result = await removeOrgSkillTypeAction(orgId, slug);
      if (!result.success) {
        toast({ title: result.error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Skill type removed' });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  function updateRequirement(index: number, patch: Partial<SkillRequirementDraft>) {
    setTaskForm((prev) => {
      const next = [...prev.requiredSkills];
      next[index] = { ...next[index], ...patch };
      return { ...prev, requiredSkills: next };
    });
  }

  function addRequirement() {
    setTaskForm((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, { ...DEFAULT_SKILL_REQUIREMENT }],
    }));
  }

  function removeRequirement(index: number) {
    setTaskForm((prev) => {
      if (prev.requiredSkills.length === 1) {
        return {
          ...prev,
          requiredSkills: [{ ...DEFAULT_SKILL_REQUIREMENT }],
        };
      }
      return {
        ...prev,
        requiredSkills: prev.requiredSkills.filter((_, idx) => idx !== index),
      };
    });
  }

  if (!orgId) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Semantic dictionary is only available in organization context.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as DictionaryViewMode)}>
        <TabsList>
          <TabsTrigger value="dictionary">Dictionary View</TabsTrigger>
          <TabsTrigger value="graph">Graph View</TabsTrigger>
        </TabsList>

        <TabsContent value="dictionary" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4" />
              Task-Type Dictionary
            </CardTitle>
            <CardDescription>
              Define organization task types and required skills used by Document Parser import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{taskTypes.length}</Badge>
                entries
              </div>
              <Button size="sm" onClick={openCreateTaskDialog}>
                <Plus className="mr-1 size-4" />
                Add Task Type
              </Button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {taskTypes.map((entry) => (
                <div key={entry.slug} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entry.name}</p>
                        <Badge variant={entry.active ? 'default' : 'secondary'}>
                          {entry.active ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.slug}</p>
                      {entry.aliases.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          aliases: {entry.aliases.join(', ')}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        required skills: {entry.requiredSkills.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditTaskDialog(entry)}>
                        Edit
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => void removeTaskType(entry.slug)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && taskTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">No task-type entries yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookType className="size-4" />
              Skill-Type Dictionary
            </CardTitle>
            <CardDescription>
              Define organization skill labels for taxonomy alignment and future mapping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{skillTypes.length}</Badge>
                entries
              </div>
              <Button size="sm" onClick={openCreateSkillDialog}>
                <Plus className="mr-1 size-4" />
                Add Skill Type
              </Button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {skillTypes.map((entry) => (
                <div key={entry.slug} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entry.name}</p>
                        <Badge variant={entry.active ? 'default' : 'secondary'}>
                          {entry.active ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.slug}</p>
                      {entry.aliases.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          aliases: {entry.aliases.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditSkillDialog(entry)}>
                        Edit
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => void removeSkillType(entry.slug)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && skillTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">No skill-type entries yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Relationship Graph</CardTitle>
              <CardDescription>
                Task types and their required skill dependencies. Double-click a node to edit it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">task: {taskTypes.length}</Badge>
                <Badge variant="secondary">skill: {skillTypes.length}</Badge>
                <Badge variant={graphData.unresolvedCount > 0 ? 'destructive' : 'outline'}>
                  unresolved skills: {graphData.unresolvedCount}
                </Badge>
              </div>

              <div
                ref={bindGraphContainerRef}
                className="relative w-full overflow-hidden rounded-lg border bg-background"
                style={{ height: 580 }}
                aria-label="Organization semantic dictionary graph"
              />

              {process.env.NODE_ENV !== 'production' && (
                <p className="text-[11px] text-muted-foreground">
                  debug: ready={graphDebug.networkReady ? 'yes' : 'no'} | size={graphDebug.containerSize} | canvas={graphDebug.canvasCount} | nodes={graphDebug.nodeCount} | edges={graphDebug.edgeCount}
                </p>
              )}

              {taskTypes.length === 0 && skillTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No dictionary entries yet. Create task-type or skill-type entries to build the graph.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTaskSlug ? 'Edit Task Type' : 'Create Task Type'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 rounded-md border border-dashed p-3">
            <Label htmlFor="task-ai-prompt">AI Assistant Prompt</Label>
            <Textarea
              id="task-ai-prompt"
              value={taskAssistPrompt}
              onChange={(e) => setTaskAssistPrompt(e.target.value)}
              placeholder="Describe the task type, typical work content, and required capability level."
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => void applyTaskTypeSuggestion()} disabled={taskAssistLoading}>
                <Sparkles className="mr-1 size-4" />
                {taskAssistLoading ? 'Generating...' : 'Suggest With AI'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-slug">Slug</Label>
              <Input
                id="task-slug"
                value={taskForm.slug}
                disabled={!!editingTaskSlug}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="org:my-org:task-type:electrical-installation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-name">Name</Label>
              <Input
                id="task-name"
                value={taskForm.name}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Electrical Installation"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-aliases">Aliases (comma separated)</Label>
              <Input
                id="task-aliases"
                value={taskForm.aliases}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, aliases: e.target.value }))}
                placeholder="install electric panel, wiring"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Used for low-voltage and panel setup tasks."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>State</Label>
              <Select
                value={taskForm.active ? 'active' : 'inactive'}
                onValueChange={(value) => setTaskForm((prev) => ({ ...prev, active: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Required Skills</p>
              <Button size="sm" variant="outline" onClick={addRequirement}>
                <Plus className="mr-1 size-4" />
                Add Requirement
              </Button>
            </div>

            <div className="space-y-2">
              {taskForm.requiredSkills.map((requirement, index) => (
                <div key={`req-${index}`} className="grid gap-2 rounded-md border p-2 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Label className="text-xs">Skill Slug</Label>
                    <Select
                      value={requirement.tagSlug || '__empty__'}
                      onValueChange={(value) =>
                        updateRequirement(index, {
                          tagSlug: value === '__empty__' ? '' : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing skill type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">None</SelectItem>
                        {skillTypeOptions.map((option) => (
                          <SelectItem key={option.slug} value={option.slug}>
                            {option.name} ({option.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Minimum Tier</Label>
                    <Select
                      value={requirement.minimumTier}
                      onValueChange={(value) =>
                        updateRequirement(index, {
                          minimumTier: value as SkillRequirement['minimumTier'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tierOptions.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={requirement.quantity}
                      onChange={(e) => updateRequirement(index, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Min XP</Label>
                    <Input
                      type="number"
                      min={0}
                      value={requirement.minXp}
                      onChange={(e) => updateRequirement(index, { minXp: e.target.value })}
                      placeholder="optional"
                    />
                  </div>
                  <div className="flex items-end md:col-span-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRequirement(index)}
                      title="Remove requirement"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTaskDialogOpen(false);
                resetTaskForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveTaskType()} disabled={saving || taskForm.slug.trim() === '' || taskForm.name.trim() === ''}>
              <Save className="mr-1 size-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingSkillSlug ? 'Edit Skill Type' : 'Create Skill Type'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 rounded-md border border-dashed p-3">
            <Label htmlFor="skill-ai-prompt">AI Assistant Prompt</Label>
            <Textarea
              id="skill-ai-prompt"
              value={skillAssistPrompt}
              onChange={(e) => setSkillAssistPrompt(e.target.value)}
              placeholder="Describe the competency domain, scenarios, and expected expertise level."
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => void applySkillTypeSuggestion()} disabled={skillAssistLoading}>
                <Sparkles className="mr-1 size-4" />
                {skillAssistLoading ? 'Generating...' : 'Suggest With AI'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="skill-slug">Slug</Label>
              <Input
                id="skill-slug"
                value={skillForm.slug}
                disabled={!!editingSkillSlug}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="org:my-org:skill-type:electrical"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-name">Name</Label>
              <Input
                id="skill-name"
                value={skillForm.name}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Electrical"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-aliases">Aliases (comma separated)</Label>
              <Input
                id="skill-aliases"
                value={skillForm.aliases}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, aliases: e.target.value }))}
                placeholder="electric, wiring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-description">Description</Label>
              <Textarea
                id="skill-description"
                value={skillForm.description}
                onChange={(e) => setSkillForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Organization-specific skill taxonomy entry."
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={skillForm.active ? 'active' : 'inactive'}
                onValueChange={(value) => setSkillForm((prev) => ({ ...prev, active: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSkillDialogOpen(false);
                resetSkillForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveSkillType()} disabled={saving || skillForm.slug.trim() === '' || skillForm.name.trim() === ''}>
              <Save className="mr-1 size-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
