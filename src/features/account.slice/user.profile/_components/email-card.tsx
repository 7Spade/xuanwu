"use client";

import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";

import { authAdapter } from "@/shared/infra/auth/auth.adapter";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { toast } from "@/shared/shadcn-ui/hooks/use-toast";

interface EmailCardProps {
  currentEmail: string;
}

export function EmailCard({ currentEmail }: EmailCardProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim();

    if (!trimmed) return;

    if (trimmed === currentEmail) {
      toast({ variant: "destructive", title: "Same email address", description: "The new email must be different from the current one." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({ variant: "destructive", title: "Invalid email address", description: "Please enter a valid email address." });
      return;
    }

    const firebaseUser = authAdapter.getCurrentUser();
    if (!firebaseUser) {
      toast({ variant: "destructive", title: "Not authenticated", description: "You must be signed in to change your email address." });
      return;
    }

    setIsSending(true);
    try {
      await authAdapter.verifyBeforeUpdateEmail(firebaseUser, trimmed);
      toast({
        title: "Verification Email Sent",
        description: `A verification link has been sent to ${trimmed}. Click the link to confirm the change.`,
      });
      setNewEmail("");
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to send verification email",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Mail className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Account</span>
        </div>
        <CardTitle className="font-headline">Change Email Address</CardTitle>
        <CardDescription>
          Enter your new email address. A verification link will be sent to the new address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="current-email">Current Email</Label>
          <Input id="current-email" value={currentEmail} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-email">New Email Address</Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="your@newemail.com"
            disabled={isSending}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20">
        <Button
          onClick={handleChangeEmail}
          disabled={isSending || !newEmail.trim() || newEmail.trim() === currentEmail}
          className="ml-auto text-xs font-bold uppercase tracking-widest"
        >
          {isSending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isSending ? "Sending…" : "Send Verification Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}
