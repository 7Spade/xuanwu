// [職責] 單個事件條目 (Dumb Component)
"use client";

import { format } from "date-fns";

import { Badge } from "@/shared/shadcn-ui/badge";
import { cn } from "@/shared/shadcn-ui/utils/utils";

import { type AuditLog } from "../_types";

import { AuditEventItemContainer } from "./audit-timeline";
import { AuditTypeIcon } from "./audit-type-icon";

interface AuditEventItemProps {
    log: AuditLog;
    onSelect: () => void;
}

export function AuditEventItem({ log, onSelect }: AuditEventItemProps) {
  const theme = {
    create: "text-green-500",
    delete: "text-destructive",
    update: "text-primary",
    security: "text-muted-foreground",
  }[log.type] || "text-primary";

  const logTime = log.recordedAt?.seconds
    ? format(log.recordedAt.seconds * 1000, "PPP p")
    : "Just now";

  return (
    <AuditEventItemContainer>
      <div className="relative z-10 flex size-6 items-center justify-center rounded-full border-2 border-border bg-background">
        <AuditTypeIcon type={log.type} />
      </div>
      <button type="button" className="flex-1 cursor-pointer space-y-1 text-left" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none">
            <span className="font-bold">{log.actor}</span>{" "}
            <span className={cn("font-semibold", theme)}>{log.action.toLowerCase()}</span>{" "}
            <span className="text-foreground/80">{log.target}</span>
          </p>
          <time className="text-xs text-muted-foreground">{logTime}</time>
        </div>
        {log.workspaceName && (
            <Badge variant="secondary" className="text-[10px]">{log.workspaceName}</Badge>
        )}
      </button>
    </AuditEventItemContainer>
  );
}
