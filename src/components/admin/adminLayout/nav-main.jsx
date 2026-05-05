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

export function NavMain({ items, isDarkMode = false }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`text-[10px] font-semibold uppercase tracking-widest ${
        isDarkMode ? "text-slate-500" : "text-[#a8a29e]"
      }`}>
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
          flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group
          group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2
          ${isActive
            ? isDarkMode
              ? "!bg-orange-500/15 !text-orange-300 hover:!bg-orange-500/20 hover:!text-orange-300"
              : "!bg-orange-500 !text-white shadow-sm hover:!bg-orange-500 hover:!text-white"
            : isDarkMode
              ? "text-slate-400 hover:!bg-slate-800 hover:!text-slate-100"
              : "text-[#78716c] hover:!bg-[#f7f3ef] hover:!text-[#1c1917]"
          }
        `}
      >
        <item.icon
          className={`
            mr-3 w-4 h-4 transition-colors duration-150 group-data-[collapsible=icon]:mr-0
            ${isActive
              ? isDarkMode ? "!text-orange-300" : "!text-white"
              : isDarkMode ? "text-slate-500 group-hover:text-slate-300" : "text-[#a8a29e] group-hover:text-[#1c1917]"}
          `}
        />

        <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>

        {item.items?.length && (
          <ChevronRight
            className={`
              w-4 h-4 transition-transform duration-150 group-data-[collapsible=icon]:hidden
              ${isActive
                ? isDarkMode ? "rotate-90 !text-orange-300" : "rotate-90 !text-white"
                : isDarkMode ? "text-slate-500 group-data-[state=open]:rotate-90" : "text-[#a8a29e] group-data-[state=open]:rotate-90"}
            `}
          />
        )}
      </button>
    </CollapsibleTrigger>

    {/* Submenu */}
    {item.items?.length && (
      <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
        <SidebarMenuSub className="pl-6 mt-1 space-y-1">
          {item.items.map((subItem) => {
            const isSubActive = subItem.url === location.pathname;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                  <Link
                    to={subItem.url}
                    target={subItem.target || undefined}
                    rel={subItem.target === "_blank" ? "noreferrer" : undefined}
                    className={`
                      block px-3 py-1.5 text-sm rounded-lg transition-colors duration-150
                      ${isSubActive
                        ? isDarkMode
                          ? "!bg-orange-500/15 !text-orange-300 font-semibold hover:!bg-orange-500/20 hover:!text-orange-300"
                          : "!bg-orange-500 !text-white font-semibold hover:!bg-orange-500 hover:!text-white"
                        : isDarkMode
                          ? "text-slate-400 hover:!bg-slate-800 hover:!text-slate-100"
                          : "text-[#78716c] hover:!bg-[#f7f3ef] hover:!text-[#1c1917]"
                      }
                    `}
                  >
                    {subItem.title}
                  </Link>
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
