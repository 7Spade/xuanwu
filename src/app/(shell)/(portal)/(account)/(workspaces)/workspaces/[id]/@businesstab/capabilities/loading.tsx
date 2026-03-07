import { Skeleton } from "@/shadcn-ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-7 w-2/5" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  )
}
