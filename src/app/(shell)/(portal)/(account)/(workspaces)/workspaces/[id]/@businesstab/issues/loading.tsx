import { Skeleton } from "@/shadcn-ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-2/5" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
