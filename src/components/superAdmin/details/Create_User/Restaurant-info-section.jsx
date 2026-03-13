import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Building, Globe } from "lucide-react"

export function RestaurantInfoSection({ form, compact = false }) {
  const sectionClassName = compact
    ? "space-y-4 rounded-lg border border-orange-100 bg-white p-3 sm:p-4"
    : "space-y-6 rounded-xl border border-orange-100 bg-white p-4 sm:p-5";
  const headingClassName = compact
    ? "text-base font-semibold text-orange-800"
    : "text-lg font-semibold text-orange-800";
  const descriptionClassName = compact ? "text-xs text-gray-500" : "text-gray-500";

  return (
    <div className={sectionClassName}>
      <h3 className={headingClassName}>Restaurant Information</h3>
      
      <FormField control={form.control} name="restaurantName" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700">Restaurant Name *</FormLabel>
          <FormControl>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
              <Input placeholder="Enter restaurant name" {...field} className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="domain" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700">Domain *</FormLabel>
          <FormControl>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
              <Input placeholder="Enter domain name" {...field} className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200" />
            </div>
          </FormControl>
          <FormDescription className={descriptionClassName}>
            This will be used to generate QR code: https://{form.watch('domain') || 'your-domain'}.yourdomain.com
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  )
}
