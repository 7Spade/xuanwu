"use client";

import { User, Loader2, Upload } from "lucide-react";
import type React from "react"

import { type Account } from "@/features/shared-kernel"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";


interface ProfileCardProps {
  account: Account | null
  name: string
  setName: (name: string) => void
  bio: string
  setBio: (bio: string) => void
  handleSaveProfile: () => void
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isSaving: boolean
  isUploading: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
}

export function ProfileCard({
  account,
  name,
  setName,
  bio,
  setBio,
  handleSaveProfile,
  handleAvatarUpload,
  isSaving,
  isUploading,
  avatarInputRef,
}: ProfileCardProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <User className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Personal Identity</span>
        </div>
        <CardTitle className="font-headline">Profile</CardTitle>
        <CardDescription>Manage your public identity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="size-20 border-2 border-primary/20">
              <AvatarImage src={account?.photoURL} />
              <AvatarFallback className="bg-primary/5 text-2xl font-bold text-primary">
                {name?.[0]}
              </AvatarFallback>
            </Avatar>
            {isUploading && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
          <div className="space-y-2">
            <Button onClick={() => avatarInputRef.current?.click()} disabled={isUploading}>
              <Upload className="mr-2 size-4" /> Upload Image
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="user-name">Display Name</Label>
          <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your public display name" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="user-bio">Bio</Label>
          <Textarea id="user-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about yourself." className="min-h-[100px]" />
        </div>

      </CardContent>
      <CardFooter className="border-t bg-muted/20">
        <Button onClick={handleSaveProfile} disabled={isSaving || isUploading} className="ml-auto text-xs font-bold uppercase tracking-widest">
          {isSaving || isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isSaving || isUploading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
