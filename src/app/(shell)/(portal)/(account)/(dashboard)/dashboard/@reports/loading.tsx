import { Skeleton } from "@/shadcn-ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <Skeleton className="h-7 w-48 rounded-lg" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
