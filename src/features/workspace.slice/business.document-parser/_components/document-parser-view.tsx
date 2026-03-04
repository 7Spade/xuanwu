'use client';

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


const initialState: ActionState = {
  data: undefined,
  error: undefined,
  fileName: undefined,
};

function WorkItemsTable({
  initialData,
  onImport,
}: {
  initialData: WorkItem[];
  onImport: () => Promise<void>;
}) {
  const total = initialData.reduce((sum, item) => sum + item.price, 0);
  return (
    <div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Item</th>
              <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Qty</th>
              <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Unit Price</th>
              <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Discount</th>
              <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">{item.item}</td>
                <td className="px-4 py-2 text-right">{item.quantity}</td>
                <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{item.discount !== undefined ? `${item.discount}%` : '—'}</td>
                <td className="px-4 py-2 text-right font-medium">{item.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td colSpan={4} className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Total</td>
              <td className="px-4 py-2 text-right font-bold">{total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Button onClick={onImport}>Import as Root Tasks</Button>
      </div>
    </div>
  );
}


export function WorkspaceDocumentParser() {
  const [state, formAction] = useActionState(
    extractDataFromDocument,
    initialState
  );
  const { eventBus, logAuditEvent, workspace, createIssue, pendingParseFile, setPendingParseFile } = useWorkspace();
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
  useEffect(() => {
    const unsub = subscribeToParsingIntents(workspace.id, setParsingIntents);
    return () => unsub();
  }, [workspace.id]);

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
      // PARSING_INTENT -->|解析異常| TRACK_B_ISSUES
      createIssue(
        `Parser Error: ${state.fileName || 'Document'}`,
        'technical',
        'high'
      ).catch((err: unknown) => console.error('Failed to create parser issue:', err));
      logAuditEvent('Parsing Failed', `Document: ${state.fileName || 'Unknown'}`, 'create');
    }
  }, [state.error, state.fileName, toast, createIssue, logAuditEvent]);

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

    const lineItems = state.data.workItems.map((item) => ({
      name: item.item,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      // Omit discount entirely when undefined to avoid Firestore "Unsupported field value: undefined"
      ...(item.discount !== undefined ? { discount: item.discount } : {}),
      subtotal: item.price,
    }));

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
      toast({
        variant: 'destructive',
        title: 'Failed to Save Parsing Record',
        description: 'Could not persist the parsing intent. Import aborted.',
      });
      return;
    }

    // Publish event with intentId so tasks and schedule proposals can reference the Digital Twin.
    // skillRequirements is omitted here — the current AI flow extracts invoice line items only.
    // When the AI flow is extended to extract skill requirements, pass them here.
    eventBus.publish('workspace:document-parser:itemsExtracted', {
        sourceDocument: state.fileName || 'Unknown Document',
        intentId,
        intentVersion: INITIAL_PARSING_INTENT_VERSION,
        autoImport: true,
        items: lineItems,
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
                    <WorkItemsTable initialData={state.data.workItems} onImport={handleImport} />
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
            <CardDescription>Digital Twin records — each entry anchors tasks via SourcePointer.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parsingIntents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-xs">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
