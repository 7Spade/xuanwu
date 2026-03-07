/**
 * Module: landing/page
 * Purpose: Public landing entry page for unauthenticated users.
 * Responsibilities: Redirect authenticated users and provide login entry action.
 * Constraints: deterministic logic, respect module boundaries
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app-runtime/providers/auth-provider";
import { useI18n } from "@/app-runtime/providers/i18n-provider";
import { Button } from "@/shadcn-ui/button";

export default function LandingPage() {
	const { state } = useAuth();
	const router = useRouter();
	const { t } = useI18n();

	useEffect(() => {
		if (state.user) {
			router.push("/dashboard");
		}
	}, [state.user, router]);

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-background">
			<div className="absolute right-4 top-4">
				<Button
					aria-label="Login"
					variant="outline"
					onClick={() => router.push("/login")}
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
		</div>
	);
}
