"use client"
import { ArrowUpDown, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { Trash, EditIcon } from "lucide-react";

export const columns = [
  {
    accessorKey: "code",
    header: "Station ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "fullAddress",
    header: "Address",
  },
// {
//   accessorKey: "operatingHours.friday",
//   header: "Schedule",
//   cell: ({ row }) => {
//     const friday = row.getValue("operatingHours.monday");

//     if (!friday || typeof friday !== "object") return "No schedule";

//     const { open, close, is24Hours } = friday;

//     if (is24Hours) {
//       return <span>24 Hours</span>;
//     }

//     return (
//       <span>
//         {open && close ? `${open} - ${close}` : "No schedule"}
//       </span>
//     );
//   },
// },
//   {
//     accessorKey: "analytics.averageWaitTime",
//     header: "Wait-time",
//   },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status")

      // Default variant and color
      let variant = "secondary"
      let statusColor = "bg-blue-500 text-white"

      if (status === "active") {
        variant = "success"
        statusColor = "bg-green-100 text-green-800"
      } else if (status === "inactive") {
        variant = "destructive"
        statusColor = "bg-orange-100 text-orange-800"
      } else if (status === "maintenance") {
        variant = "warning"
        statusColor = "bg-yellow-100 text-yellow-800"
      } else if (status === "breakdown") {
        variant = "destructive"
        statusColor = "bg-red-100 text-red-800"
      }

      return <Badge className={statusColor} variant={variant}>{status}</Badge>
    },

  }
];
