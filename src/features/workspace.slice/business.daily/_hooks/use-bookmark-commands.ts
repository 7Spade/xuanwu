/**
 * @fileoverview use-bookmark-actions.ts - Hook for managing a user's personal bookmarks.
 * @description This hook provides logic for fetching, adding, and removing bookmarks,
 * which are stored in a dedicated subcollection for each user. It's self-contained
 * and loads its own data.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/shared/app-providers/auth-provider';
import { toast } from '@/shared/utility-hooks/use-toast';

import { toggleBookmark as toggleBookmarkAction } from '../_bookmark-actions';
import { subscribeToBookmarks } from '../_queries';


export function useBookmarkActions() {
    const { state: authState } = useAuth();
    const { user } = authState;
    
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setBookmarks(new Set());
            return;
        };

        setLoading(true);
        const unsubscribe = subscribeToBookmarks(
            user.id,
            (bookmarkedIds) => {
                setBookmarks(bookmarkedIds);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching bookmarks:", error);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [user]);

    const toggleBookmark = useCallback(async (logId: string, shouldBookmark: boolean) => {
        if (!user) return;
        try {
            await toggleBookmarkAction(user.id, logId, shouldBookmark);
        } catch (error) {
            console.error("Failed to toggle bookmark:", error);
            toast({ variant: 'destructive', title: 'Failed to update bookmark' });
            // Re-throw to allow the UI to revert its state
            throw error;
        }
    }, [user]);

    return { bookmarks, loading, toggleBookmark };
}
