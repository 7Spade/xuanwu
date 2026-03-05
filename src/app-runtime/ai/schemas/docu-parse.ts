import { z } from 'genkit';

/**
 * Module: docu-parse.ts
 * Purpose: 定義文件解析 AI 流程的輸入輸出契約
 * Responsibilities: ParsedWorkItem schema、提取流程 input/output schema
 * Constraints: deterministic logic, respect module boundaries
 */

/**
 * @fileOverview This file defines the Zod schemas and TypeScript types for the document parsing AI flow.
 */

export const ParsedWorkItemSchema = z.object({
  item: z.string().describe('The description of the work item.'),
  quantity: z.number().describe('The quantity of the work item.'),
  unitPrice: z.number().describe('The unit price of the work item.'),
  discount: z.number().describe('The discount for the work item.').optional(),
  price: z
    .number()
    .describe(
      "The final total price for the work item after discount (小計)."
    ),
  semanticTagSlug: z
    .string()
    .describe('Semantic tag slug matched from semantic-graph for this line item.'),
  sourceIntentIndex: z
    .number()
    .describe('0-based index of the source parsing intent line item.'),
});
export const WorkItemSchema = ParsedWorkItemSchema;
export type WorkItem = z.infer<typeof ParsedWorkItemSchema>;

export const ExtractInvoiceItemsInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document (invoice, quote) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export const ExtractInvoiceItemsOutputSchema = z.object({
  workItems: z
    .array(ParsedWorkItemSchema)
    .describe('A list of extracted work items.'),
});
