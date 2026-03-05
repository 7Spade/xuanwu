// [職責] 點擊事件後顯示的 JSON Diff 或詳細變更對照
"use client";

import { ScrollArea } from "@/shared/shadcn-ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/shadcn-ui/sheet";

import { type AuditLog } from "../_types";

interface AuditDetailSheetProps {
    log: AuditLog | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuditDetailSheet({ log, isOpen, onOpenChange }: AuditDetailSheetProps) {
    if (!log) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>{log.action}</SheetTitle>
                    <SheetDescription>
                        Detailed information about this audit event.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="mt-4 h-[calc(100vh-10rem)]">
                    <pre className="rounded-md bg-muted p-4 text-xs">
                        {JSON.stringify(log, null, 2)}
                    </pre>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
