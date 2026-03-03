"use client";

import { User, Loader2, Upload } from "lucide-react";
import type React from "react"

import { SKILLS, SKILL_GROUPS, SKILL_SUB_CATEGORY_BY_KEY } from "@/shared/constants/skills"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn-ui/avatar";
import { Badge } from "@/shared/shadcn-ui/badge";
import { Button } from "@/shared/shadcn-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/shadcn-ui/card";
import { Checkbox } from "@/shared/shadcn-ui/checkbox";
import { Input } from "@/shared/shadcn-ui/input";
import { Label } from "@/shared/shadcn-ui/label";
import { Textarea } from "@/shared/shadcn-ui/textarea";
import { type SkillGrant, type Account } from "@/shared/types"


interface ProfileCardProps {
  account: Account | null
  name: string
  setName: (name: string) => void
  bio: string
  setBio: (bio: string) => void
  skillGrants: SkillGrant[]
  onSkillToggle: (slug: string) => void
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
  skillGrants,
  onSkillToggle,
  handleSaveProfile,
  handleAvatarUpload,
  isSaving,
  isUploading,
  avatarInputRef,
}: ProfileCardProps) {
  const grantedSlugs = new Set(skillGrants.map(g => g.tagSlug))
  const grantsBySlug = new Map(skillGrants.map(g => [g.tagSlug, g]))

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <User className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Personal Identity</span>
        </div>
        <CardTitle className="font-headline">Profile</CardTitle>
        <CardDescription>Manage your public identity and skill portfolio.</CardDescription>
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

        <div className="grid gap-2">
          <Label>Skills</Label>
          <p className="text-sm text-muted-foreground">Select your skills. These are used for schedule staffing matching.</p>
          <div className="space-y-6 pt-2">
            {SKILL_GROUPS.map(({ group, zhLabel, enLabel, subCategories }) => {
              const groupSkills = SKILLS.filter(s => s.group === group)
              if (!groupSkills.length) return null
              return (
                <div key={group}>
                  {/* 大項目 */}
                  <p className="mb-3 text-xs font-bold text-foreground">
                    {zhLabel}
                    <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">{enLabel}</span>
                  </p>
                  <div className="space-y-3 pl-2">
                    {subCategories.map(subCat => {
                      const subSkills = SKILLS.filter(s => s.group === group && s.subCategory === subCat)
                      if (!subSkills.length) return null
                      const subMeta = SKILL_SUB_CATEGORY_BY_KEY.get(subCat)
                      return (
                        <div key={subCat}>
                          {/* 子項目 */}
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {subMeta?.zhLabel ?? subCat}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {subSkills.map(skill => {
                              const granted = grantedSlugs.has(skill.slug)
                              return (
                                <div key={skill.slug} className="flex items-center gap-1.5">
                                  <Checkbox
                                    id={`skill-${skill.slug}`}
                                    checked={granted}
                                    onCheckedChange={() => onSkillToggle(skill.slug)}
                                  />
                                  <label
                                    htmlFor={`skill-${skill.slug}`}
                                    className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {skill.name}
                                  </label>
                                  {granted && (
                                    <Badge variant="outline" className="h-4 px-1 text-[9px] font-semibold">
                                      {grantsBySlug.get(skill.slug)?.tier ?? 'apprentice'}
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" defaultValue={account?.email} disabled />
          <p className="text-[10px] italic text-muted-foreground">Email address cannot be changed.</p>
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
