/**
 * Module: landing/page
 * Purpose: Public landing entry page for unauthenticated users.
 * Responsibilities: Redirect authenticated users and provide login entry action.
 * Constraints: deterministic logic, respect module boundaries
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app-runtime/providers/auth-provider";
import { useI18n } from "@/app-runtime/providers/i18n-provider";
import { signIn } from "@/features/identity.slice/_actions";
import { LoginForm, ResetPasswordForm } from "@/features/identity.slice";
import { Button } from "@/shadcn-ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shadcn-ui/dialog";
import { toast } from "@/shadcn-ui/hooks/use-toast";

export default function LandingPage() {
	const { state } = useAuth();
	const router = useRouter();
	const { t } = useI18n();
	const [isLoginOpen, setIsLoginOpen] = useState(false);
	const [isResetOpen, setIsResetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (state.user) {
			router.push("/dashboard");
		}
	}, [state.user, router]);

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

			setIsLoginOpen(false);
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
		setIsLoginOpen(false);
		setIsResetOpen(true);
	};

	return (
		<div className="relative flex min-h-screen w-full items-center justify-center bg-background">
			<div className="absolute right-4 top-4">
				<Button
					aria-label="Login"
					variant="outline"
					onClick={() => setIsLoginOpen(true)}
				>
					Login
				</Button>
			</div>

			<div
				aria-label={t("common.enterOrgVerse")}
				className="text-7xl"
			>
				{t("common.enterOrgVerse")}
			</div>

			<Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
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
	);
}
