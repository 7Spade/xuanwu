// [職責] Wave 3 — Auth login page view (client island)
// Extracted from app/(auth)/login/page.tsx to follow the features/ view pattern.
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { useI18n } from "@/app-runtime/providers/i18n-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn-ui/dialog"
import { toast } from "@/shadcn-ui/hooks/use-toast"

import { completeRegistration , signIn, signInAnonymously } from "../_actions"


import { AuthBackground } from "./auth-background"
import { AuthTabsRoot } from "./auth-tabs-root"
import { ResetPasswordForm } from "./reset-password-form"

/**
 * LoginView — The "smart" auth container.
 * Manages all auth state and delegates rendering to _components/.
 * Reset password is handled by @modal/(.)reset-password intercepting route.
 * app/(auth)/login/page.tsx is now a thin RSC wrapper that renders this.
 */
export function LoginView() {
  const router = useRouter()
  const { t } = useI18n()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isResetOpen, setIsResetOpen] = useState(false)

  const handleAuth = async (type: "login" | "register") => {
    setIsLoading(true)
    try {
      if (type === "login") {
        const result = await signIn(email, password)
        if (!result.success) {
          toast({ variant: "destructive", title: t("auth.authenticationFailed"), description: result.error.message })
          return
        }
      } else {
        if (!name) throw new Error(t("auth.pleaseSetDisplayName"))
        const result = await completeRegistration(email, password, name)
        if (!result.success) {
          toast({ variant: "destructive", title: t("auth.authenticationFailed"), description: result.error.message })
          return
        }
      }
      toast({ title: t("auth.identityResonanceSuccessful") })
      router.push("/dashboard")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred."
      toast({ variant: "destructive", title: t("auth.authenticationFailed"), description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymous = async () => {
    setIsLoading(true)
    try {
      const result = await signInAnonymously()
      if (!result.success) {
        toast({ variant: "destructive", title: t("auth.authenticationFailed"), description: result.error.message })
        return
      }
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <AuthBackground />
      <AuthTabsRoot
        isLoading={isLoading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        handleAuth={handleAuth}
        handleAnonymous={handleAnonymous}
        openResetDialog={() => setIsResetOpen(true)}
      />

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] border-border/40 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-wide">
              {t("auth.resetPassword")}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <ResetPasswordForm
              defaultEmail={email}
              onSuccess={() => setIsResetOpen(false)}
              onCancel={() => setIsResetOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
