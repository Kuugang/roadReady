import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Submission() {
  return (
    <div className="flex items-center justify-between w-full rounded-lg border px-2 py-2">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>

      <span>Yamaha Mandaue</span>

      <span>20 submissions</span>
    </div>
  );
}
