/**
 * Module: wiki/page
 * Purpose: VS8 wiki landing route.
 * Responsibilities: Render semantic governance status, dictionary, routing gates, and active proposals.
 * Constraints: Keep page read-only; mutation flows must go through command gateways.
 */

import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/shadcn-ui/badge";
import { Button } from "@/shadcn-ui/button";
import { Input } from "@/shadcn-ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn-ui/table";

type ConsensusRule = {
  pattern: string;
  status: "已部署" | "審核中";
  contributor: string;
};

type RoutingDecision = {
  tagSlug: string;
  decision: string;
};

const WIKI_TABS = [
  {
    href: "/wiki/semantic-governance/editor",
    title: "語義字典 (Dictionary)",
    icon: "📜",
  },
  {
    href: "/wiki/semantic-governance/proposal-stream",
    title: "共識提案 (Proposals)",
    icon: "🗳️",
  },
  {
    href: "/wiki/semantic-governance/sandbox",
    title: "語義沙盒 (Sandbox)",
    icon: "🧪",
  },
  {
    href: "/wiki/semantic-governance/relationship-visualizer",
    title: "關係視覺化 (Visualizer)",
    icon: "🕸️",
  },
] as const;

const TRANSPORTATION_RULES: readonly ConsensusRule[] = [
  {
    pattern: "/^Uber(\\s.*)?/i",
    status: "已部署",
    contributor: "@Node_7Spade",
  },
  {
    pattern: "/.*(高鐵|台鐵|火車).*/",
    status: "已部署",
    contributor: "@Community_A",
  },
  {
    pattern: '"Taxi"',
    status: "已部署",
    contributor: "@User_X",
  },
];

const ROUTING_DECISIONS: readonly RoutingDecision[] = [
  {
    tagSlug: "accommodation",
    decision: "治理決議: 物化為 Task (D27-Gate)",
  },
  {
    tagSlug: "food",
    decision: "治理決議: 靜默標記 [#A14]",
  },
  {
    tagSlug: "personal-leisure",
    decision: "治理決議: 跳過不物化",
  },
];

export default function WikiLandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
      <header className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/35 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div>
              <p className="text-[15px] font-semibold tracking-tight sm:text-base">VS8 Semantic Wiki</p>
              <p className="text-xs text-muted-foreground">全球語義共識網路</p>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="搜尋標籤或規則"
              placeholder="搜尋標籤或規則"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-2.5 px-4 py-3 sm:grid-cols-3 sm:px-5">
          <article className="rounded-md border bg-background/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">節點共識度</p>
            <p className="mt-1 text-base font-semibold">99.4%</p>
          </article>
          <article className="rounded-md border bg-background/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">本地規則版本</p>
            <p className="mt-1 text-base font-semibold">v2.3.1</p>
          </article>
          <article className="rounded-md border bg-background/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">待決提案</p>
            <p className="mt-1 text-base font-semibold">12</p>
          </article>
        </div>
      </header>

      <nav className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4" aria-label="語義治理區塊">
        {WIKI_TABS.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border bg-card px-3.5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-accent"
          >
            <span aria-hidden>{route.icon}</span>
            <span>{route.title}</span>
          </Link>
        ))}
      </nav>

      <section className="space-y-6">
        <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">當前共識規則: Layer-2 Classify</h2>
            <p className="text-sm text-muted-foreground">
              說明: 定義全局輸入如何轉化為 Tag。遵循 <code>[D27]</code> 純函式守則。
            </p>
          </header>

          <div className="mt-4 overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <p className="text-sm font-semibold">標籤群組: ✈️ 交通 (Transportation)</p>
              <Badge variant="secondary">使用者共識度: ★★★★★</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>匹配規則 (RegEx/String)</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>來源貢獻者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSPORTATION_RULES.map((rule) => (
                  <TableRow key={rule.pattern}>
                    <TableCell>
                      <code className="text-xs sm:text-sm">{rule.pattern}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rule.contributor}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t bg-muted/20 px-4 py-3">
              <Button variant="outline" size="sm" type="button">
                + 提交新匹配規則提案
              </Button>
            </div>
          </div>
        </article>

        <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">物化閘門狀態: Layer-3 Routing</h2>
          </header>

          <div className="mt-4 space-y-3 rounded-lg border p-4">
            {ROUTING_DECISIONS.map((item) => (
              <div
                key={item.tagSlug}
                className="flex flex-col justify-between gap-2 border-b pb-3 text-sm last:border-none last:pb-0 sm:flex-row sm:items-center"
              >
                <p>
                  TagSlug: <code>{item.tagSlug}</code>
                </p>
                <p className="text-muted-foreground">{item.decision}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">⚖️ 待決共識提案 (Active Proposals)</h2>
          </header>

          <div className="mt-4 rounded-lg border p-4">
            <p className="text-base font-semibold">
              [提案 #104] 將 &ldquo;電動車充電&rdquo; 歸類至 <code>transportation</code> 而非 <code>utility</code>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              提案人: @GreenEnergy | 贊成: 85% | 反對: 5% | 剩餘時間: 14h
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm">
                👍 贊成
              </Button>
              <Button type="button" size="sm" variant="outline">
                👎 反對
              </Button>
              <Button type="button" size="sm" variant="secondary">
                💬 辯論 (12)
              </Button>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
