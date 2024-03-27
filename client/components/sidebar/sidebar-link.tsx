import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkProps {
  Icon: LucideIcon;
  label: string;
  href?: string;
}

export default function SidebarLink({ Icon, label, href }: LinkProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className={cn(buttonVariants({ variant: "ghost" }), "flex gap-3")}
            href={href || label}
          >
            <Icon />
            {label}
          </Link>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
