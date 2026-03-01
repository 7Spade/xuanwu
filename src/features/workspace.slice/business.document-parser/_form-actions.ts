'use server';

import { extractInvoiceItems } from '@/shared/ai/flows/extract-invoice-items';
import { z } from 'zod';
import type { WorkItem } from '@/shared/ai/schemas/docu-parse';

const actionInputSchema = z.object({
  documentDataUri: z.string().startsWith('data:'),
});

// [SEC-3] Allowlist for server-side file fetches to prevent SSRF.
// Only Firebase Storage hostnames are permitted.
const ALLOWED_STORAGE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

function isAllowedStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS, an allowed host, no embedded credentials, no non-standard port
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_STORAGE_HOSTS.has(parsed.hostname) &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.port === ''
    );
  } catch {
    return false;
  }
}

export type ActionState = {
  data?: { workItems: WorkItem[] };
  error?: string;
  fileName?: string;
};

export async function extractDataFromDocument(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get('file') as File | null;
  const downloadURL = formData.get('downloadURL') as string | null;
  const urlFileName = formData.get('fileName') as string | null;
  const urlFileType = formData.get('fileType') as string | null;

  // Resolve the file buffer: either from a direct File upload or by fetching a
  // Firebase Storage URL on the server (no CORS restrictions in Node.js).
  let fileBuffer: ArrayBuffer;
  let mimeType: string;
  let displayName: string;

  if (file && file.size > 0) {
    fileBuffer = await file.arrayBuffer();
    mimeType = file.type;
    displayName = file.name;
  } else if (downloadURL) {
    if (!urlFileName) {
      return { error: 'Missing file name for URL-based parse.' };
    }
    // [SEC-3] Validate URL against the Firebase Storage allowlist before fetching.
    if (!isAllowedStorageUrl(downloadURL)) {
      return { error: 'File URL is not from an authorised storage host.' };
    }
    try {
      const res = await fetch(downloadURL);
      if (!res.ok) {
        return { error: `Failed to retrieve file from storage (HTTP ${res.status}).` };
      }
      fileBuffer = await res.arrayBuffer();
      // Prefer the authoritative content-type from the server response; fall
      // back to the client-provided fileType only when the header is absent.
      mimeType = res.headers.get('content-type') || (urlFileType || 'application/octet-stream');
      displayName = urlFileName;
    } catch (e) {
      // [SEC-1] Log a safe message only — do not log the raw error object which
      // may contain internal path details or sensitive request metadata.
      const safeMsg = e instanceof Error ? e.message : 'network error';
      console.error('[document-parser] Server-side fetch failed:', safeMsg);
      return { error: 'Could not retrieve the file from storage.' };
    }
  } else {
    return { error: 'Please select a file to upload.' };
  }

  try {
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const documentDataUri = `data:${mimeType};base64,${base64String}`;

    const validatedInput = actionInputSchema.safeParse({ documentDataUri });
    if (!validatedInput.success) {
      return { error: 'Invalid file data URI.' };
    }

    const result = await extractInvoiceItems(validatedInput.data);

    if (!result || !result.workItems) {
      return {
        error:
          'Failed to extract data. The AI model returned an unexpected result.',
      };
    }

    // Sanitize AI output: coerce numeric strings to numbers and drop rows where
    // required fields are still missing after coercion. This prevents TypeError
    // in the UI (undefined.toLocaleString) and Firestore rejections (undefined).
    const toNum = (v: unknown, fallback: number): number => {
      const n = Number(v);
      return isNaN(n) ? fallback : n;
    };
    const sanitizedItems: WorkItem[] = result.workItems
      .filter((item) => item != null && typeof item.item === 'string' && item.item.trim() !== '')
      .map((item) => ({
        item: item.item,
        // quantity 0 is invalid for an invoice line — default to 1
        quantity: toNum(item.quantity, 1) || 1,
        // 0 is a valid price (e.g. free/fully-discounted) — only fall back when null/undefined
        unitPrice: item.unitPrice != null ? toNum(item.unitPrice, 0) : 0,
        ...(item.discount != null ? { discount: toNum(item.discount, 0) } : {}),
        price: item.price != null ? toNum(item.price, 0) : 0,
      }));

    if (sanitizedItems.length === 0) {
      return {
        error: 'No valid line items could be extracted from this document.',
      };
    }

    return { data: { workItems: sanitizedItems }, fileName: displayName };
  } catch (e) {
    // [SEC-1] Log a safe message only — do not log the raw error object which
    // may expose internal AI model details or stack traces to server logs.
    const safeMsg = e instanceof Error ? e.message : 'unknown error';
    console.error('[document-parser] AI extraction failed:', safeMsg);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to process document: ${errorMessage}` };
  }
}
