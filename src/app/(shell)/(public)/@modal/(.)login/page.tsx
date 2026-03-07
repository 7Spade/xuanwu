/**
 * Module: modal-login/page
 * Purpose: Intercept `/login` as a modal when navigating from public routes.
 * Responsibilities: Render login form in dialog and preserve direct `/login` full-page behavior.
 * Constraints: deterministic logic, respect module boundaries
 */
"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/app-runtime/providers/i18n-provider";
import { signIn } from "@/features/identity.slice/_actions";
import { LoginForm } from "@/features/identity.slice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn-ui/dialog";
import { toast } from "@/shadcn-ui/hooks/use-toast";

function LoginModalContent() {
  const router = useRouter();
  const { t } = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: t("auth.authenticationFailed"),
          description: result.error.message,
        });
        return;
      }

      toast({ title: t("auth.identityResonanceSuccessful") });
      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: t("auth.authenticationFailed"),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openResetDialog = () => {
    router.push(`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  };

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="max-w-md rounded-[2rem] border-border/40 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-wide">
            {t("auth.login")}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleLogin={handleLogin}
            isLoading={isLoading}
            onForgotPassword={openResetDialog}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LoginModalPage() {
  return (
    <Suspense>
      <LoginModalContent />
    </Suspense>
  );
}
