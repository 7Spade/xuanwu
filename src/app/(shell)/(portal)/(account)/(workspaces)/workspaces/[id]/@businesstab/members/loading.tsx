import { Skeleton } from "@/shadcn-ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-9 w-72" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  )
}
