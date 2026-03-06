/**
 * Module: finance-item-table.tsx
 * Purpose: Render finance claim items with semantic routing and non-task cost labeling.
 * Responsibilities: claim selection UI and tag-snapshot driven visual metadata rendering.
 * Constraints: deterministic logic, respect module boundaries
 */

'use client';

import { BriefcaseBusiness, Coins, Hammer, type LucideIcon, ShieldCheck } from 'lucide-react';

import type { TagSnapshotPresentation } from '@/features/semantic-graph.slice';
import { Badge } from '@/shared/shadcn-ui/badge';
import { Checkbox } from '@/shared/shadcn-ui/checkbox';
import { Input } from '@/shared/shadcn-ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/shadcn-ui/table';

import { NON_TASK_COST_ITEM_TYPES } from '../_constants';
import type { FinanceClaimDraftEntry, FinanceDirectiveItem } from '../_types';

interface FinanceItemTableProps {
  readonly items: readonly FinanceDirectiveItem[];
  readonly claimDraft: Readonly<Record<string, FinanceClaimDraftEntry>>;
  readonly isEditable: boolean;
  readonly tagPresentationMap: Readonly<Record<string, TagSnapshotPresentation>>;
  readonly onToggleItem: (itemId: string, selected: boolean) => void;
  readonly onChangeQuantity: (itemId: string, quantity: number) => void;
}

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

export function FinanceItemTable(props: FinanceItemTableProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">選取</TableHead>
            <TableHead>項目</TableHead>
            <TableHead>語義標籤</TableHead>
            <TableHead className="w-[120px] text-right">可請數量</TableHead>
            <TableHead className="w-[140px] text-right">請款數量</TableHead>
            <TableHead className="w-[140px] text-right">單價</TableHead>
            <TableHead className="w-[140px] text-right">小計</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.items.map((item) => {
            const draft = props.claimDraft[item.id] ?? { selected: false, quantity: 0 };
            const semantic = props.tagPresentationMap[item.semanticTagSlug];
            const Icon = semantic ? ICON_MAP[semantic.iconToken] : Hammer;
            const colorClass = semantic ? COLOR_CLASS_MAP[semantic.colorToken] : 'text-muted-foreground';
            const isNonTaskCost = NON_TASK_COST_ITEM_TYPES.has(item.costItemType);
            const lineAmount = item.unitPrice * draft.quantity;

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={draft.selected}
                    disabled={!props.isEditable}
                    onCheckedChange={(checked) => props.onToggleItem(item.id, Boolean(checked))}
                  />
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sourceDocument}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className={`size-3.5 ${colorClass}`} />
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px]">{semantic?.label ?? item.semanticTagSlug}</Badge>
                      {isNonTaskCost && (
                        <Badge variant="secondary" className="text-[9px]">非任務成本項</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs">{item.remainingQuantity}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={item.remainingQuantity}
                    value={draft.quantity}
                    disabled={!props.isEditable || !draft.selected}
                    onChange={(event) => props.onChangeQuantity(item.id, Number(event.target.value || 0))}
                    className="h-8 text-right"
                  />
                </TableCell>
                <TableCell className="text-right text-xs">${item.unitPrice.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs font-semibold">${lineAmount.toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
