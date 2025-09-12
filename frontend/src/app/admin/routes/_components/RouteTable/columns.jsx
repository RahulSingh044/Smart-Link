"use client"
import { ArrowUpDown, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { Trash, EditIcon } from "lucide-react";

export const columns = [
  {
    accessorKey: "code",
    header: "Route ID",
  },
  {
    accessorKey: "name",
    header: "Route Name",
  },
  {
    accessorKey: "startStation.stationName",
    header: "Start From",
  },
  {
    accessorKey: "endStation.stationName",
    header: "Destination",
  },
  {
    accessorKey: "timing.firstTrip",
    header: "First Trip",
  },
  {
    accessorKey: "timing.lastTrip",
    header: "Last Trip",
  },
  {
    accessorKey: "timing.frequency",
    header: "Frequency",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status")

      // Default variant and color
      let variant = "secondary"
      let statusColor = "bg-blue-500 text-white"

      if (status === "active") {
        variant = "success"
        statusColor = "bg-green-100 text-green-800"
      } else if (status === "Inactive") {
        variant = "destructive"
        statusColor = "bg-red-100 text-red-800"
      } else if (status === "Under Maintenance") {
        variant = "warning"
        statusColor = "bg-yellow-100 text-yellow-800"
      }

      return <Badge className={statusColor} variant={variant}>{status}</Badge>
    },
  },
];
