
"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { type ScheduleItem } from "@/shared/types"
import { Badge } from "@/shared/shadcn-ui/badge"
import { CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/shared/shadcn-ui/button"

export type DecisionHistoryItem = Pick<ScheduleItem, 'id' | 'title' | 'workspaceName' | 'status' | 'updatedAt'>

export const decisionHistoryColumns: ColumnDef<DecisionHistoryItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          提案名稱
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "workspaceName",
    header: "工作空間",
  },
  {
    accessorKey: "status",
    header: "決策結果",
    cell: ({ row }) => {
      const status = row.original.status
      if (status === "OFFICIAL") {
        return <Badge variant="secondary" className="border-green-500/20 bg-green-500/10 text-green-700"><CheckCircle className="mr-1 size-3"/>已核准</Badge>
      }
      if (status === "REJECTED") {
         return <Badge variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-700"><XCircle className="mr-1 size-3"/>已拒絕</Badge>
      }
      return <Badge variant="outline">{status}</Badge>
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            處理時間
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
        const date = row.original.updatedAt?.toDate ? row.original.updatedAt.toDate() : null
        return date ? format(date, "MMM d, yyyy") : "N/A"
    }
  },
]
