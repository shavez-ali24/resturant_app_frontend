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
      <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                {/* Full clickable trigger with soft gray colors */}
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded transition-all duration-200
                      ${isActive
                        ? "bg-gray-200 text-gray-800" // active dull gray
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900" // normal hover
                      }
                      group
                    `}
                  >
                    <item.icon
                      className={`mr-3 w-4 h-4 transition-colors duration-200
                        ${isActive ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700"}
                      `}
                    />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.items?.length && (
                      <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                                className={`block px-3 py-1 text-sm rounded transition-colors duration-200
                                  ${isSubActive
                                    ? "bg-gra" // active dull gray
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800" // hover soft gray
                                  }`}
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
