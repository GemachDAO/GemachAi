import { ComponentProps } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { SidebarLeftIcon } from './icons';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="md:px-2 md:h-fit" onClick={toggleSidebar}>
            <SidebarLeftIcon size={16} />
          </div>

        </TooltipTrigger>
        <TooltipContent>
          <p>Toggle Sidebar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
