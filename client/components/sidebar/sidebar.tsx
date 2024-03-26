import React from "react";
import SidebarLink from "./sidebar-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  return (
    <nav className="bg-blue-700 h-full flex flex-col p-2 items-center gap-2">
      <Avatar className="w-3/4  h-auto aspect-square">
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-start w-full">
        {/* TODO: add icons */}

        <SidebarLink label="Dashboard" href="/" />
        <SidebarLink label="Documents Received" href="/documents" />
        <SidebarLink label="Applicants List" href="/applicants" />
        <SidebarLink label="Notifications" href="/notifications" />
        <SidebarLink label="View Profile" href="/profile" />
      </div>

      <Button className="mt-auto">Logout</Button>
    </nav>
  );
}
