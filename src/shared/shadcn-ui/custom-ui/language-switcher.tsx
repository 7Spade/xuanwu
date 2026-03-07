"use client"

import { Globe } from "lucide-react"

import { useI18n } from "@/config/i18n/i18n-provider"
import { type Locale } from "@/config/i18n/i18n-types"
import { Button } from "@/shared/shadcn-ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/shadcn-ui/dropdown-menu"

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9">
          <Globe className="size-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          {LOCALE_NAMES["en"]}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("zh-TW")}
          className={locale === "zh-TW" ? "bg-accent" : ""}
        >
          {LOCALE_NAMES["zh-TW"]}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
