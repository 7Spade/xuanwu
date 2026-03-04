'use client';

/**
 * notification-hub.slice — _components/NotificationBell.tsx
 *
 * GitHub-style notification center:
 *   • Bell button with animated unread-count badge (red dot)
 *   • Popover anchored to the top-right corner
 *   • Category filter tabs: 全部 / 系統 / 任務 / 權限
 *   • Scrollable notification list with VS8 semantic cues
 *   • Mark-all-as-read and per-item mark-as-read (optimistic UI)
 *
 * Architecture:
 *   [D3]   No direct SDK calls — subscription managed via useUserNotifications
 *          which delegates to createNotificationListener service.
 *   [D15]  Optimistic UI: local state is updated immediately; Firestore syncs
 *          asynchronously (EVENTUAL consistency).
 *   [D19]  Uses HubNotification from _contract.ts.
 *   [D21-D23] semanticType drives the unread-dot color (red = ACTION_REQUIRED).
 */

import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/shared/shadcn-ui/badge';
import { Button } from '@/shared/shadcn-ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/shadcn-ui/popover';
import { ScrollArea } from '@/shared/shadcn-ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/shared/shadcn-ui/tabs';
import { cn } from '@/shared/shadcn-ui/utils/utils';

import type { HubNotification, NotificationCategory } from '../_contract';
import { useUserNotifications } from '../user.notification/_hooks/use-user-notifications';

type FilterTab = 'all' | NotificationCategory;

const TAB_LABELS: Record<FilterTab, string> = {
  all: '全部',
  system: '系統',
  task: '任務',
  permission: '權限',
};

const SEMANTIC_DOT_CLASS: Record<HubNotification['semanticType'], string> = {
  ACTION_REQUIRED: 'bg-red-500',
  INFO_ONLY: 'bg-primary',
};

interface NotificationBellProps {
  accountId: string | undefined;
}

export function NotificationBell({ accountId }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } =
    useUserNotifications(accountId);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered: HubNotification[] =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="通知中心"
        >
          <Bell className="size-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">通知中心</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3.5" />
              全部標記已讀
            </Button>
          )}
        </div>

        {/* ── Category tabs ───────────────────────────────────────── */}
        <div className="border-b px-4 py-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <TabsList className="h-8 w-full">
              {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="flex-1 text-xs">
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ── Notification list ───────────────────────────────────── */}
        <ScrollArea className="h-80">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
              暫無通知
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    aria-label={
                      notif.read
                        ? notif.title
                        : `${notif.title}（未讀，點擊標記已讀）`
                    }
                    aria-pressed={!notif.read}
                    className={cn(
                      'w-full flex flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      !notif.read && 'bg-primary/5'
                    )}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div className="flex items-start gap-2">
                      {/* Unread indicator — color encodes VS8 semantic type */}
                      {!notif.read && (
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            SEMANTIC_DOT_CLASS[notif.semanticType]
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            notif.read && 'text-muted-foreground'
                          )}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                        <time className="mt-0.5 block text-[10px] text-muted-foreground/60">
                          {new Date(notif.timestamp).toLocaleString('zh-TW')}
                        </time>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
