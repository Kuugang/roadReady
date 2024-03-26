import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface LinkProps {
  label: string;
  href?: string;
}

export default function SidebarLink({ label, href }: LinkProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={href || label}
          >
            {label}
          </Link>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
