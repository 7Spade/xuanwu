/**
 * @fileoverview like-button.tsx - A self-contained component for the "like" action.
 * @description This component encapsulates all UI and logic for liking a daily log.
 * It uses optimistic UI updates for a fast, responsive user experience and ensures
 * state is synced with the backend to prevent inconsistencies.
 */
"use client";

import { Heart } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';

import type { Account } from "@/shared-kernel";
import { Button } from "@/shadcn-ui/button";
import { cn } from "@/shadcn-ui/utils/utils";

import { useDailyActions } from '@/features/workspace.slice/business.daily/_hooks/use-daily-commands';
import { type DailyLog } from "@/features/workspace.slice/business.daily/_types";



interface LikeButtonProps {
  log: DailyLog;
  currentUser: Account | null;
}

export function LikeButton({ log, currentUser }: LikeButtonProps) {
  const { toggleLike } = useDailyActions();

  // Internal state for optimistic UI and to be synced with props
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Effect to synchronize component state with prop changes from Firestore
  useEffect(() => {
    setIsLiked(currentUser ? log.likes?.includes(currentUser.id) ?? false : false);
    setLikeCount(log.likeCount || 0);
  }, [log, currentUser]);

  const handleToggleLike = useCallback(() => {
    if (!currentUser) return;

    // Optimistic UI Update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    // Backend call
    toggleLike(log.id).catch(() => {
      // Revert on error by re-syncing with the original prop state
      setIsLiked(currentUser ? log.likes?.includes(currentUser.id) ?? false : false);
      setLikeCount(log.likeCount || 0);
    });
  }, [isLiked, likeCount, toggleLike, log, currentUser]);

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-9" onClick={handleToggleLike}>
        <Heart
          className={cn(
            "w-5 h-5 transition-all",
            isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground"
          )}
        />
      </Button>
      {likeCount > 0 && (
         <span className="pr-2 text-xs font-bold text-muted-foreground">{likeCount}</span>
      )}
    </div>
  );
}
