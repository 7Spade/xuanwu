// [職責] Canonical full-page reset-password — shown on direct URL access to /reset-password
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { useI18n } from "@/config/i18n/i18n-provider"
import { ResetPasswordForm } from "@/features/identity.slice"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl">🐢</div>
          <h1 className="font-headline text-2xl font-bold">{t("auth.resetPassword")}</h1>
        </div>
        <ResetPasswordForm
          defaultEmail={searchParams.get("email") ?? ""}
          onSuccess={() => router.push("/login")}
          onCancel={() => router.push("/login")}
        />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
