// [職責] Demand Board — org HR visibility into open and assigned schedule demands.
// Per docs/prd-schedule-workforce-skills.md FR-W0 + FR-W6.
import { DemandBoard } from '@/features/projection.demand-board';

export default function DemandBoardPage() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6 space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">需求看板</h1>
        <p className="text-sm text-muted-foreground">
          即時檢視開放與已指派的排程需求，並進行人工指派（FR-W0 / FR-W6）。
        </p>
      </div>
      <DemandBoard />
    </div>
  );
}
