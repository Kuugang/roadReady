import React from "react";
import SidebarLink from "./sidebar-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LayoutDashboard,
  LayoutList,
  Bell,
  SquareUserRoundIcon,
} from "lucide-react";

export default function Sidebar() {
  return (
    <nav className="bg-blue-700 h-full flex flex-col p-2 items-center gap-2">
      <div className="flex flex-col items-center gap-2 ">
        <Avatar className="w-1/2  h-auto aspect-square">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <h4 className="text-2xl font-bold">Sperry John</h4>
      </div>

      <div className="flex flex-col items-start">
        {/* TODO: add icons */}

        <SidebarLink Icon={LayoutDashboard} label="Dashboard" href="/" />
        <SidebarLink
          Icon={FileText}
          label="Documents Received"
          href="/documents"
        />
        <SidebarLink
          Icon={LayoutList}
          label="Applicants List"
          href="/applicants"
        />
        <SidebarLink Icon={Bell} label="Notifications" href="/notifications" />
        <SidebarLink
          Icon={SquareUserRoundIcon}
          label="View Profile"
          href="/profile"
        />
      </div>

      <Button className="mt-auto">Logout</Button>
    </nav>
  );
}
