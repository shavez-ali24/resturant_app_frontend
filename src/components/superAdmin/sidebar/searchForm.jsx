import { Search } from "lucide-react"

import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"

export function SearchForm({
  ...props
}) {
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Type to search..."
          className="h-8 border-orange-200 bg-white/90 pl-7 text-orange-900 placeholder:text-orange-400 focus-visible:ring-orange-300"
        />
        <Search
          className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none text-orange-500/80" />
      </div>
    </form>
  );
}
