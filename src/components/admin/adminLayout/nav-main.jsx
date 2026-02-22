"use client";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
        ADMIN
      </SidebarGroupLabel>
      <SidebarMenu className="mt-2">
        {items.map((item) => {
          const isActive = item.items
            ? item.items.some((sub) => sub.url === location.pathname)
            : item.url === location.pathname;

          return (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
  <SidebarMenuItem className="rounded-md">

    {/* Trigger Button */}
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className={`
          flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded transition-all duration-200 group 
          ${isActive
            ? "bg-gradient-to-r from-orange-200 to-orange-400 text-gray-900 shadow-sm " /* ACTIVE (stay this color) */
            : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-orange-200 hover:text-orange-900" /* NORMAL */
          }
        `}
      >
        <item.icon
          className={`
            mr-3 w-4 h-4 transition-colors duration-200 
            ${isActive ? "text-gray-900" : "text-gray-500 group-hover:text-orange-700"}
          `}
        />

        <span className="flex-1 truncate">{item.title}</span>

        {item.items?.length && (
          <ChevronRight
            className={`
              w-4 h-4 text-gray-500 transition-transform duration-200 
              ${isActive ? "rotate-90 text-gray-800" : "group-data-[state=open]:rotate-90"}
            `}
          />
        )}
      </button>
    </CollapsibleTrigger>

    {/* Submenu */}
    {item.items?.length && (
      <CollapsibleContent>
        <SidebarMenuSub className="pl-6 mt-1 space-y-1">
          {item.items.map((subItem) => {
            const isSubActive = subItem.url === location.pathname;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <Link
  to={subItem.url}
  className={`
    block px-3 py-1 text-sm rounded transition-colors duration-200
    ${isSubActive
      ? "bg-gradient-to-r from-orange-200 to-orange-400 text-gray-900 shadow-sm"
      : "text-gray-600 hover:bg-gradient-to-r hover:from-orange-100 hover:to-orange-200 hover:text-orange-900"
    }
  `}
>
  {subItem.title}
</Link>

                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    )}

  </SidebarMenuItem>
</Collapsible>

          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
