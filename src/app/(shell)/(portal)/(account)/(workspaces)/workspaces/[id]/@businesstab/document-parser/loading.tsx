import { Skeleton } from "@/shadcn-ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-7 w-2/5" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
