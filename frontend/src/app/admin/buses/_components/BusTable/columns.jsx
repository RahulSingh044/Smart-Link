"use client"
import { ArrowUpDown, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { Trash, EditIcon } from "lucide-react";
import StatusDropDown from "../StatusDropDown";

// utils/formatDate.js
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  console.log(date.toLocaleDateString("en-US", options));
  return date.toLocaleDateString("en-US", options);
  // Output: "15 Aug 2025"
}



export const columns = [
  {
    accessorKey: "busNumber",
    header: "Bus ID",
  },
  {
    accessorKey: "vehicleInfo.make",
    header: "Model",
  },
  {
    accessorKey: "vehicleInfo.licensePlate",
    header: "License Plate",
  },
  {
    accessorKey: "vehicleInfo.capacity",
    header: "Capacity",
  },
  {
    accessorKey: "currentStatus",
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
      let status = row.getValue("currentStatus")

      // Default variant and color
      let variant = "secondary"
      let statusColor = "bg-blue-500 text-white"

      if (status === "inactive") {
        variant = "success"
        statusColor = "bg-green-100 text-green-800"
      } else if (status === "active") {
        variant = "destructive"
        statusColor = "bg-orange-100 text-orange-800"
      } else if (status === "maintenance") {
        variant = "warning"
        statusColor = "bg-yellow-100 text-yellow-800"
      } else if (status === "breakdown") {
        variant = "destructive"
        statusColor = "bg-red-100 text-red-800"
      }

      status="active"
      return <Badge className={statusColor} variant={variant}>{status}</Badge>
    },

  },
  {
    accessorKey: "vehicleInfo.year",
    header: "Year",
  },
  // {
  //   accessorKey: "routeId.name",
  //   header: "Assigned Routes",
  // },
  {
    accessorKey: "tracking.isOnline",
    header: "Online",
    cell: ({ row }) => {
      const online = row.getValue("tracking.isOnline");

      // Convert to boolean safely
      const value = online === true || online === "true";

      // Invert the value (false → true, true → false)
      const isOnline = !value;

      return (
        <Badge
          className={isOnline ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-800"}
          variant={isOnline ? "success" : "secondary"}
        >
          {isOnline ? "Online" : "Offline"}
        </Badge>
      );
    },
  },

  // {
  //   accessorKey: "actions",
  //   header: "Actions",
  //   cell: ({ row }) => {
  //     const busId = row.getValue("busNumber");
  //     const currentStatus = row.getValue("currentStatus");

  //     return (
  //       <div className="flex gap-2 items-center">
  //         {/* Update User */}
  //         <EditIcon
  //           size={20}
  //           className="cursor-pointer"
  //           onClick={() => handleUpdateUser(busId)}
  //         />

  //         {/* Change Status Dropdown */}
  //         <StatusDropDown
  //           busId={busId}
  //           initialStatus={currentStatus}
  //         // onStatusChange={handleStatusUpdate}
  //         />

  //         {/* Delete User */}
  //         <Trash
  //           size={20}
  //           className="text-red-600 hover:text-red-800 cursor-pointer"
  //           onClick={() => handleDeleteUser(busId)}
  //         />
  //       </div>
  //     );
  //   },
];
