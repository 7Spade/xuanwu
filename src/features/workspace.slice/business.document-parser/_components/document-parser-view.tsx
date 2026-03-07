'use client';

import { Loader2, UploadCloud, File as FileIcon, ClipboardList, CheckCircle2, Clock, AlertCircle, ListChecks } from 'lucide-react';
import { useActionState, useTransition, useRef, useEffect, useCallback, useState, type ChangeEvent } from 'react';

import { logDomainError } from '@/features/observability';
import { classifyCostItem } from '@/features/semantic-graph.slice';
import { getTagSnapshotPresentationMap, type TagSnapshotPresentation } from '@/features/semantic-graph.slice';
import { Badge } from '@/shadcn-ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shadcn-ui/card';
import { useToast } from '@/shadcn-ui/hooks/use-toast';


import { persistWorkspaceOutboxEvent } from '@/features/workspace.slice/application/_outbox';
import { useWorkspace } from '@/features/workspace.slice/core';
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

import { ParsedItemsTable, WorkItemsTable } from './document-parser-tables';


const initialState: ActionState = {
  data: undefined,
  error: undefined,
  fileName: undefined,
};

export function WorkspaceDocumentParser() {
  const [state, formAction] = useActionState(
    extractDataFromDocument,
    initialState
  );
  const { eventBus, logAuditEvent, workspace, pendingParseFile, setPendingParseFile } = useWorkspace();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  // Tracks the WorkspaceFile ID when a file is sent from the Files tab for full traceability
  const sourceFileIdRef = useRef<string | undefined>(undefined);
  // Tracks the original download URL (SourcePointer) for the Digital Twin ParsingIntent
  const sourceFileDownloadURLRef = useRef<string | undefined>(undefined);
  // Tracks the last saved intentId so that re-parses supersede the prior intent [#A4]
  const previousIntentIdRef = useRef<IntentID | undefined>(undefined);

  // Real-time ParsingIntent history (Digital Twin 解析合約 list)
  const [parsingIntents, setParsingIntents] = useState<ParsingIntent[]>([]);
  // Currently selected intent for line-item inspection
  const [selectedIntent, setSelectedIntent] = useState<ParsingIntent | null>(null);
  const [tagPresentationMap, setTagPresentationMap] = useState<Record<string, TagSnapshotPresentation>>({});
  useEffect(() => {
    const unsub = subscribeToParsingIntents(workspace.id, (intents) => {
      setParsingIntents(intents);
      // Keep selectedIntent in sync with latest Firestore data (e.g. after status update).
      setSelectedIntent((prev) =>
        prev ? (intents.find((i) => i.id === prev.id) ?? prev) : null
      );
    });
    return () => unsub();
  }, [workspace.id]);

  useEffect(() => {
    const parsedWorkItemSlugs = (state.data?.workItems ?? []).map((item) => {
      const semantic = classifyCostItem(item.item, { includeSemanticTagSlug: true });
      return typeof item.semanticTagSlug === 'string' && item.semanticTagSlug.trim() !== ''
        ? item.semanticTagSlug
        : semantic.semanticTagSlug;
    });

    const intentSlugs = selectedIntent?.lineItems.map((item) => item.semanticTagSlug) ?? [];
    const allSlugs = [...parsedWorkItemSlugs, ...intentSlugs].filter((slug) => slug.length > 0);

    if (allSlugs.length === 0) {
      setTagPresentationMap({});
      return;
    }

    let cancelled = false;
    const hydrateTagPresentationMap = async () => {
      const map = await getTagSnapshotPresentationMap(allSlugs);
      if (!cancelled) {
        setTagPresentationMap(map);
      }
    };

    void hydrateTagPresentationMap();

    return () => {
      cancelled = true;
    };
  }, [selectedIntent, state.data?.workItems]);

  // Helper: trigger the AI extraction pipeline from a Firebase Storage URL.
  // The URL is passed directly to the Server Action which fetches it server-side,
  // avoiding the browser CORS restriction on Firebase Storage URLs.
  const triggerParseFromURL = useCallback((payload: { fileName: string; downloadURL: string; fileType: string; fileId?: string }) => {
    sourceFileIdRef.current = payload.fileId;
    sourceFileDownloadURLRef.current = payload.downloadURL;
    const formData = new FormData();
    formData.append('downloadURL', payload.downloadURL);
    formData.append('fileName', payload.fileName);
    formData.append('fileType', payload.fileType || '');
    startTransition(() => formAction(formData));
  }, [formAction, startTransition]);

  // On mount: if files-view queued a file via WorkspaceProvider context, auto-trigger.
  // This bridges the cross-tab gap — subscriber only exists when this component is mounted.
  // Deps intentionally empty: pendingParseFile/setPendingParseFile are stable React state
  // references, triggerParseFromURL is stable via useCallback, and we only want to run once
  // on mount (not re-run whenever pendingParseFile changes later).
  useEffect(() => {
    if (pendingParseFile) {
      setPendingParseFile(null);
      triggerParseFromURL(pendingParseFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: state.error,
      });
      eventBus.publish('workspace:document-parser:failed', {
        sourceDocument: state.fileName || 'Document',
        reason: state.error,
      });
      logAuditEvent('Parsing Failed', `Document: ${state.fileName || 'Unknown'}`, 'create');
    }
  }, [state.error, state.fileName, eventBus, toast, logAuditEvent]);

  // Subscribe to files:sendToParser — handles same-tab publishes (edge case fallback).
  // The primary cross-tab path uses WorkspaceProvider pendingParseFile state.
  useEffect(() => {
    const unsubFiles = eventBus.subscribe(
      'workspace:files:sendToParser',
      (payload) => triggerParseFromURL(payload)
    );
    return () => unsubFiles();
  }, [eventBus, triggerParseFromURL]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        startTransition(() => {
          formAction(formData);
        });
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!state.data?.workItems) return;

    const lineItems = state.data.workItems.map((item, index) => {
      const semantic = classifyCostItem(item.item, { includeSemanticTagSlug: true });
      return {
      name: item.item,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      // Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
      ...(item.discount !== undefined ? { discount: item.discount } : {}),
      subtotal: item.price,
      // Layer-2 Semantic Classification (VS8) — applied here during the import phase.
      costItemType: semantic.costItemType,
      semanticTagSlug:
        typeof item.semanticTagSlug === 'string' && item.semanticTagSlug.trim() !== ''
          ? item.semanticTagSlug
          : semantic.semanticTagSlug,
      sourceIntentIndex:
        typeof item.sourceIntentIndex === 'number' && Number.isFinite(item.sourceIntentIndex)
          ? item.sourceIntentIndex
          : index,
    }});

    let intentId: IntentID;
    let oldIntentId: IntentID | undefined;
    try {
      const result = await saveParsingIntent(
        workspace.id,
        state.fileName || 'Unknown Document',
        lineItems,
        {
          sourceFileId: sourceFileIdRef.current,
          // SourcePointer: immutable link to the original file in Firebase Storage
          sourceFileDownloadURL: sourceFileDownloadURLRef.current as SourcePointer | undefined,
          // Supersede the prior intent when re-parsing the same session [#A4]
          previousIntentId: previousIntentIdRef.current,
        }
      );
      intentId = result.intentId;
      oldIntentId = result.oldIntentId;
    } catch (error: unknown) {
      console.error('Failed to save parsing intent:', error);
      const reason = error instanceof Error ? error.message : 'Could not persist the parsing intent. Import aborted.';
      toast({
        variant: 'destructive',
        title: 'Failed to Save Parsing Record',
        description: reason,
      });

      eventBus.publish('workspace:document-parser:failed', {
        sourceDocument: state.fileName || 'Document',
        reason,
      });

      logAuditEvent('Parsing Intent Persist Failed', `Document: ${state.fileName || 'Unknown'}`, 'create');
      return;
    }

    // Publish event with intentId so tasks and schedule proposals can reference the Digital Twin.
    // skillRequirements is omitted here — the current AI flow extracts invoice line items only.
    // When the AI flow is extended to extract skill requirements, pass them here.
    // oldIntentId is forwarded when a prior intent was superseded so the import handler can
    // reconcile existing `todo` tasks in-place rather than creating duplicates [#A4].
    eventBus.publish('workspace:document-parser:itemsExtracted', {
        sourceDocument: state.fileName || 'Unknown Document',
        intentId,
        intentVersion: INITIAL_PARSING_INTENT_VERSION,
        autoImport: true,
        items: lineItems,
        ...(oldIntentId && { oldIntentId }),
    });

    // Dispatch IntentDeltaProposed [#A4] — at-least-once delivery via wsOutbox [S1][E5].
    // This cross-BC event notifies external consumers (e.g. scheduling.slice) that a new
    // Digital Twin delta is available, without exposing document-parser internals [D7].
    // oldIntentId is included when a prior intent was superseded so consumers can retract
    // draft tasks linked to the previous intent.
    const deltaPayload = {
      intentId,
      intentVersion: INITIAL_PARSING_INTENT_VERSION,
      workspaceId: workspace.id,
      sourceFileName: state.fileName || 'Unknown Document',
      taskDraftCount: lineItems.length,
      ...(oldIntentId && { oldIntentId }),
    };
    eventBus.publish('workspace:parsing-intent:deltaProposed', deltaPayload);
    persistWorkspaceOutboxEvent(workspace.id, 'workspace:parsing-intent:deltaProposed', deltaPayload)
      .catch((err: unknown) => {
        logDomainError({
          occurredAt: new Date().toISOString(),
          traceId: crypto.randomUUID(),
          source: 'document-parser:handleImport:persistWorkspaceOutboxEvent',
          message: 'wsOutbox persist failed for deltaProposed — at-least-once delivery may be degraded.',
          detail: err instanceof Error ? (err.stack ?? err.message) : String(err),
        });
      });

    // Record the new intentId so any subsequent re-parse in this session supersedes it [#A4]
    previousIntentIdRef.current = intentId;
    // Reset source file references after successful import
    sourceFileIdRef.current = undefined;
    sourceFileDownloadURLRef.current = undefined;
    logAuditEvent('Triggered Task Import', `From document: ${state.fileName}`, 'create');
  }

  return (
    <div className="space-y-6">
      <Card className="w-full bg-card/50 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Select a document to begin AI data extraction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef}>
            <div
              className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary"
              onClick={handleUploadClick}
              onKeyDown={(e) => e.key === 'Enter' && handleUploadClick()}
              role="button"
              tabIndex={0}
              aria-label="Upload document"
            >
              <UploadCloud className="size-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, PNG, JPG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>
          </form>
        </CardContent>
      </Card>

       {isPending && (
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="mb-4 size-16 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">Extracting Data...</p>
          <p className="text-muted-foreground">This may take a moment.</p>
        </div>
      )}

      {state.data && !isPending && (
        <div className="mt-8">
            <Card className="bg-card shadow-2xl">
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle className="text-2xl">Extracted Items</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-2">
                        <FileIcon className="size-4" />
                        {state.fileName}
                    </CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                    <WorkItemsTable initialData={state.data.workItems} onImport={handleImport} tagPresentationMap={tagPresentationMap} />
                </CardContent>
            </Card>
        </div>
      )}

      {/* ParsingIntent History — Digital Twin 解析合約 */}
      {parsingIntents.length > 0 && (
        <Card className="mt-8 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <ClipboardList className="size-4" /> Parsing Intent History
            </CardTitle>
            <CardDescription>Digital Twin records — click a row to inspect its line items.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parsingIntents.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => setSelectedIntent((prev) => prev?.id === intent.id ? null : intent)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-xs transition-colors hover:bg-muted/50 ${selectedIntent?.id === intent.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {intent.status === 'imported' ? (
                      <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                    ) : intent.status === 'failed' ? (
                      <AlertCircle className="size-4 shrink-0 text-destructive" />
                    ) : (
                      <Clock className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold">{intent.sourceFileName}</p>
                      <p className="text-muted-foreground">{intent.lineItems.length} line item(s)</p>
                    </div>
                  </div>
                  <Badge variant={intent.status === 'imported' ? 'default' : intent.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                    {intent.status}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsing Intent Line Items — shown when a history row is selected */}
      {selectedIntent && (
        <Card className="mt-4 bg-card/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                  <ListChecks className="size-4" /> Parsing Intent
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <FileIcon className="size-3" />
                  {selectedIntent.sourceFileName}
                  <span className="text-muted-foreground">·</span>
                  {selectedIntent.lineItems.length} item(s)
                </CardDescription>
              </div>
              <Badge
                variant={selectedIntent.status === 'imported' ? 'default' : selectedIntent.status === 'failed' ? 'destructive' : 'secondary'}
                className="mt-0.5 text-[10px] uppercase"
              >
                {selectedIntent.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ParsedItemsTable intent={selectedIntent} tagPresentationMap={tagPresentationMap} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
