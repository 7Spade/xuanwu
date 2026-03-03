
'use client'

import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/shared/app-providers/auth-provider'
import type { Account } from '@/shared/types'

import {
  updateUserProfile as updateUserProfileAction,
  uploadUserAvatar,
} from '../_actions'
import {
  getUserProfile as getUserProfileQuery,
  subscribeToUserProfile,
} from '../_queries'

/**
 * @fileoverview A hook for managing the current user's profile data.
 * This hook acts as the designated bridge between UI components and the
 * underlying infrastructure for user profile management.
 */
export function useUser() {
  const { state: authState } = useAuth()
  const { user } = authState

  const [profile, setProfile] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Set up a real-time listener for the user's profile document.
    const unsub = subscribeToUserProfile(user.id, (data) => {
      if (data) {
        setProfile(data)
      } else {
        // If profile doesn't exist, create a default one.
        getUserProfileQuery(user.id).then(setProfile)
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsub()
  }, [user])

  const updateProfile = useCallback(
    async (data: Partial<Omit<Account, 'id'>>) => {
      if (!user) throw new Error('User not authenticated.')
      const result = await updateUserProfileAction(user.id, data)
      if (!result.success) throw new Error(result.error.message)
    },
    [user]
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) throw new Error('User not authenticated.')
      const photoURL = await uploadUserAvatar(user.id, file)
      await updateProfile({ photoURL })
      return photoURL
    },
    [user, updateProfile]
  )

  return { profile, loading, updateProfile, uploadAvatar }
}
