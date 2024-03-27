"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import EditProfile from "@/components/modals/edit-profile";
import { useModalStore } from "@/store/modals";

export default function Profile() {
  const { onOpen } = useModalStore();

  // TODO: finish profilelol
  return (
    <div className="h-full w-full">
      <div className="w-full h-44 bg-gray-200">Image</div>

      <div className="h-full mx-20 flex gap-10">
        <div className="relative -top-20">
          <div className="absolute aspect-square w-44 h-auto bg-gray-400">
            Image here
          </div>

          <div className="mt-44">some general shot here</div>
        </div>

        <div className="flex-1 flex flex-col items-end">
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableBody>
              <TableRow>
                <TableCell>First name</TableCell>
                <TableCell className="">Sperry John</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Last name</TableCell>
                <TableCell className="">Johnson</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Phone number</TableCell>
                <TableCell className="">096969696969</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell className="">sperryjohn@gmail.com</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sex</TableCell>
                <TableCell className="">Male</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Address</TableCell>
                <TableCell className="">Talamban</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell className="">253434</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Employee of</TableCell>
                <TableCell className="">UnionBank</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Button onClick={() => onOpen("editProfile")}>Edit Profile</Button>
        </div>
      </div>
    </div>
  );
}
