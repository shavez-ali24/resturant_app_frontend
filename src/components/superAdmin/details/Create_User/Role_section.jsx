import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Crown, Shield, UserCheck } from "lucide-react"

export function RoleSection({ form, compact = false }) {
  const sectionClassName = compact
    ? "space-y-4 rounded-lg border border-orange-100 bg-white p-3 sm:p-4"
    : "space-y-6 rounded-xl border border-orange-100 bg-white p-4 sm:p-5";
  const headingClassName = compact
    ? "text-base font-semibold text-orange-800"
    : "text-lg font-semibold text-orange-800";
  const descriptionClassName = compact ? "text-xs text-gray-500" : "text-gray-500";

  return (
    <div className={sectionClassName}>
      <h3 className={headingClassName}>Account Type</h3>
      
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Role *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-200">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-xl border border-orange-200 bg-white p-1 shadow-xl">
                <SelectItem value="admin" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    <span>Admin (with Restaurant)</span>
                  </div>
                </SelectItem>
                <SelectItem value="staff" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span>Staff</span>
                  </div>
                </SelectItem>
                <SelectItem value="superadmin" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Superadmin</span>
                  </div>
                </SelectItem>
                <SelectItem value="user" className="cursor-pointer rounded-lg data-[highlighted]:bg-orange-200 data-[highlighted]:text-orange-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>User</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className={descriptionClassName}>
              {form.watch("role") === "admin" && "Admin can create and manage restaurants"}
              {form.watch("role") === "staff" && "Staff members work under an admin's restaurant"}
              {form.watch("role") === "superadmin" && "Superadmin has full system access"}
              {form.watch("role") === "user" && "Regular user account"}
              {!form.watch("role") && "Select a role to see description"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
