"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Notification } from "./page";

export const columns: ColumnDef<Notification>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
];
