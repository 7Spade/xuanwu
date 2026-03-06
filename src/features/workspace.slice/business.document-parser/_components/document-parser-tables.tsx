import {
  AlertCircle,
  BriefcaseBusiness,
  Coins,
  Hammer,
  type LucideIcon,
  ShieldCheck,
} from 'lucide-react';

import type { WorkItem } from '@/app-runtime/ai/schemas/docu-parse';
import { classifyCostItem, shouldMaterializeAsTask } from '@/features/semantic-graph.slice';
import type { TagSnapshotPresentation } from '@/features/semantic-graph.slice';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';

import type { ParsingIntent } from '../_types';

const ICON_MAP: Record<TagSnapshotPresentation['iconToken'], LucideIcon> = {
  hammer: Hammer,
  briefcase: BriefcaseBusiness,
  shield: ShieldCheck,
  coins: Coins,
};

const COLOR_CLASS_MAP: Record<TagSnapshotPresentation['colorToken'], string> = {
  neutral: 'text-muted-foreground',
  warning: 'text-amber-600',
  info: 'text-blue-600',
  success: 'text-green-600',
};

export function WorkItemsTable({
  initialData,
  onImport,
  tagPresentationMap,
}: {
  initialData: WorkItem[];
  onImport: () => Promise<void>;
  tagPresentationMap: Readonly<Record<string, TagSnapshotPresentation>>;
}) {
  const total = initialData.reduce((sum, item) => sum + item.price, 0);

  const getItemSemanticStatus = (item: WorkItem) => {
    const semantic = classifyCostItem(item.item, { includeSemanticTagSlug: true });
    const semanticTagSlug =
      typeof item.semanticTagSlug === 'string' && item.semanticTagSlug.trim() !== ''
        ? item.semanticTagSlug
        : semantic.semanticTagSlug;
    const itemStatus = shouldMaterializeAsTask(semantic.costItemType)
      ? 'MATERIALIZABLE'
      : 'SKIPPED';
    return { semanticTagSlug, itemStatus };
  };

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
              <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Tag</th>
              <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((item, idx) => {
              const { semanticTagSlug, itemStatus } = getItemSemanticStatus(item);
              const presentation = tagPresentationMap[semanticTagSlug];
              const Icon = presentation ? ICON_MAP[presentation.iconToken] : Hammer;
              const colorClass = presentation ? COLOR_CLASS_MAP[presentation.colorToken] : 'text-muted-foreground';
              return (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">{item.item}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{item.discount !== undefined ? `${item.discount}%` : '—'}</td>
                  <td className="px-4 py-2 text-right font-medium">{item.price.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                      <Icon className={`size-3 ${colorClass}`} />
                      {presentation?.label ?? semanticTagSlug}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={itemStatus === 'MATERIALIZABLE' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                      {itemStatus}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td colSpan={6} className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Total</td>
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

export function ParsedItemsTable({
  intent,
  tagPresentationMap,
}: {
  intent: ParsingIntent;
  tagPresentationMap: Readonly<Record<string, TagSnapshotPresentation>>;
}) {
  const total = intent.lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (!intent.lineItems.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed p-8 text-center opacity-30">
        <AlertCircle className="mx-auto mb-2 size-6" />
        <p className="text-xs font-bold uppercase tracking-widest">No line items</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Item</th>
            <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Type</th>
            <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Qty</th>
            <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Unit Price</th>
            <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Discount</th>
            <th className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Subtotal</th>
            <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Tag</th>
            <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {intent.lineItems.map((item, idx) => {
            const presentation = tagPresentationMap[item.semanticTagSlug];
            const Icon = presentation ? ICON_MAP[presentation.iconToken] : Hammer;
            const colorClass = presentation ? COLOR_CLASS_MAP[presentation.colorToken] : 'text-muted-foreground';

            return (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                    <Icon className={`size-3 ${colorClass}`} />
                    {presentation?.category ?? item.costItemType}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{item.quantity}</td>
                <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{item.discount !== undefined ? `${item.discount}%` : '—'}</td>
                <td className="px-4 py-2 text-right font-medium">{item.subtotal.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                    <Icon className={`size-3 ${colorClass}`} />
                    {presentation?.label ?? item.semanticTagSlug}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Badge variant={shouldMaterializeAsTask(item.costItemType) ? 'default' : 'secondary'} className="text-[10px] uppercase">
                    {shouldMaterializeAsTask(item.costItemType) ? 'MATERIALIZABLE' : 'SKIPPED'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/50">
            <td colSpan={7} className="px-4 py-2 text-right font-bold uppercase tracking-widest text-muted-foreground">Total</td>
            <td className="px-4 py-2 text-right font-bold">{total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
