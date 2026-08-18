"use client";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useNotification } from "@/components/admin/Bell/NotificationContext";
import { useSelector } from "react-redux";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function NavMain({ items, isDarkMode = false }) {
  const location = useLocation();
  const { hasUnreadSidebarNotification } = useNotification() || {};
  const hasNewItems = location.pathname !== "/admin/orders" && hasUnreadSidebarNotification;
  const colors = useSelector((state) => state.admin.theme.colors) || { primary: "#f97316" };

  const { open, isMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-[#a8a29e]"
        }`}>
        ADMIN
      </SidebarGroupLabel>
      <SidebarMenu className="mt-2">
        {items.map((item) => {
          const isActive = item.items
            ? item.items.some((sub) => sub.url === location.pathname)
            : item.url === location.pathname;
          const isDirectActive = item.url === location.pathname;

          // Collapsed Sidebar state
          if (!open && !isMobile) {
            if (item.items && item.items.length > 0) {
              // Item has sub-items: render flyout dropdown menu on click
              return (
                <DropdownMenu key={item.title}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuItem className="rounded-md relative group/menu-item">
                      <button
                        type="button"
                        className={`
                          flex items-center w-full justify-center px-2 py-2 text-[13px] transition-all duration-150 group outline-none focus:outline-none focus:ring-0
                          ${isActive
                            ? "font-bold"
                            : isDarkMode
                              ? "text-slate-400 hover:!bg-slate-800/40 hover:!text-slate-100"
                              : "text-[#57524e] hover:!bg-[#fbfaf8] hover:!text-[#1c1917]"
                          }
                        `}
                        style={{
                          borderLeft: '4px solid transparent',
                          color: isActive
                            ? (isDarkMode ? colors.primary : colors.primary)
                            : undefined,
                          backgroundColor: 'transparent'
                        }}
                      >
                        <div className="relative flex shrink-0">
                          <item.icon
                            className={`
                              w-4 h-4 transition-colors duration-150
                              ${!isActive
                                ? (isDarkMode ? "text-slate-500 group-hover:text-slate-300" : "text-[#87807b] group-hover:text-[#1c1917]")
                                : ""
                              }
                            `}
                            style={{
                              color: isActive
                                ? (isDarkMode ? colors.primary : colors.primary)
                                : undefined
                            }}
                          />
                          {item.title === "Orders" && hasNewItems && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    </SidebarMenuItem>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className={`
                      w-48 rounded-xl border p-1.5 shadow-xl z-[9999]
                      ${isDarkMode
                        ? "bg-[#0f172a] border-slate-700/80 text-slate-100"
                        : "bg-white border-[#ede8e3] text-gray-900"
                      }
                    `}
                  >
                    {/* Header: Group Title */}
                    <div className={`px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider border-b mb-1 ${isDarkMode ? "text-slate-500 border-slate-750" : "text-gray-400 border-gray-100"
                      }`}>
                      {item.title}
                    </div>

                    {/* Sub-items */}
                    <div className="flex flex-col gap-0.5">
                      {item.items.map((subItem) => {
                        const isSubActive = subItem.url === location.pathname;
                        return (
                          <DropdownMenuItem key={subItem.title} asChild>
                            <Link
                              to={subItem.url}
                              target={subItem.target || undefined}
                              rel={subItem.target === "_blank" ? "noreferrer" : undefined}
                              className={`
                                flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-lg transition-all duration-150 outline-none focus:outline-none focus:ring-0 !cursor-pointer
                                ${isSubActive
                                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold"
                                  : isDarkMode
                                    ? "text-slate-450 hover:bg-slate-800 hover:text-slate-100"
                                    : "text-gray-650 hover:bg-slate-50 hover:text-gray-900"
                                }
                              `}
                            >
                              <span>{subItem.title}</span>
                              {subItem.title === "Live Orders" && hasNewItems && (
                                <span className="inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider animate-pulse">
                                  NEW
                                </span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            } else {
              // Item has no sub-items: normal Link with tooltip on hover
              return (
                <SidebarMenuItem key={item.title} className="rounded-md relative group/menu-item">
                  <Link
                    to={item.url}
                    className={`
                      flex items-center w-full justify-center px-2 py-2 text-[13px] transition-all duration-150 group outline-none focus:outline-none focus:ring-0
                      ${isDirectActive
                        ? "font-bold"
                        : isDarkMode
                          ? "text-slate-400 hover:!bg-slate-800/40 hover:!text-slate-100"
                          : "text-[#57524e] hover:!bg-[#fbfaf8] hover:!text-[#1c1917]"
                      }
                    `}
                    style={{
                      borderLeft: '4px solid transparent',
                      color: isDirectActive
                        ? (isDarkMode ? colors.primary : colors.primary)
                        : undefined,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div className="relative flex shrink-0">
                      <item.icon
                        className={`
                          w-4 h-4 transition-colors duration-150
                          ${!isDirectActive
                            ? (isDarkMode ? "text-slate-500 group-hover:text-slate-300" : "text-[#87807b] group-hover:text-[#1c1917]")
                            : ""
                          }
                        `}
                        style={{
                          color: isDirectActive
                            ? (isDarkMode ? colors.primary : colors.primary)
                            : undefined
                        }}
                      />
                    </div>
                  </Link>

                  {/* Tooltip for collapsed state */}
                  <div
                    className={`
                      absolute left-full top-1/2 -translate-y-1/2 ml-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-wider shadow-md hidden z-50 whitespace-nowrap
                      group-hover/menu-item:group-data-[collapsible=icon]:block
                      ${isDarkMode
                        ? "bg-[#0f172a] border-slate-700/80 text-slate-205"
                        : "bg-white border-[#ede8e3] text-gray-700"
                      }
                    `}
                  >
                    {item.title}
                  </div>
                </SidebarMenuItem>
              );
            }
          }

          // Expanded Sidebar state
          return (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
              <SidebarMenuItem className="rounded-md">

                {/* Trigger Button */}
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={`
                      flex items-center w-full text-left py-2 text-[13px] transition-all duration-150 group
                      group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2
                      ${isDirectActive
                        ? "font-bold"
                        : isDarkMode
                          ? "text-slate-400 hover:!bg-slate-800/40 hover:!text-slate-100"
                          : "text-[#57524e] hover:!bg-[#fbfaf8] hover:!text-[#1c1917]"
                      }
                    `}
                    style={{
                      borderLeft: isDirectActive
                        ? `4px solid ${colors.primary}`
                        : '4px solid transparent',
                      paddingLeft: isDirectActive ? '10px' : '14px',
                      color: isDirectActive
                        ? (isDarkMode ? colors.primary : colors.primary)
                        : undefined,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div className="relative mr-2.5 flex shrink-0 group-data-[collapsible=icon]:mr-0">
                      <item.icon
                        className={`
                          w-4 h-4 transition-colors duration-150
                          ${!isDirectActive
                            ? (isDarkMode ? "text-slate-500 group-hover:text-slate-300" : "text-[#87807b] group-hover:text-[#1c1917]")
                            : ""
                          }
                        `}
                        style={{
                          color: isDirectActive
                            ? (isDarkMode ? colors.primary : colors.primary)
                            : undefined
                        }}
                      />
                      {item.title === "Orders" && hasNewItems && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>

                    <span className="flex-1 truncate font-semibold group-data-[collapsible=icon]:hidden">{item.title}</span>

                    {item.items?.length && (
                      <ChevronRight
                        className={`
                          w-3.5 h-3.5 transition-transform duration-150 group-data-[collapsible=icon]:hidden
                          ${isActive
                            ? "rotate-90"
                            : isDarkMode ? "text-slate-500 group-data-[state=open]:rotate-90" : "text-[#87807b] group-data-[state=open]:rotate-90"
                          }
                        `}
                        style={{
                          color: isDirectActive
                            ? (isDarkMode ? colors.primary : colors.primary)
                            : undefined
                        }}
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
                                flex items-center justify-between py-1.5 text-xs font-semibold transition-colors duration-150
                                ${isSubActive
                                  ? "font-extrabold"
                                  : isDarkMode
                                    ? "text-slate-400 hover:!bg-slate-800/40 hover:!text-slate-100"
                                    : "text-[#57524e] hover:!bg-[#fbfaf8] hover:!text-[#1c1917]"
                                }
                              `}
                              style={{
                                backgroundColor: 'transparent',
                                color: isSubActive
                                  ? (isDarkMode ? colors.primary : colors.primary)
                                  : undefined,
                                borderLeft: isSubActive
                                  ? `3px solid ${colors.primary}`
                                  : '3px solid transparent',
                                paddingLeft: isSubActive ? '10px' : '14px',
                                borderTopLeftRadius: '0px',
                                borderBottomLeftRadius: '0px',
                              }}
                            >
                              <span>{subItem.title}</span>
                              {subItem.title === "Live Orders" && hasNewItems && (
                                <span className="inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider animate-pulse">
                                  NEW
                                </span>
                              )}
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
