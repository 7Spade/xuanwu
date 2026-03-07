"use client";

/**
 * Module: page.tsx
 * Purpose: Unified workforce-scheduling route — merges account schedule and timeline views.
 * Responsibilities: mount in-page tab switcher for Schedule and Timeline sections.
 * Constraints: no URL navigation between tabs; state is local to this page.
 */

import { useState } from "react";

import { AccountScheduleSection } from "@/features/workforce-scheduling.slice";
import { AccountTimelineSection } from "@/features/workforce-scheduling.slice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn-ui/tabs";

type WorkforceTab = "schedule" | "timeline";

export default function WorkforceSchedulingPage() {
  const [activeTab, setActiveTab] = useState<WorkforceTab>("schedule");

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as WorkforceTab)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <AccountScheduleSection />
        </TabsContent>
        <TabsContent value="timeline">
          <AccountTimelineSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
